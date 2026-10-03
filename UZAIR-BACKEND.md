# Yojana Setu: backend task (Uzair, Claude Code)

## How to use

Prompt for Claude Code:
> Read `docs/00-SETUP-AND-CONTRACT.md` and `docs/UZAIR-BACKEND.md`. Implement the backend task fully. Follow the file ownership rules strictly. Do not add packages. Do not edit `src/lib/types.ts` or `src/lib/mocks.ts`. When done, run the Definition of Done checks and fix anything that fails.

Branch: `feat/backend`. One PR into main.

## Goal

All API routes in the contract working against real Neon and Gemini, a seed scheme dataset, and smoke tests. No UI work.

## Files you own (create or edit only these)

`drizzle.config.ts`, `drizzle/**`, `src/lib/db/**`, `src/lib/ai/**`, `src/lib/server/**`, `src/app/api/**`, `src/data/**`, `scripts/**`

Do not edit `package.json`, the lockfile, `types.ts`, `mocks.ts`, layout, middleware/proxy, or any page or component.

## 1. Database (Neon + Drizzle)

`src/lib/db/index.ts`
```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
```

`src/lib/db/schema.ts`
- `households`: `id` uuid primary key (defaultRandom), `user_id` text not null unique (Clerk user id), `data` jsonb typed as `Household` not null, `created_at`, `updated_at` timestamps.
- `schemes`: `id` text primary key, `data` jsonb typed as `Scheme` not null, `source` text not null, `created_at`.

Why JSONB: the household is always read and written as one unit, so this is fastest for the MVP. We can split into tables later.

`drizzle.config.ts`: load `.env.local` with `dotenv` (`config({ path: ".env.local" })`), dialect postgresql, schema path, out `./drizzle`.

## 2. Server helpers (`src/lib/server/`)

- `validation.ts`: zod schemas mirroring `types.ts`: `memberSchema`, `householdSchema`, `schemeSchema`. Make TypeScript check they match (e.g. `const x: z.ZodType<Household> = householdSchema`). Rules: 1 to 12 members, exactly one `self`, unique member ids, `dob` is a valid date not in the future.
- `http.ts`: `ok(data, status = 200)`, `fail(message, status)`, `readBody(req, schema)` that returns a 400 response on invalid JSON or schema errors.
- `auth.ts`: `getUserId()` using `auth()` from `@clerk/nextjs/server`. Routes return `fail("Please sign in", 401)` when null.
- `household-repo.ts`: `getHousehold(userId)`, `saveHousehold(userId, household)` (upsert on `user_id`, set `updated_at`), `deleteHousehold(userId)`.
- `schemes-repo.ts`: `getAllSchemes()`, `getScheme(id)`, `upsertScheme(scheme)`, `schemeIdExists(id)`.
- `dates.ts`: `ageOn(dob, date)`.
- `privacy.ts`: `toAiHousehold(h)` returns a copy with member `name` and `district` removed, and `age` added per member. Names never go to Gemini.

Never log household data. Log only ids, counts and timings.

## 3. Gemini client (`src/lib/ai/gemini.ts`)

```ts
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
export class AiError extends Error {}
export async function generateJson<T>(opts: {
  system: string; user: string; jsonSchema: object; validate: z.ZodType<T>; temperature?: number;
}): Promise<T>
```
- Call `ai.models.generateContent` with `config: { systemInstruction, responseMimeType: "application/json", responseJsonSchema (or responseSchema, whichever the installed SDK supports, check its types), temperature: opts.temperature ?? 0.2 }`.
- Parse `res.text`, validate with zod. On failure retry once. Then throw `AiError`.
- 30 second timeout.
- Keep JSON schemas simple: objects, strings, numbers, booleans, arrays, string enums. No unions. Use `""` instead of null in AI output and convert on the server.
- If installed zod is v4, you may build the JSON schema with `z.toJSONSchema()`. Otherwise write it by hand in `src/lib/ai/schemas.ts`.

## 4. Matching (`src/lib/ai/match.ts`, prompts in `src/lib/ai/prompts.ts`)

