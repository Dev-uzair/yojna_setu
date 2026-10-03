# Yojana Setu: MVP setup and shared contract

Both agents (Claude Code for Uzair, Antigravity for Shawaiz) must read this file first and follow it strictly.

## 1. What we are building

Yojana Setu tells a family which government schemes each member can claim, how much it is worth per year, and when to act.

MVP flow:
1. User signs in (Clerk, Google sign-in).
2. Onboarding: household details and family members. Can be filled by voice or text (AI fills the form, user checks it).
3. Dashboard: total rupees per year the family can claim, plus a timeline: Act now / Next 3 months / Coming up.
4. Scheme drawer: why eligible, documents checklist, how to apply, source link.
5. Add scheme: paste an official scheme page, AI turns it into structured data, family is matched against it.
6. Delete my data.

Not in MVP: phone OTP, Fill Guide, notifications, govt jobs, PDF upload.

Stack: Next.js App Router + TypeScript (already bootstrapped), Tailwind, Clerk, Neon Postgres + Drizzle, Gemini via `@google/genai`, zod.

## 2. Step 0: shared setup (Shawaiz, on main, before branching, ~15 min)

1. Check layout. If the project has no `src/` folder, drop the `src/` prefix in all paths in all three docs.
2. Install everything now, so Uzair never touches `package.json`:
   ```bash
   npm i @clerk/nextjs @google/genai @neondatabase/serverless drizzle-orm zod dotenv
   npm i -D drizzle-kit tsx
   ```
3. Add scripts to `package.json`:
   ```json
   "typecheck": "tsc --noEmit",
   "db:generate": "drizzle-kit generate",
   "db:push": "drizzle-kit push",
   "db:seed": "tsx scripts/seed.ts",
   "test:api": "tsx scripts/test-api.ts",
   "test:ingest": "tsx scripts/test-ingest.ts"
   ```
