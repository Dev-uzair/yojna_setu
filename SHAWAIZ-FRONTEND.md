# Yojana Setu: frontend task (Shawaiz, Google Antigravity)

## How to use

Prompt for the Antigravity agent:
> Read `docs/00-SETUP-AND-CONTRACT.md` and `docs/SHAWAIZ-FRONTEND.md`. Implement the frontend task fully, using mock data (`NEXT_PUBLIC_USE_MOCKS=true`). Follow the file ownership rules strictly. Never touch `src/app/api/**`, `src/lib/db|ai|server/**`, `src/data/**`, `scripts/**`, `types.ts` or `mocks.ts`. When done, run the Definition of Done checks and fix anything that fails.

Branch: `feat/frontend`. One PR into main, after Uzair's PR merges.

## Goal

Every MVP screen working on mock data first, then on the real API by switching one env flag.

## Files you own

`src/app/page.tsx`, `src/app/layout.tsx` (visual parts, keep ClerkProvider), `src/app/globals.css`, `src/app/sign-in/**`, `src/app/sign-up/**`, `src/app/onboarding/**`, `src/app/dashboard/**`, `src/app/add-scheme/**`, `src/components/**`, `src/hooks/**`, `src/lib/api-client.ts`, `src/lib/i18n.ts`, `src/lib/labels.ts`, `src/lib/format.ts`, `public/**`. You may add UI packages (shadcn/ui, lucide-react).

## 1. Design direction

Users: families in small towns and villages, many on low-end Android phones, some with low reading skills. Mobile first (360px), then desktop.

Feel: a helpful, trustworthy office clerk who is on your side. Calm and clear, not a flashy startup.

Tokens:
- Neem green `#1F5F4A` (primary, buttons, header)
- Paper white `#FFFFFF` (background) and sage `#EEF3EF` (surfaces)
- Ink `#1B2430` (text)
- Haldi `#E0A100` (Act now)
- River blue `#2F6FB0` (Next 3 months)
- Stone grey `#6B7280` (Coming up)

Type: Mukta (via `next/font/google`, Latin + Devanagari subsets) for everything. It is designed for both Hindi and English. Body 17px minimum, line length under 70 characters.

The one memorable element: the family total on the dashboard, styled like a bank passbook entry (ruled line, large numerals, small "per year, estimated" label). Keep everything else quiet.

Rules:
- Tap targets 44px minimum. Icon plus text on key actions.
- Rupees in Indian format via `Intl.NumberFormat("en-IN")` (₹1,08,200).
- WCAG AA contrast, visible keyboard focus, respect reduced motion.
- Plain words. Buttons say exactly what happens ("Save and see my benefits").
- No gradients, no all-caps labels.

## 2. Data layer (`src/lib/api-client.ts`)

Functions: `getHousehold`, `saveHousehold`, `deleteHousehold`, `matchHousehold`, `parseProfile`, `listSchemes`, `getScheme`, `ingestScheme`. Types from `src/lib/types.ts`.

- Mock mode (`process.env.NEXT_PUBLIC_USE_MOCKS === "true"`): return data from `src/lib/mocks.ts` after a fake delay (600 to 1200ms, match 2500ms) so loading states are visible. Mock household is stored in `localStorage` key `ys_mock_household` and starts empty, so onboarding can be tested.
- Real mode: `fetch` the routes in the contract. On non-2xx, throw `ApiClientError(message, status)` using the body's `error`.
- Never call Gemini or the DB from the browser.

## 3. Language (`src/lib/i18n.ts`, `src/lib/labels.ts`)

- Small dictionary with `en` and `hi` for every UI string. `useLang()` hook, toggle in the header, saved in `localStorage`.
- `labels.ts`: labels in both languages for every enum (Relation, Education, Occupation, SocialCategory, IncomeRange, RationCard, Area, MaritalStatus, SchemeCategory).
- When saving, set `household.language` to the current UI language so AI text comes back in that language.

## 4. Screens

### Landing `/`
- Header: "Yojana Setu", language toggle, Sign in (Clerk) or "My dashboard" when signed in.
- Headline: "Find every government scheme your family is owed, before the deadline." (plus Hindi)
- Story, 2 to 3 lines: "One tip about a fee waiver saved a student lakhs in fees. Most families never hear these tips in time. Yojana Setu tells you."
- 3 steps: Tell us about your family. See what you can claim. Know when to apply.
- Button "Check my family": signed in goes to `/dashboard`, else `/sign-up`.
- Privacy line: "We only ask what's needed. No document uploads. Delete your data any time."

