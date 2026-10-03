import { NextResponse } from "next/server";
import { z } from "zod";
import baseSchemes from "@/data/schemes.json";
import { generateJson } from "@/lib/gemini";
import type { Household, Match, MatchResult, Scheme } from "@/lib/types";

export const maxDuration = 60;

const MemberSchema = z.object({
  id: z.string(),
  relation: z.enum(["self", "spouse", "son", "daughter", "father", "mother", "other"]),
  name: z.string(),
  age: z.number().int().nonnegative(),
  gender: z.enum(["male", "female"]),
  maritalStatus: z.enum(["single", "married", "widowed"]),
  education: z.enum(["none", "primary", "class_10", "class_12", "graduate"]),
  occupation: z.enum(["student", "farmer", "salaried", "self_employed", "daily_wage", "homemaker", "unemployed"]),
  currentCourse: z.string().optional(),
});

const HouseholdSchema = z.object({
  state: z.string(),
  area: z.enum(["rural", "urban"]),
  category: z.enum(["general", "ews", "obc", "sc", "st"]),
  annualIncome: z.number().nonnegative(),
  ownsFarmland: z.boolean(),
  rationCard: z.enum(["none", "apl", "bpl"]),
  members: z.array(MemberSchema).min(1),
});

const SchemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["central", "state"]),
  state: z.string().optional(),
  summary: z.string(),
  benefit: z.string(),
  annualValue: z.number().nonnegative(),
  beneficiaryType: z.enum(["individual", "household"]),
  eligibility: z.string(),
  documents: z.array(z.string()),
  howToApply: z.string(),
  timing: z.string(),
  sourceUrl: z.string(),
});

const RequestBodySchema = z.object({
  household: HouseholdSchema,
  extraSchemes: z.array(SchemeSchema).optional(),
});

