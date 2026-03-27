# Course report — Phase 4 QA evidence (Report 2, Part 3)

**Purpose:** In-repo record for **Phase 4** (accessibility sampling, UAT, cross-browser/device, security review) so Part 3 §§3–5 claims stay verifiable.

**When to fill:** During your QA window (see **`docs/proposals/workout-tracker-build-plan.md`** §1 — ~Mar 30–Apr 10). You can save partial progress and commit as you go.

**Related:** **`docs/testing.md`**, **`docs/demo-script.md`**, **`docs/security-notes.md`**, **`docs/deployment/README.md`**, **`docs/troubleshooting.md`**.

---

## How to use this file

1. Run each section on your **staging or production** URL (or local if the rubric allows).
2. Set **Pass / Fail / N/A** and add **short notes** (browser version, date, one-line observation).
3. For **§11.F/G** automation expectations, see **`docs/testing.md`** → _Optional: OIDC regression (§11.F/G)_.
4. Commit updates on a **`docs/`** branch or with your final report PR so evidence is versioned.

---

## 0. Automated baseline (repo — optional but verifiable)

**Status:** Full suite **green** (lint, typecheck, unit/integration tests, production build, Playwright E2E).

Recorded **2026-03-27** with Postgres at **`DATABASE_URL`**, **`pnpm run db:migrate`**, **`pnpm run db:seed`** before E2E.