### Sign in / Sign up
Clerk `<SignIn />` at `src/app/sign-in/[[...sign-in]]/page.tsx` and `<SignUp />` at `src/app/sign-up/[[...sign-up]]/page.tsx`. Style the page around them to match.

### Onboarding `/onboarding`
Multi-step form with progress bar, Back and Next. If a household exists, prefill it (edit mode).

Top card "Fill by speaking":
- Mic button using `window.SpeechRecognition || window.webkitSpeechRecognition`, `lang` "hi-IN" or "en-IN" by UI language, live transcript shown.
- Textarea fallback "Or type about your family". Hide mic if speech is not supported.
- "Fill the form" calls `parseProfile`, merges results into form state (new members get `crypto.randomUUID()`), shows "We filled N fields. Please check them." and lists `missing`.

Steps:
1. Household: state (select, default Madhya Pradesh, all states listed), district (optional), rural or urban, category, family income per year, owns farmland, ration card (none, APL, BPL, AAY with one-line help).
2. About you (the `self` member): name, date of birth (or age that converts to Jan 1 of birth year), gender, marital status, education, occupation, current course (only if student), disability.
3. Family members: cards showing relation, name, age, occupation, with edit and remove. "Add member" opens the same member form in a sheet. Zero extra members is allowed.
4. Review: summary with edit links per section, privacy note, "Save and see my benefits" calls `saveHousehold`, clears the match cache, goes to `/dashboard`.

Inline validation (zod allowed), exactly one `self`. Small "Use demo family" link that fills `DEMO_HOUSEHOLD` (we use it in the pitch).

### Dashboard `/dashboard`
- Load `getHousehold`. If null, go to `/onboarding`. Then `matchHousehold(household)`.
- Loading: skeleton plus rotating lines ("Checking schemes for each family member", "Looking for deadlines").
- Error: clear message plus "Try again".
- Total card (passbook style): "Your family can claim about ₹1,08,200 per year", small "Estimated. Health cover and savings schemes are extra.", and "6 schemes for 5 family members".
- Member filter chips: All, then each member (relation + name) with match count. "Whole family" chip for household schemes.
- Timeline: Act now (haldi), Next 3 months (river blue), Coming up (stone grey). Stacked on mobile, 3 columns on desktop. Each has an empty state.
- Match card: scheme name, member chip or "Whole family", amount per year (or short benefit text if 0), `whenText`, "Check: {toConfirm}" badge if medium confidence, button "See how to apply".
- Header actions: Edit family, Add a scheme, Refresh.
- Menu item "Delete my data" with confirm dialog. Calls `deleteHousehold`, goes to `/onboarding`.
- Footer: "Rules and amounts can change. Always check the official site before applying."
- Cache the last `MatchResult` in `sessionStorage` (`ys_last_match`) with a hash of the household. Reuse if unchanged. Clear on save, delete, ingest, or Refresh.
- If URL has `?highlight={schemeId}`, scroll to and highlight that card. If not found, show "Your family does not qualify for this scheme."

### Scheme drawer (on dashboard)
Bottom sheet on mobile, right drawer on desktop:
- Name, Central or state name, category.
- For whom, amount per year with "estimate" tag if `valueIsEstimate`.
- Why you qualify, When, Next step (highlighted).
- Documents checklist: "I have this" checkboxes, "3 of 4 ready", saved in `localStorage` per scheme + member. Missing ones listed.
- How to apply: online shows a button to `applyUrl` (new tab), offline shows `submitAt`, both shows both.
- Source link. "Added by you" badge if `source` is "ingested".

### Add scheme `/add-scheme`
This shows judges that AI does the data work.
- Textarea "Paste the text from the official scheme page", optional source URL, short help text.
- "Read this scheme" calls `ingestScheme`, then shows the extracted scheme as a card (benefit, eligibility, documents, timing, amount).
- "Check my family for this scheme" clears the match cache and goes to `/dashboard?highlight={id}`.

## 5. Every screen
Loading, empty, error and success states. No blank screens. Buttons disabled while submitting.

## 6. Definition of done

- [ ] `npm run typecheck`, `npm run lint`, `npm run build` pass
- [ ] With mocks on, the full flow works: landing, sign in, onboarding (voice or text fill), dashboard, drawer, add scheme, highlight, delete data
- [ ] Works at 360px and 1280px
- [ ] Hindi toggle changes all UI text
- [ ] `git diff --name-only main` shows only files you own
- [ ] After Uzair's PR merges: rebase, set `NEXT_PUBLIC_USE_MOCKS=false`, run the checklist in section 8 of the setup doc, then open your PR