Steps:
1. Load all schemes from DB.
2. Drop state schemes whose `state` differs from `household.state`.
3. Send Gemini: today's date, `toAiHousehold(household)`, and a compact scheme list (`id, name, level, state, eligibility, beneficiaryType, timing, benefit`).
4. Gemini returns `{ matches: [{ schemeId, memberId, window, whenText, whyEligible, nextStep, confidence, toConfirm }] }`.
5. Post-process:
   - Drop unknown `schemeId` or `memberId`.
   - Household schemes: force `memberId = null`. Individual schemes: require a valid `memberId`.
   - Dedupe by `schemeId + memberId`. Empty `toConfirm` becomes undefined.
   - Attach `scheme`.
   - `totalAnnualValue` = sum of `scheme.annualValue` over matches (household schemes once, individual schemes once per member). Amounts always come from our data, never from the model.
   - Sort by window (now, soon, later), then `annualValue` descending.
6. Return `MatchResult`.

Matching system prompt (use as is, tune only if tests fail):

```
You are an expert on Indian government welfare schemes. You help a family find every scheme each member can claim and tell them when to act.

You get TODAY's date, a household profile, and a list of schemes with eligibility rules and timing.

Rules:
1. Only use schemes from the given list. Never invent schemes, rules or amounts.
2. Check every member against every scheme. One member can match many schemes.
3. Match only if the member clearly meets the rules, or meets them except for one fact the profile does not include. In that case set confidence "medium" and write in toConfirm what to check, in one short sentence. Otherwise confidence is "high" and toConfirm is "".
4. Do not match if any known fact breaks a rule.
5. Think about the next 24 months, not only today:
   - A Class 12 student will soon apply to college. Match admission-time schemes like fee waivers and scholarships and say when, for example "During MP DTE counselling, around June 2027".
   - If a member will reach a required age within 24 months, match with window "later" and say when.
   - If a scheme has an age deadline (for example must open before age 10) and the deadline is near, use window "now" and state the deadline.
6. Windows: "now" = can apply today or within 30 days. "soon" = opens within 3 months. "later" = more than 3 months away. Always-open schemes are "now" unless the member is not eligible yet.
7. beneficiaryType "household": return one match with memberId "". beneficiaryType "individual": one match per eligible member, with that member's id.
8. Write whyEligible, whenText, nextStep and toConfirm in {LANGUAGE}. Use very simple words, as if talking to someone who left school early. Refer to members by relation ("your son", "you"), never by name.
   - whyEligible: max 2 short sentences naming the facts that make them eligible.
   - nextStep: one concrete action, for example "Get an income certificate from the tehsil office."
9. Do not state benefit amounts in your text. The app shows amounts separately.
10. If nothing matches, return an empty list.
```

`{LANGUAGE}` = "English" or "simple Hindi in Devanagari script".

## 5. Parse profile (`src/lib/ai/parse-profile.ts`)

Input: free text from voice or typing (Hindi, English or Hinglish), plus `language`. Output: `ParseProfileResult`.

Prompt rules:
- Extract only facts that are said. Never guess category, income, ration card or disability.
- The speaker is `self`. Other relations are relative to the speaker.
- If only age is given, set `dob` to Jan 1 of (current year minus age).
- Map words to enum values (e.g. "kisan" = farmer, "12th mein" = currentCourse "Class 12", education class_10).
- Income in lakh per year maps to the nearest `IncomeRange`.
- `missing`: required fields still unknown, in plain words in the user's language.

Example input: "Main Sehore se hoon, kisan hoon, umar 48. Meri patni 44 saal ki hain. Beta 17 saal ka hai, 12th mein padhta hai. Hum OBC hain, saal ki kamai lagbhag 2 lakh."

## 6. Ingest scheme (`src/lib/ai/ingest.ts`)

Input: pasted official text and optional `sourceUrl`. Gemini returns `{ isScheme: boolean, scheme: {...} }`.
- `isScheme` false: route returns 400 "This text does not look like a government scheme."
- `annualValue`: only if an amount is clearly stated. Monthly amounts times 12. Non-cash or not stated: 0. Ranges or approximate amounts: `valueIsEstimate: true`.
- `eligibility`: plain text listing every rule (age, gender, income, category, state, occupation, education).
- `id`: slug from the name. If it already exists, append `-2`, `-3`.
- `sourceUrl`: from input, else `"user-provided"`. `source: "ingested"`.
- Validate with `schemeSchema`, then `upsertScheme`.