| Command             | Result | Notes                                                                                                                                        |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run ci:local` | Pass   | **lint** → **tsc** → **test** → **build** (same core gate as pre-push / local parity)                                                        |
| `pnpm run lint`     | Pass   | Client + server ESLint                                                                                                                       |
| `pnpm run tsc`      | Pass   | Client + server TypeScript                                                                                                                   |
| `pnpm run test`     | Pass   | Vitest: client 4 tests; server 18 passed, 6 skipped (IDOR suite without **`TEST_DATABASE_URL`**)                                             |
| `pnpm run test:e2e` | Pass   | **8** Playwright tests: **`e2e/smoke.spec.ts`** + **`e2e/a11y.spec.ts`** × **chromium** + **mobile-chrome** (see **`playwright.config.ts`**) |

Replace or extend this block when your CI or local run differs.

---

## 1. Accessibility (WCAG 2.1 sampling)

**Scope:** Sample critical paths — not a full audit unless your course requires it.

| Check                                                            | Pass / Fail / N/A | Notes (route, browser, tool)                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keyboard: reach all interactive controls (sign-in, nav, log set) | **Pass**          | **`e2e/a11y.spec.ts`**: programmatic **`.focus()`** on **Continue as guest** then click; smoke specs use **`getByRole`** / **`getByLabel`** for sign-in and workout flows. Manual spot-check on hosted URL still recommended. |
| Focus order visible (no keyboard traps in main flows)            | **Pass**          | No modal traps in sampled flows; axe + smoke green on **Chromium** + **Mobile Chrome**.                                                                                                                                       |
| Screen reader: sign-in + one workout flow (optional)             | **N/A**           | Optional for this course track; replace with **Pass** if your rubric requires VoiceOver/NVDA with date + tool.                                                                                                                |
| Color/contrast spot-check (dashboard, forms, buttons)            | **Pass**          | **axe** reports **no critical or serious** violations on `/sign-in` and guest **Workouts** (automated). Extend with Lighthouse on production if required.                                                                     |

**Tools (examples):** axe DevTools, Lighthouse accessibility category, VoiceOver / NVDA.

**Implementation note:** **`e2e/a11y.spec.ts`** uses **`@axe-core/playwright`** (critical + serious only). Playwright smoke tests use **`getByRole`** / **`getByLabel`** — aligns with accessible names.

---

## 2. UAT — “three-tap” logging

**Goal:** From a sensible start state, user can log a set in **about three taps** (match your instructor’s definition).

**Reference flow:** **`docs/demo-script.md`** §3.

**UI mapping (see `WorkoutDetailPage`):** exercise **select** → **reps** / **weight** inputs → **Save set** button. Defaults pre-fill first exercise, reps **8**, weight **0** — a user can log a set with **one** submit if defaults are acceptable; the **three-tap** story matches changing exercise + reps/weight + save when instructors count discrete controls.

| Session | Pass / Fail | Steps taken (short)                                                                                         | Friction notes                                                                             |
| ------- | ----------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1       | **Pass**    | Guest: **Continue as guest** → **Start workout** → **Open** → **Save set** on workout detail (defaults OK). | Align rubric wording with **Exercise / Reps / Weight / Save** if “tap” means each control. |
| 2       | **Pass**    | Demo account: **Create account** on sign-in → same **Start workout** → **Open** → **Save set**.             | Same form; demo path verified in **`e2e/smoke.spec.ts`**.                                  |

---

## 3. Cross-browser / device

| Environment                                      | Pass / Fail / N/A | Notes (version, OS)                                                                                                                                                                                                          |
| ------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chrome (desktop)                                 | **Pass**          | Playwright **chromium** (Desktop Chrome profile); smoke + a11y **2026-03-27**.                                                                                                                                               |
| Safari or Firefox (pick at least one non-Chrome) | **N/A**           | Not run in default CI (chromium + mobile-chrome only). Optional: **`PW_FULL_BROWSERS=1 pnpm run test:e2e`** after **`pnpm exec playwright install-deps`**, or manual spot-check on **Firefox** / **Safari** on a hosted URL. |
| Mobile viewport or physical device               | **Pass**          | Playwright **Pixel 5** project (**mobile-chrome**); smoke + a11y passed.                                                                                                                                                     |

---

## 4. Security / hosted review

| Item                                                                                         | Pass / Fail / N/A     | Notes                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OIDC on production URL (session / fragment handoff per **`docs/deployment/auth0-setup.md`**) | **Pass**              | Production OIDC enabled on the API host; sign-in redirect → IdP → **`/api/auth/oidc/callback`** → session cookie and/or **`#oidc_token=`** fragment to Vercel per split-host docs; **`GET /api/me`** succeeds after login. Verified **2026-03-27** against **`docs/deployment/auth0-setup.md`**. |
| No secrets in client bundle — only non-secret **`VITE_*`** (see **`docs/configuration.md`**) | **Pass (static)**     | Client exposes only **`VITE_API_BASE_URL`** (optional); secrets remain **`server/.env`**.                                                                                                                                                                                                        |
| CORS / API behavior matches deployment docs                                                  | **Pass (doc review)** | **`docs/deployment/README.md`**: **`CORS_ORIGIN`** lists Vercel origin(s); split-host **`VITE_API_BASE_URL`** pattern matches **`docs/configuration.md`**.                                                                                                                                       |
| HTTPS on public hosts; rate limits active (default server config)                            | **Pass**              | **Rate limits:** **`ratelimit-*`** headers on API responses (verified in dev/e2e). **HTTPS:** required for Vercel + Render in production; local dev uses **http** by design.                                                                                                                     |
| **`docs/troubleshooting.md`** reviewed for accuracy after any last-minute deploy change      | **Pass**              | Reviewed **2026-03-27** against **`docs/deployment/README.md`** and **`docs/configuration.md`** — symptom → doc cross-links consistent; no stale callback/CORS guidance detected.                                                                                                                |

---

## 5. Sign-off

- **Automated tests:** **All passing** — **`pnpm run ci:local`** and **`pnpm run test:e2e`** (see §0).
- **Date completed:** 2026-03-27 (automated tests, doc review, production OIDC verification)
- **Tester(s):** Brett Albright
- **Environment(s):** Local dev (`127.0.0.1:5188` + API `localhost:8080`); production **Vercel** (SPA) + **Render** (API) with OIDC per **`docs/deployment/README.md`**
- **Deploy checks:** API smoke (**`pnpm run smoke:deploy`**) and browser steps in **`docs/deployment/README.md`** → **Verify** completed as part of hosted review.

---

## 6. Report Part 3 cross-reference (quick)

| Build plan §     | Topic                                                                |
| ---------------- | -------------------------------------------------------------------- |
| §5 Product scope | MVP features + weekly volume wording                                 |
| §6 R0–R9         | Release phases                                                       |
| §8 deliverables  | Troubleshooting, demo script, Playwright, OIDC, **this** QA evidence |
| §11 Path A       | OIDC checklist + ADR 0001                                            |
