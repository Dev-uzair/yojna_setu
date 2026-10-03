# Yojana Setu: fast MVP build (single developer)

**IGNORE all earlier docs (00-SETUP-AND-CONTRACT.md, UZAIR-BACKEND.md, SHAWAIZ-FRONTEND.md). This file replaces them.**

Prompt for the coding agent:
> Read `YOJANA-SETU-MVP.md` and build the whole app in this Next.js project in one go. Keep it simple. No auth, no database. Run `npm run build` at the end and fix all errors.

## What it does

A family enters its details once. The app shows which government schemes each member can claim, the total rupees per year, and a timeline: Act now / Next 3 months / Coming up.

## Cut for speed (do NOT build)

Login, database, Hindi toggle, voice input, delete data, multi-step onboarding.

## Stack

Existing Next.js App Router + TypeScript + Tailwind. Install only:
```bash
npm i @google/genai zod
```
`.env.local`:
```
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```
Family data is saved in the browser (`localStorage` key `ys_household`). Nothing is stored on the server.

## Files

```
src/lib/types.ts
src/lib/demo.ts                 # demo family
src/data/schemes.json           # 15 to 20 schemes
src/lib/gemini.ts
src/app/api/match/route.ts
src/app/api/ingest/route.ts     # stretch, build last
src/app/page.tsx                # landing + family form
src/app/dashboard/page.tsx      # results
src/components/...              # FamilyForm, MemberRow, TotalCard, Timeline, MatchCard, SchemeDrawer
```
(If the project has no `src/`, drop the prefix.)

## 1. Types (`src/lib/types.ts`)

```ts
export type Member = {
  id: string;
  relation: "self" | "spouse" | "son" | "daughter" | "father" | "mother" | "other";
  name: string;             // UI only, never sent to Gemini
  age: number;
  gender: "male" | "female";
  maritalStatus: "single" | "married" | "widowed";
  education: "none" | "primary" | "class_10" | "class_12" | "graduate";
  occupation: "student" | "farmer" | "salaried" | "self_employed" | "daily_wage" | "homemaker" | "unemployed";
  currentCourse?: string;   // e.g. "Class 12"
};

export type Household = {
  state: string;            // default "Madhya Pradesh"
  area: "rural" | "urban";
  category: "general" | "ews" | "obc" | "sc" | "st";
  annualIncome: number;     // rupees per year
  ownsFarmland: boolean;
  rationCard: "none" | "apl" | "bpl";
  members: Member[];
};

export type Scheme = {
  id: string;
  name: string;
  level: "central" | "state";
  state?: string;
  summary: string;
  benefit: string;
  annualValue: number;      // rupees per beneficiary per year, 0 if not cash
  beneficiaryType: "individual" | "household";
  eligibility: string;
  documents: string[];
  howToApply: string;       // e.g. "Online at pmkisan.gov.in" or "At gram panchayat"
  timing: string;           // e.g. "Always open", "During MP DTE counselling after Class 12"
  sourceUrl: string;
};

export type Match = {
  schemeId: string;
  memberId: string | null;  // null for household schemes
  window: "now" | "soon" | "later";
  whenText: string;
  whyEligible: string;
  nextStep: string;
};

export type MatchResult = {
  matches: (Match & { scheme: Scheme })[];
  totalAnnualValue: number;
};
```

## 2. Demo family (`src/lib/demo.ts`)

Madhya Pradesh, rural, OBC, income 200000, owns farmland, BPL card. Members:
- self, Ramesh, 48, male, married, class_10, farmer
- spouse, Sunita, 44, female, married, primary, homemaker
- son, Aman, 17, male, single, class_10, student, currentCourse "Class 12"
- daughter, Pooja, 9, female, single, primary, student
- mother, Kamla, 67, female, widowed, none, homemaker

## 3. Scheme data (`src/data/schemes.json`)

15 to 20 schemes, central plus Madhya Pradesh. Must include: AICTE Tuition Fee Waiver (TFW), PM-KISAN, Ladli Behna (MP), Mukhyamantri Medhavi Vidyarthi Yojana (MP), Sukanya Samriddhi, Indira Gandhi National Old Age Pension, Ayushman Bharat PM-JAY, Post-Matric Scholarship OBC, PM Ujjwala, PM Awas Yojana Gramin, PM Fasal Bima, PM Jeevan Jyoti Bima, PM Suraksha Bima, Atal Pension.