4. Create `.env.example` (each person creates their own `.env.local`, never committed):
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
   DATABASE_URL=            # Neon pooled connection string
   GEMINI_API_KEY=          # paid tier preferred (free tier may use prompts to improve Google products)
   GEMINI_MODEL=gemini-2.5-flash
   NEXT_PUBLIC_USE_MOCKS=true
   ```
5. Clerk wiring:
   - Wrap the body content of `src/app/layout.tsx` in `<ClerkProvider>`.
   - Add the middleware below. Next.js 16 uses `src/proxy.ts`. Next.js 15 or older uses `src/middleware.ts`. Same code, only the file name differs.
   - Only pages are protected in middleware. API routes check auth themselves and return JSON 401.
   ```ts
   import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

   const isProtectedPage = createRouteMatcher(["/onboarding(.*)", "/dashboard(.*)", "/add-scheme(.*)"]);

   export default clerkMiddleware(async (auth, req) => {
     if (isProtectedPage(req)) await auth.protect();
   });

   export const config = {
     matcher: [
       "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
       "/(api|trpc)(.*)",
     ],
   };
   ```
6. Create `src/lib/types.ts` and `src/lib/mocks.ts` exactly as in sections 4 and 6.
7. Copy all three docs into `docs/`.
8. `npm run typecheck && npm run build` must pass. Commit `chore: shared setup and contract`, push to main.
9. Branch:
   - Uzair: `git checkout -b feat/backend`
   - Shawaiz: `git checkout -b feat/frontend`

## 3. File ownership (how we avoid conflicts)

| Owner | Files |
|---|---|
| Frozen after step 0 | `package.json` scripts, `.env.example`, `src/lib/types.ts`, `src/lib/mocks.ts`, middleware/proxy file, `docs/**` |
| Uzair | `drizzle.config.ts`, `drizzle/**`, `src/lib/db/**`, `src/lib/ai/**`, `src/lib/server/**`, `src/app/api/**`, `src/data/**`, `scripts/**` |
| Shawaiz | `src/app/page.tsx`, `src/app/layout.tsx` (visual parts only, keep ClerkProvider), `src/app/globals.css`, `src/app/sign-in/**`, `src/app/sign-up/**`, `src/app/onboarding/**`, `src/app/dashboard/**`, `src/app/add-scheme/**`, `src/components/**`, `src/hooks/**`, `src/lib/api-client.ts`, `src/lib/i18n.ts`, `src/lib/labels.ts`, `src/lib/format.ts`, `public/**` |

Rules:
- Never edit a file you don't own. Need a change? Message the other person.
- Frozen files change only if both agree. One person commits to main, both rebase.
- After step 0, only Shawaiz may add packages (UI only). Uzair adds none.
- Before opening a PR, run `git diff --name-only main` and confirm every file is in your list.

## 4. Shared types: `src/lib/types.ts`

```ts
// Shared contract. Frozen after step 0.

export type Language = "en" | "hi";

export type Relation =
  | "self" | "spouse" | "son" | "daughter" | "father" | "mother"
  | "grandfather" | "grandmother" | "brother" | "sister" | "other";

export type Gender = "male" | "female" | "other";
export type MaritalStatus = "single" | "married" | "widowed" | "divorced";

export type Education =
  | "none" | "primary" | "class_8" | "class_10" | "class_12"
  | "diploma" | "graduate" | "postgraduate";

export type Occupation =
  | "student" | "farmer" | "salaried" | "self_employed" | "daily_wage"
  | "homemaker" | "unemployed" | "retired" | "other";

export type SocialCategory = "general" | "ews" | "obc" | "sc" | "st";

export type IncomeRange =
  | "upto_1l" | "1l_to_2_5l" | "2_5l_to_5l" | "5l_to_8l" | "above_8l";

export type Area = "rural" | "urban";
export type RationCard = "none" | "apl" | "bpl" | "aay";

export interface Member {
  id: string;               // crypto.randomUUID() on the client
  relation: Relation;       // relation to the "self" member
  name: string;             // UI only. Never sent to Gemini.
  dob: string;              // "YYYY-MM-DD". If only age is known, use Jan 1 of the birth year.
  gender: Gender;
  maritalStatus: MaritalStatus;
  education: Education;     // highest completed
  occupation: Occupation;
  currentCourse?: string;   // e.g. "Class 12", "B.Tech 1st year"
  disability: boolean;
}

export interface Household {
  state: string;            // e.g. "Madhya Pradesh"
  district?: string;
  area: Area;
  category: SocialCategory;
  incomeRange: IncomeRange; // total family income per year
  ownsFarmland: boolean;
  rationCard: RationCard;
  language: Language;       // language for AI-written text
  members: Member[];        // 1 to 12, exactly one "self"
}

export type SchemeCategory =
  | "education" | "agriculture" | "health" | "women_child"
  | "pension" | "housing" | "employment" | "insurance" | "other";

export interface Scheme {
  id: string;               // slug, e.g. "pm-kisan"
  name: string;
  nameHi?: string;
  level: "central" | "state";
  state?: string;           // only for state schemes
  category: SchemeCategory;
  summary: string;          // 1 to 2 plain sentences
  benefit: string;          // what the person gets
  annualValue: number;      // INR per beneficiary per year. 0 if not cash (insurance, loans, savings)
  valueIsEstimate: boolean;
  beneficiaryType: "individual" | "household";
  eligibility: string;      // plain-text rules
  documents: string[];
  applyMode: "online" | "offline" | "both";
  applyUrl?: string;
  submitAt?: string;        // office for offline applications
  timing: {
    type: "always_open" | "annual_window" | "life_event";
    opensMonth?: number;    // 1 to 12
    closesMonth?: number;   // 1 to 12
    note?: string;          // e.g. "During MP DTE counselling after Class 12"
  };
  sourceUrl: string;
  source: "seed" | "ingested";
}

export type MatchWindow = "now" | "soon" | "later";
// now: apply today or within 30 days. soon: opens within 3 months. later: more than 3 months away.

export interface SchemeMatch {
  schemeId: string;
  memberId: string | null;  // null when scheme.beneficiaryType is "household"
  window: MatchWindow;
  whenText: string;         // e.g. "During counselling, around June 2027"
  whyEligible: string;      // max 2 short sentences, in household.language
  nextStep: string;         // one concrete action
  confidence: "high" | "medium";
  toConfirm?: string;       // set when confidence is "medium"
}

export interface EnrichedMatch extends SchemeMatch {
  scheme: Scheme;
}

export interface MatchResult {
  matches: EnrichedMatch[];
  totalAnnualValue: number; // household schemes counted once, individual schemes per member
  generatedAt: string;      // ISO date
}

export interface ParseProfileResult {
  household: Partial<Omit<Household, "members">>;
  members: Partial<Omit<Member, "id">>[];
  missing: string[];        // fields the user still needs to fill, in plain words
}

export interface ApiError {
  error: string;
}
```

## 5. API contract

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/household` | yes | none | `{ household: Household \| null }` |
| PUT | `/api/household` | yes | `{ household: Household }` | `{ household: Household }` |
| DELETE | `/api/household` | yes | none | `{ ok: true }` |
| POST | `/api/match` | no | `{ household: Household }` | `MatchResult` |
| POST | `/api/parse-profile` | no | `{ text: string; language: Language }` | `ParseProfileResult` |
| GET | `/api/schemes` | no | none | `{ schemes: Scheme[] }` |
| GET | `/api/schemes/[id]` | no | none | `{ scheme: Scheme }` |
| POST | `/api/schemes/ingest` | yes | `{ text: string; sourceUrl?: string }` | `{ scheme: Scheme }` |

Errors always return JSON `{ error: string }` with status 400 (bad input), 401 (not signed in), 404, 502 (AI failed), or 500.

`/api/match` and `/api/parse-profile` take everything in the body, so they work for guests too.

## 6. Mocks: `src/lib/mocks.ts`

Dev only. Amounts and rules here are placeholders, not verified facts.

```ts
import type {
  EnrichedMatch, Household, MatchResult, ParseProfileResult, Scheme, SchemeMatch,
} from "./types";

export const DEMO_HOUSEHOLD: Household = {
  state: "Madhya Pradesh",
  district: "Sehore",
  area: "rural",
  category: "obc",
  incomeRange: "1l_to_2_5l",
  ownsFarmland: true,
  rationCard: "bpl",
  language: "en",
  members: [
    { id: "m-self", relation: "self", name: "Ramesh", dob: "1978-03-10", gender: "male", maritalStatus: "married", education: "class_10", occupation: "farmer", disability: false },
    { id: "m-wife", relation: "spouse", name: "Sunita", dob: "1982-07-22", gender: "female", maritalStatus: "married", education: "class_8", occupation: "homemaker", disability: false },
    { id: "m-son", relation: "son", name: "Aman", dob: "2009-01-15", gender: "male", maritalStatus: "single", education: "class_10", occupation: "student", currentCourse: "Class 12", disability: false },
    { id: "m-daughter", relation: "daughter", name: "Pooja", dob: "2017-05-02", gender: "female", maritalStatus: "single", education: "primary", occupation: "student", currentCourse: "Class 3", disability: false },
    { id: "m-mother", relation: "mother", name: "Kamla", dob: "1958-11-01", gender: "female", maritalStatus: "widowed", education: "none", occupation: "homemaker", disability: false },
  ],
};

export const MOCK_SCHEMES: Scheme[] = [
  {
    id: "pm-kisan", name: "PM-KISAN", nameHi: "पीएम किसान", level: "central", category: "agriculture",
    summary: "Income support for farmer families.",
    benefit: "Money paid to the bank account in 3 installments a year.",
    annualValue: 6000, valueIsEstimate: false, beneficiaryType: "household",
    eligibility: "Farmer family that owns cultivable land. Income tax payers and government employees are not eligible.",
    documents: ["Aadhaar card", "Land records", "Bank passbook"],
    applyMode: "online", applyUrl: "https://pmkisan.gov.in",
    timing: { type: "always_open" }, sourceUrl: "https://pmkisan.gov.in", source: "seed",
  },
  {
    id: "aicte-tfw", name: "AICTE Tuition Fee Waiver (TFW)", level: "central", category: "education",
    summary: "Tuition fee waiver in technical courses for students from low-income families.",
    benefit: "Tuition fee waived for the whole course.",
    annualValue: 80000, valueIsEstimate: true, beneficiaryType: "individual",
    eligibility: "Admitted to an AICTE-approved technical course through state counselling. Family income below 8 lakh per year.",
    documents: ["Income certificate", "Class 12 marksheet", "Domicile certificate"],
    applyMode: "online", applyUrl: "https://dte.mponline.gov.in",
    timing: { type: "life_event", note: "During MP DTE counselling after Class 12" },
    sourceUrl: "https://www.aicte-india.org", source: "seed",
  },
  {
    id: "mp-ladli-behna", name: "Ladli Behna Yojana", level: "state", state: "Madhya Pradesh", category: "women_child",
    summary: "Monthly financial help for women in Madhya Pradesh.",
    benefit: "Monthly money sent to the woman's bank account.",
    annualValue: 15000, valueIsEstimate: true, beneficiaryType: "individual",
    eligibility: "Married, widowed, divorced or abandoned women aged 21 to 60 living in MP. Family income below 2.5 lakh. No family member pays income tax.",
    documents: ["Samagra ID", "Aadhaar card", "Bank account linked to Aadhaar"],
    applyMode: "offline", submitAt: "Camp at gram panchayat or ward office",
    timing: { type: "annual_window", note: "Registration happens in camps announced by the state" },
    sourceUrl: "https://cmladlibahna.mp.gov.in", source: "seed",
  },
  {
    id: "nsap-old-age-pension", name: "Indira Gandhi National Old Age Pension", level: "central", category: "pension",
    summary: "Monthly pension for elderly people from poor families.",
    benefit: "Monthly pension to the bank account.",
    annualValue: 7200, valueIsEstimate: true, beneficiaryType: "individual",
    eligibility: "Age 60 or above. Family is below poverty line.",
    documents: ["Age proof", "BPL card", "Aadhaar card", "Bank passbook"],
    applyMode: "offline", submitAt: "Gram panchayat or janpad panchayat office",
    timing: { type: "always_open" }, sourceUrl: "https://nsap.nic.in", source: "seed",
  },
  {
    id: "ayushman-bharat", name: "Ayushman Bharat PM-JAY", level: "central", category: "health",
    summary: "Free hospital treatment for eligible families.",
    benefit: "Free treatment up to 5 lakh per family per year at listed hospitals.",
    annualValue: 0, valueIsEstimate: false, beneficiaryType: "household",
    eligibility: "Families in the government beneficiary list, as per central and state rules.",
    documents: ["Aadhaar card", "Ration card"],
    applyMode: "both", applyUrl: "https://beneficiary.nha.gov.in", submitAt: "Common Service Centre or listed hospital",
    timing: { type: "always_open" }, sourceUrl: "https://nha.gov.in/PM-JAY", source: "seed",
  },
  {
    id: "sukanya-samriddhi", name: "Sukanya Samriddhi Yojana", level: "central", category: "women_child",
    summary: "High-interest savings account for a girl child.",
    benefit: "Savings account with high interest and tax benefits.",
    annualValue: 0, valueIsEstimate: false, beneficiaryType: "individual",
    eligibility: "Girl child below 10 years. Account opened by a parent or guardian.",
    documents: ["Girl's birth certificate", "Parent's Aadhaar and PAN", "Address proof"],
    applyMode: "offline", submitAt: "Post office or bank",
    timing: { type: "life_event", note: "Must be opened before the girl turns 10" },
    sourceUrl: "https://www.nsiindia.gov.in", source: "seed",
  },
];

const enrich = (m: SchemeMatch): EnrichedMatch => ({
  ...m,
  scheme: MOCK_SCHEMES.find((s) => s.id === m.schemeId)!,
});

export const MOCK_MATCH_RESULT: MatchResult = {
  generatedAt: "2026-10-03T10:00:00.000Z",
  totalAnnualValue: 6000 + 80000 + 15000 + 7200,
  matches: [
    enrich({ schemeId: "pm-kisan", memberId: null, window: "now", whenText: "You can apply any time.", whyEligible: "You are a farmer and your family owns farmland.", nextStep: "Register on the PM-KISAN portal with Aadhaar and land records.", confidence: "high" }),
    enrich({ schemeId: "nsap-old-age-pension", memberId: "m-mother", window: "now", whenText: "You can apply any time.", whyEligible: "Your mother is above 60 and your family has a BPL card.", nextStep: "Take her age proof and BPL card to the gram panchayat.", confidence: "high" }),
    enrich({ schemeId: "sukanya-samriddhi", memberId: "m-daughter", window: "now", whenText: "Before May 2027, when your daughter turns 10.", whyEligible: "Your daughter is below 10 years old.", nextStep: "Open the account at the post office with her birth certificate.", confidence: "high" }),
    enrich({ schemeId: "ayushman-bharat", memberId: null, window: "now", whenText: "You can check any time.", whyEligible: "Families with a BPL ration card often qualify.", nextStep: "Check your family's name on the Ayushman portal.", confidence: "medium", toConfirm: "Check if your family is in the beneficiary list." }),
    enrich({ schemeId: "mp-ladli-behna", memberId: "m-wife", window: "soon", whenText: "When the next registration camp opens.", whyEligible: "Your wife is between 21 and 60, married and lives in MP.", nextStep: "Make sure her Samagra ID is linked to her bank account.", confidence: "medium", toConfirm: "Check that no family member pays income tax." }),
    enrich({ schemeId: "aicte-tfw", memberId: "m-son", window: "later", whenText: "During MP DTE counselling after Class 12, around June 2027.", whyEligible: "Your son is in Class 12 and your family income is below the limit.", nextStep: "Get an income certificate before counselling starts.", confidence: "high" }),
  ],
};

export const MOCK_PARSE_RESULT: ParseProfileResult = {
  household: { state: "Madhya Pradesh", district: "Sehore", area: "rural", category: "obc", incomeRange: "1l_to_2_5l", ownsFarmland: true },
  members: [
    { relation: "self", dob: "1978-01-01", gender: "male", occupation: "farmer" },
    { relation: "spouse", dob: "1982-01-01", gender: "female", maritalStatus: "married" },
    { relation: "son", dob: "2009-01-01", gender: "male", occupation: "student", currentCourse: "Class 12" },
  ],
  missing: ["Ration card type", "Names of family members", "Education of each member"],
};

export const MOCK_INGESTED_SCHEME: Scheme = {
  id: "mp-gaon-ki-beti", name: "Gaon Ki Beti Yojana", level: "state", state: "Madhya Pradesh", category: "education",
  summary: "Help for village girls who join college after Class 12.",
  benefit: "Monthly help for 10 months of each college year.",
  annualValue: 5000, valueIsEstimate: true, beneficiaryType: "individual",
  eligibility: "Girl from a village in MP who passed Class 12 with good marks and joined college.",
  documents: ["Class 12 marksheet", "College admission proof", "Domicile certificate"],
  applyMode: "online", applyUrl: "https://scholarshipportal.mp.nic.in",
  timing: { type: "annual_window", note: "After college admission" },
  sourceUrl: "user-provided", source: "ingested",
};
```

## 7. Merge plan

1. Uzair opens PR `feat/backend` into main. Must pass: `typecheck`, `lint`, `build`, `db:push`, `db:seed`, `test:api`, `test:ingest`.
2. Merge it.
3. Shawaiz rebases `feat/frontend` on main (no conflicts expected), sets `NEXT_PUBLIC_USE_MOCKS=false`, runs the checklist below, opens PR, merge.

## 8. Final end-to-end checklist (both, after merge)

1. New user signs up with Google and lands on `/onboarding`.
2. Speak or type a Hindi description of the family. Form fills. Fix missing fields. Save.
3. Reload. Household is still there (from Neon).
4. Dashboard shows the rupee total and all three timeline sections. Son gets TFW.
5. Drawer opens. Document ticks stay after reload.
6. Add scheme: paste text of a scheme not in the seed. It gets extracted. Dashboard re-matches and highlights it if the family qualifies.
7. Switch to Hindi, save again. UI and AI text are in Hindi.
8. Delete my data works. Dashboard sends you to onboarding.
9. Sign out. `/dashboard` redirects to sign-in.
10. Everything works at 360px width.
11. Rehearse the demo with "Use demo family".