## 7. API routes

All routes: `export const runtime = "nodejs"`. AI routes also: `export const maxDuration = 60`. In Next.js 15+, dynamic `params` is a Promise: `const { id } = await params`.

- `GET /api/household`: auth. Returns `{ household }` or `{ household: null }`.
- `PUT /api/household`: auth. Validate, save, return `{ household }`.
- `DELETE /api/household`: auth. Delete, return `{ ok: true }`.
- `POST /api/match`: validate `{ household }`, run matching. `AiError` returns 502 "Could not check schemes right now. Please try again."
- `POST /api/parse-profile`: text 3 to 2000 chars.
- `GET /api/schemes`, `GET /api/schemes/[id]` (404 if missing).
- `POST /api/schemes/ingest`: auth. Text 50 to 20000 chars.

## 8. Seed data (`src/data/schemes.json` + `scripts/seed.ts`)

30 to 40 schemes, central plus Madhya Pradesh, valid against `schemeSchema`, `source: "seed"`. Cover education, agriculture, health, women and child, pension, housing, employment, insurance.

Must include (demo depends on them): AICTE TFW, PM-KISAN, Ladli Behna, MP Mukhyamantri Medhavi Vidyarthi Yojana, Sukanya Samriddhi, Indira Gandhi National Old Age Pension, Ayushman Bharat PM-JAY, Post-Matric Scholarship for OBC, PM Ujjwala, PM Awas Yojana Gramin, PM Matru Vandana, Atal Pension, PM Jeevan Jyoti Bima, PM Suraksha Bima, PM Fasal Bima. Do not include Gaon Ki Beti (we add it live in the demo).

Data rules:
- Use only facts you are confident about. Fill `sourceUrl` with the official site.
- Unsure of an amount: best estimate and `valueIsEstimate: true`.
- Insurance, health cover, loans and savings accounts: `annualValue: 0`, describe the benefit in `benefit`.
- Eligibility must be specific: ages, gender, income limit, category, state, occupation, education.
- Uzair checks these 6 by hand on official sites before the PR: AICTE TFW, PM-KISAN, Ladli Behna, Medhavi Vidyarthi, Sukanya Samriddhi, Old Age Pension.

`scripts/seed.ts`: load `.env.local` via dotenv, validate each scheme, upsert all. Safe to run many times.

## 9. Tests

`scripts/test-api.ts` (needs `npm run dev` running; `BASE_URL` default `http://localhost:3000`; imports `DEMO_HOUSEHOLD` from `src/lib/mocks.ts`):
1. `GET /api/schemes` returns 25 or more schemes, all valid.
2. `GET /api/schemes/pm-kisan` returns 200. Unknown id returns 404.
3. `POST /api/match` with `DEMO_HOUSEHOLD` returns a valid `MatchResult`. It includes `aicte-tfw` for `m-son`, `pm-kisan` with `memberId: null`, `totalAnnualValue > 0`, and no unknown member ids.
4. `POST /api/match` with `{}` returns 400.
5. `POST /api/parse-profile` with the example in section 5 returns category `obc`, 3 or more members, and a `self` member with occupation `farmer`.
6. `GET /api/household` without auth returns 401.
7. `POST /api/schemes/ingest` without auth returns 401.

Print pass or fail per check. Exit 1 if any fail.

`scripts/test-ingest.ts`: calls the ingest function directly (no HTTP, no auth) with a sample text about Gaon Ki Beti Yojana, prints the scheme, confirms it validates. Then deletes it so the demo can add it live.

## 10. Definition of done

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` pass
- [ ] `npm run db:push` and `npm run db:seed` work on Neon
- [ ] `npm run test:api` all pass, `npm run test:ingest` prints a valid scheme
- [ ] `git diff --name-only main` shows only files you own
- [ ] PR description: what's done, how to test, known gaps
