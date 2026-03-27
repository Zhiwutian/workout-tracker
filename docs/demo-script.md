# Demo script (presentation)

Short **happy path** for instructors or video: sign in → workout → log a set → see dashboard. Aligns with **`docs/proposals/workout-tracker-build-plan.md`** §8.

**Prep:** Hosted or local app running; user has an account (**OIDC** or **demo** if enabled). Use a **test** workout if you need a clean story.

---

## 1. Sign in (~1 min)

1. Open the app root (e.g. Vercel URL or `http://localhost:5173`).
2. Go to **Sign in** (if not redirected automatically).
3. **Sign in with OpenID Connect** (or **demo** display name / **Continue as guest** per your demo policy).
4. Confirm you land on the **home** or **workouts** view and the UI shows you are signed in (nav / profile).

---

## 2. Open or create a workout (~1 min)

1. Open **Workouts** (or equivalent nav).
2. **Start** a new workout **or** open an existing **in-progress** session.
3. Confirm you are on the **workout detail** screen where sets are logged.

---

## 3. Log a set (three-tap narrative)

From the workout detail screen (adjust labels to your UI):

1. **Tap 1:** Choose **exercise** (catalog or custom).
2. **Tap 2:** Enter **reps** and **weight** (and unit if shown).
3. **Tap 3:** **Save** / **Add set** — confirm the set appears in the list.

_If your rubric counts “three taps” differently, note the exact steps in **`docs/course-qa-evidence.md`** §2._

---

## 4. Dashboard / weekly volume (~30 s)

1. Open **Dashboard** (or **Stats**).
2. Point out **weekly volume** (sum of **reps × weight** for the week — see **`docs/assumptions.md`**).
3. Optionally log another set and refresh to show the chart/table updating.

---

## 5. Profile (optional ~30 s)

1. Open **Profile**.
2. Show **display name**, **weight unit** (lb/kg), optional **timezone**.

---

## 6. Sign out (optional)

1. **Sign out** and confirm the app returns to an unauthenticated state.

---

## CI parity

Automated smoke: **`e2e/smoke.spec.ts`** (demo/guest path). OIDC in CI requires IdP secrets — see **`docs/testing.md`**.