Rules: use only facts you are confident about. Insurance, health cover, loans and savings get `annualValue: 0`. Use official sites in `sourceUrl`. Do NOT include Gaon Ki Beti Yojana (we add it live in the demo).

## 4. Gemini (`src/lib/gemini.ts`)

`generateJson(system, user)` using `@google/genai`: `ai.models.generateContent({ model, contents: user, config: { systemInstruction: system, responseMimeType: "application/json", temperature: 0.2 } })`, then `JSON.parse(res.text)`. Retry once on bad JSON. 30 second timeout.

## 5. Match API (`POST /api/match`)

Body `{ household }`. Steps:
1. Validate with zod. 400 on bad input.
2. Load schemes, drop state schemes for other states.
3. Remove member names before sending to Gemini.
4. Call Gemini with the prompt below, today's date, household, schemes.
5. Clean up: drop unknown scheme or member ids, household schemes get `memberId: null`, remove duplicates, attach scheme.
6. `totalAnnualValue` = sum of `scheme.annualValue` (household schemes once, individual per member). Amounts always from our data.
7. Sort: now, soon, later, then value high to low. Return `MatchResult`. On Gemini failure return 502 `{ error }`.

`export const maxDuration = 60;`

Prompt:
```
You are an expert on Indian government welfare schemes. Find every scheme each family member can claim and say when to act.
Return JSON: { "matches": [ { "schemeId", "memberId", "window", "whenText", "whyEligible", "nextStep" } ] }

Rules:
1. Only use schemes from the list. Never invent schemes or rules.
2. Check every member against every scheme. Match only if they clearly meet the rules.
3. Think about the next 24 months. A Class 12 student will soon apply to college, so match admission schemes like fee waivers and say when (e.g. "During MP DTE counselling, around June 2027"). Age deadlines that are near (e.g. account must open before age 10) are "now".
4. window: "now" = can apply within 30 days. "soon" = within 3 months. "later" = after that.
5. Household schemes: one match with memberId "". Individual schemes: one match per eligible member.
6. Simple English, short sentences. Refer to members by relation ("your son", "you"), never by name. Do not state benefit amounts.
```

## 6. Screens

Style: mobile first, clean and calm. Primary green `#1F5F4A`, white background, accent `#E0A100` for Act now, blue `#2F6FB0` for Next 3 months, grey for Coming up. Big readable text, buttons 44px tall. Rupees with `Intl.NumberFormat("en-IN")`.

**Home `/`** (single page)
- Headline: "Find every government scheme your family is owed, before the deadline."
- One line story: "One tip about a fee waiver saved a student lakhs. Most families never hear it in time."
- Family form on the same page: household fields at the top, then member rows (add/remove member). Big button "Use demo family" that fills the demo.
- "Show my benefits": save to `localStorage`, go to `/dashboard`.
- Line: "Your data stays on your phone. No document uploads."

**Dashboard `/dashboard`**
- Read household from `localStorage`. If none, go to `/`. Call `/api/match`.
- Loading state with text "Checking schemes for each family member...". Error state with "Try again".
- Top card: "Your family can claim about ₹X per year" + small "Estimated. Health cover and savings schemes are extra." + "N schemes for M members".
- Three sections: Act now / Next 3 months / Coming up. Stacked on mobile, 3 columns on desktop.
- Match card: scheme name, member name + relation (or "Whole family"), amount per year (or benefit text if 0), whenText, button "How to apply".
- Clicking opens a drawer: why you qualify, when, next step, documents checklist (checkboxes, local only), how to apply, source link.
- Buttons: "Edit family" (back to `/`), "Add a scheme" (stretch).

## 7. Stretch (only if time is left): Add scheme

`POST /api/ingest` with `{ text }`: Gemini turns pasted scheme text into a `Scheme`. Save it in `localStorage` key `ys_extra_schemes`; dashboard sends extra schemes in the match body (`{ household, extraSchemes }`) and the API merges them with the JSON list. Page `/add-scheme`: textarea, "Read this scheme", show result card, "Check my family" goes back to dashboard.

Demo use: paste Gaon Ki Beti Yojana text live to show "AI structures the data, not humans."

## 8. Done when

- `npm run build` passes
- Demo family shows results in all three sections, son gets TFW, total is above zero
- Works at 360px width