// Deterministic rule matcher for offline / demo readiness
function computeFallbackMatches(household: Household, schemes: Scheme[]): Match[] {
  const matches: Match[] = [];
  const selfMember = household.members.find((m) => m.relation === "self");
  const spouseMember = household.members.find((m) => m.relation === "spouse");
  const sonMember = household.members.find((m) => m.relation === "son");
  const daughterMember = household.members.find((m) => m.relation === "daughter");
  const motherMember = household.members.find((m) => m.relation === "mother");

  // PM-KISAN: farming household with farmland
  if (household.ownsFarmland && household.members.some((m) => m.occupation === "farmer")) {
    matches.push({
      schemeId: "pm-kisan",
      memberId: null,
      window: "now",
      whenText: "Applications are open right now.",
      whyEligible: "Your family cultivates agricultural land and has a farmer household head.",
      nextStep: "Register online on pmkisan.gov.in using Aadhaar and land revenue records (Khasra).",
    });
  }

  // AICTE TFW: student in class 12 or technical course with income < 8L
  household.members.forEach((m) => {
    if (
      (m.currentCourse?.toLowerCase().includes("12") || m.education === "class_12" || m.occupation === "student") &&
      household.annualIncome <= 800000 &&
      m.age >= 16 &&
      m.age <= 22
    ) {
      matches.push({
        schemeId: "aicte-tfw",
        memberId: m.id,
        window: "later",
        whenText: "During MP DTE counselling after Class 12, around June-August.",
        whyEligible: `${m.relation === "self" ? "You are" : `Your ${m.relation} is`} in Class 12 and your family income is under ₹8,00,000.`,
        nextStep: "Procure an updated family Income Certificate from the Tehsildar before counselling starts.",
      });
    }
  });

  // MP Ladli Behna: resident woman 21-60 in MP, married/widowed, income < 2.5L
  if (household.state.toLowerCase().includes("madhya pradesh") && household.annualIncome <= 250000) {
    household.members.forEach((m) => {
      if (
        m.gender === "female" &&
        m.age >= 21 &&
        m.age <= 60 &&
        (m.maritalStatus === "married" || m.maritalStatus === "widowed")
      ) {
        matches.push({
          schemeId: "mp-ladli-behna",
          memberId: m.id,
          window: "soon",
          whenText: "During the upcoming state registration camp.",
          whyEligible: `${m.relation === "self" ? "You are" : `Your ${m.relation} is`} a resident woman aged between 21 and 60 with family income below ₹2.5 Lakh.`,
          nextStep: "Ensure her Samagra ID and Aadhaar are linked with active bank DBT.",
        });
      }
    });
  }

  // Sukanya Samriddhi: girl child age < 10
  household.members.forEach((m) => {
    if (m.gender === "female" && m.age < 10) {
      matches.push({
        schemeId: "sukanya-samriddhi",
        memberId: m.id,
        window: "now",
        whenText: `Before ${m.relation === "self" ? "you reach" : `your ${m.relation} reaches`} age 10.`,
        whyEligible: `${m.relation === "self" ? "You are" : `Your ${m.relation} is`} a girl child under 10 years of age.`,
        nextStep: "Open the SSY account at the nearest post office with her birth certificate and parent's Aadhaar.",
      });
    }
  });

  // IGNOAPS: elderly citizen 60+ in BPL family
  if (household.rationCard === "bpl") {
    household.members.forEach((m) => {
      if (m.age >= 60) {
        matches.push({
          schemeId: "nsap-old-age-pension",
          memberId: m.id,
          window: "now",
          whenText: "Applications are accepted year-round.",
          whyEligible: `${m.relation === "self" ? "You are" : `Your ${m.relation} is`} aged 60 or above and your household holds a BPL ration card.`,
          nextStep: "Submit age proof, BPL card copy, and bank passbook to the Gram Panchayat secretary.",
        });
      }
    });
  }

  // Ayushman Bharat PM-JAY: BPL household
  if (household.rationCard === "bpl") {
    matches.push({
      schemeId: "ayushman-bharat",
      memberId: null,
      window: "now",
      whenText: "Open anytime for e-KYC and Ayushman card creation.",
      whyEligible: "Your family possesses a BPL ration card qualifying for central health coverage.",
      nextStep: "Generate Ayushman Cards for all family members at the nearest CSC center or empaneled hospital.",
    });
  }

  // Post Matric OBC: OBC student class 11+
  if (household.category === "obc" && household.annualIncome <= 250000) {
    household.members.forEach((m) => {
      if (
        (m.currentCourse?.toLowerCase().includes("12") || m.education === "class_10" || m.education === "class_12") &&
        m.occupation === "student"
      ) {
        matches.push({
          schemeId: "post-matric-obc",
          memberId: m.id,
          window: "soon",
          whenText: "Opens with the academic admissions cycle (July-September).",
          whyEligible: `${m.relation === "self" ? "You are" : `Your ${m.relation} is`} an OBC student pursuing post-matric studies with family income under ₹2.5 Lakh.`,
          nextStep: "Prepare the digital OBC caste certificate and income certificate for portal submission.",
        });
      }
    });
  }

  // PM Ujjwala 2.0: BPL household
  if (household.rationCard === "bpl") {
    matches.push({
      schemeId: "pm-ujjwala",
      memberId: null,
      window: "now",
      whenText: "Applications are open year-round.",
      whyEligible: "Your household holds a BPL ration card and qualifies for a subsidized LPG connection in the name of an adult woman.",
      nextStep: "Apply online at pmuy.gov.in or visit the nearest Indane/Bharat/HP Gas agency with Aadhaar and ration card.",
    });
  }

  // PM Fasal Bima: farmer with land
  if (household.ownsFarmland && household.members.some((m) => m.occupation === "farmer")) {
    matches.push({
      schemeId: "pm-fasal-bima",
      memberId: null,
      window: "soon",
      whenText: "Before the seasonal cut-off date (July 31 for Kharif / Dec 31 for Rabi).",
      whyEligible: "Your family owns agricultural land and is engaged in farming.",
      nextStep: "Enroll notified crops via your Kisan Credit Card (KCC) bank branch or the PMFBY portal.",
    });
  }

  // Ingested schemes support: Gaon Ki Beti Yojana if present
  const gaonKiBeti = schemes.find((s) => s.id === "mp-gaon-ki-beti");
  if (gaonKiBeti && household.area === "rural" && household.state.toLowerCase().includes("madhya pradesh")) {
    household.members.forEach((m) => {
      if (m.gender === "female" && (m.currentCourse?.toLowerCase().includes("12") || m.education === "class_12")) {
        matches.push({
          schemeId: "mp-gaon-ki-beti",
          memberId: m.id,
          window: "later",
          whenText: "After Class 12 college admission is finalized.",
          whyEligible: `${m.relation === "self" ? "You are" : `Your ${m.relation} is`} a village girl completing Class 12 and entering college.`,
          nextStep: "Apply on the MP State Scholarship portal upon receiving college admission.",
        });
      }
    });
  }

  return matches;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const parseResult = RequestBodySchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid household data", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { household, extraSchemes = [] } = parseResult.data;

    // Load schemes and merge extra ingested schemes
    const allSchemes: Scheme[] = [...(baseSchemes as Scheme[]), ...extraSchemes];

    // Filter schemes: drop state schemes for other states
    const relevantSchemes = allSchemes.filter((scheme) => {
      if (scheme.level === "central") return true;
      if (scheme.level === "state" && scheme.state) {
        return scheme.state.toLowerCase() === household.state.toLowerCase();
      }
      return true;
    });

    const schemeMap = new Map<string, Scheme>(relevantSchemes.map((s) => [s.id, s]));
    const memberIdSet = new Set(household.members.map((m) => m.id));

    let rawMatches: Match[] = [];

    // Check if Gemini API Key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        // Strip names from members before sending to Gemini for privacy
        const anonymizedMembers = household.members.map(({ id, relation, age, gender, maritalStatus, education, occupation, currentCourse }) => ({
          id,
          relation,
          age,
          gender,
          maritalStatus,
          education,
          occupation,
          currentCourse,
        }));

        const anonymizedHousehold = {
          state: household.state,
          area: household.area,
          category: household.category,
          annualIncome: household.annualIncome,
          ownsFarmland: household.ownsFarmland,
          rationCard: household.rationCard,
          members: anonymizedMembers,
        };

        const systemPrompt = `You are an expert on Indian government welfare schemes. Find every scheme each family member can claim and say when to act.
Return JSON: { "matches": [ { "schemeId": "...", "memberId": "...", "window": "now"|"soon"|"later", "whenText": "...", "whyEligible": "...", "nextStep": "..." } ] }

Rules:
1. Only use schemes from the list provided. Never invent schemes or rules.
2. Check every member against every scheme. Match only if they clearly meet the rules.
3. Think about the next 24 months. A Class 12 student will soon apply to college, so match admission schemes like fee waivers (e.g. "aicte-tfw") and say when (e.g. "During MP DTE counselling after Class 12, around June-August"). Age deadlines that are near (e.g. girl child turning 10 soon for "sukanya-samriddhi") are "now".
4. window: "now" = can apply within 30 days. "soon" = within 3 months. "later" = after that.
5. Household schemes: one match with memberId "". Individual schemes: one match per eligible member using member ID.
6. Simple English, short sentences. Refer to members by relation ("your son", "your daughter", "your mother", "you"), never by name. Do not state benefit amounts.`;

        const userPrompt = JSON.stringify({
          todayDate: new Date().toISOString().split("T")[0],
          household: anonymizedHousehold,
          availableSchemes: relevantSchemes.map((s) => ({
            id: s.id,
            name: s.name,
            level: s.level,
            state: s.state,
            beneficiaryType: s.beneficiaryType,
            eligibility: s.eligibility,
            timing: s.timing,
            annualValue: s.annualValue,
          })),
        });

        const geminiResponse = await generateJson<{ matches: Match[] }>(systemPrompt, userPrompt);
        if (geminiResponse && Array.isArray(geminiResponse.matches)) {
          rawMatches = geminiResponse.matches;
        }
      } catch (geminiError: unknown) {
        console.error("Gemini matching failed, falling back to deterministic matcher:", geminiError);
        // Fall back to rule-based matcher if Gemini fails
        rawMatches = computeFallbackMatches(household, relevantSchemes);
      }
    } else {
      // Offline / demo fallback when API key is not provided
      rawMatches = computeFallbackMatches(household, relevantSchemes);
    }

    // Step 5: Clean up
    // Drop unknown scheme or member ids, household schemes get memberId: null, remove duplicates, attach scheme
    const cleanedMatches: (Match & { scheme: Scheme })[] = [];
    const seenKeys = new Set<string>();

    for (const match of rawMatches) {
      const scheme = schemeMap.get(match.schemeId);
      if (!scheme) continue;

      let validMemberId: string | null = null;
      if (scheme.beneficiaryType === "household" || !match.memberId) {
        validMemberId = null;
      } else {
        if (!memberIdSet.has(match.memberId)) continue;
        validMemberId = match.memberId;
      }

      const dedupeKey = `${scheme.id}::${validMemberId ?? "household"}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      // Validate window
      const validWindow: "now" | "soon" | "later" =
        match.window === "now" || match.window === "soon" || match.window === "later"
          ? match.window
          : "now";

      cleanedMatches.push({
        schemeId: scheme.id,
        memberId: validMemberId,
        window: validWindow,
        whenText: match.whenText || scheme.timing || "Check official portal",
        whyEligible: match.whyEligible || scheme.eligibility,
        nextStep: match.nextStep || scheme.howToApply,
        scheme,
      });
    }

    // Step 6: Total annual value = sum of scheme.annualValue
    // Household schemes counted once, individual per member
    let totalAnnualValue = 0;
    const countedHouseholdSchemes = new Set<string>();

    for (const item of cleanedMatches) {
      if (item.scheme.beneficiaryType === "household") {
        if (!countedHouseholdSchemes.has(item.scheme.id)) {
          totalAnnualValue += item.scheme.annualValue;
          countedHouseholdSchemes.add(item.scheme.id);
        }
      } else {
        totalAnnualValue += item.scheme.annualValue;
      }
    }

    // Step 7: Sort: now, soon, later, then value high to low
    const windowOrder: Record<string, number> = { now: 0, soon: 1, later: 2 };
    cleanedMatches.sort((a, b) => {
      const orderDiff = windowOrder[a.window] - windowOrder[b.window];
      if (orderDiff !== 0) return orderDiff;
      return b.scheme.annualValue - a.scheme.annualValue;
    });

    const result: MatchResult = {
      matches: cleanedMatches,
      totalAnnualValue,
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Match API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
