# UI styleguide

Conventions for **workout-tracker** client UI. This repo is a **learning resource**: prefer clarity and consistency over clever one-offs.

## Principles

- Clear hierarchy, readable forms, and obvious primary actions.
- Prefer **accessibility** defaults: labels linked to controls (`htmlFor` / `id`), focus order, keyboard use, sufficient contrast.
- Keep styling **consistent** across pages (**shared components** over copy-pasted Tailwind).

## Implementation (current stack)

- **Tailwind CSS v4** via `@import 'tailwindcss'` in `client/src/index.css` (must stay **bare** — `url('tailwindcss')` and Stylelint’s `import-notation` autofix break **`@tailwindcss/vite`**, so utilities never generate).
- Prefer **utility classes** in components for layout, spacing, and typography.
- Use **`client/src/index.css`** only for global resets and shared tokens as the design system grows.

This repo’s global CSS is intentionally minimal compared to larger apps; when you add design tokens (colors, radii, focus rings), define them in **`index.css`** and document them here.

## Display shell (accessibility)

- **State:** `textScale` (`sm`–`xl`), **`themeMode`** (`system` \| `light` \| `dark`), and `highContrast` live in **`client/src/state/app-state-store.ts`** and persist with **`DISPLAY_STORAGE_KEYS`** (`wt-text-scale`, **`wt-theme-mode`**, `wt-high-contrast`). Legacy **`wt-dark-mode`** is read once and migrated to **`themeMode`**.
- **Effective dark:** When **`themeMode`** is **`system`**, the shell follows **`prefers-color-scheme`** (**`useSystemPrefersDark`**). **`light`** / **`dark`** force the corresponding shell.
- **DOM sync:** **`client/src/lib/display-shell.ts`** sets `app-text-scale-*`, `app-dark-mode`, and `app-high-contrast` on **`document.documentElement`** (and **`App.tsx`** drives layout from the same effective values). An **inline script** in **`client/index.html`** repeats the storage keys and rules so the first paint matches before React hydrates.
- **Shell classes:** **`App.tsx`** uses `app-text-scale-*` plus either default light (`bg-slate-50`), effective `app-dark-mode`, or `app-high-contrast`. If both contrast toggles are on, **high contrast wins** for the shell (see Profile copy).
- **Global overrides:** **`index.css`** maps Tailwind `text-*` sizes under each scale and adjusts slate / indigo / amber / toast colors under `.app-dark-mode` and `.app-high-contrast`.
- **User controls:** **Profile → Display and accessibility** — changes **`PATCH`** **`/api/profile`** as **`uiPreferences`** (merged on the server in **`profiles.uiPreferences`**; optional deprecated **`darkMode`** in stored JSON is normalized to **`themeMode`**). **`GET /api/me`** returns the merged object so new sessions/devices match after sign-in (see **`docs/proposals/display-and-accessibility-settings.md`**).

## Navigation shell

- **Global header:** **Workout Tracker** title + **Menu** control; **no** inline nav links in the main column. The **drawer** (`id="overlay-main-menu"`) holds **Workouts**, **Exercises**, **Dashboard**, **Tutorial**, **Profile**, **About** (when signed in) or **Sign in** + **About** (when signed out). **Escape** and backdrop click close the drawer; **`body` overflow** is locked while open. Styling follows **display shell** (light / dark / high contrast) so the panel is never white-on-dark by mistake.
- **Z-index:** drawer `z-[70]`/`z-[80]`; modal `z-[75]`/`z-[85]`; toasts **`z-[100]`** so notifications appear above overlays.
- **Motion:** modal uses Tailwind **`motion-safe`** / **`motion-reduce`** for transitions; avoid slide animations on the drawer unless they respect **`prefers-reduced-motion`**.

## Workouts list URL

- On **`/`**, filters are reflected in the query string: **`range`** (`all` \| `week` \| `month`), **`status`**, **`sort`** (`newest` \| `oldest`). Defaults omit keys. **Clear filters** resets the URL and list state.

## Components (`client/src/components/ui/`)

| Primitive                                                      | Role                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **`Button`**                                                   | Primary actions, variants (`ghost`, etc.); **`forwardRef`** for focus return.                    |
| **`Modal`**                                                    | Dialog overlay (`role="dialog"`), Escape + overlay close, body scroll lock, focus return.        |
| **`Input`**                                                    | Single-line text and numeric fields (shared focus ring).                                         |
| **`Select`**                                                   | Native `<select>` with the same visual baseline as **`Input`**.                                  |
| **`FieldLabel`**                                               | Consistent label styling; override with **`className`** for larger form sections (e.g. profile). |
| **`Textarea`**                                                 | Multi-line notes (e.g. set notes); matches **`Input`** border/focus.                             |
| **`Card`**, **`Badge`**, **`EmptyState`**, **`SectionHeader`** | Layout and emphasis.                                                                             |

Page-specific markup stays in **`pages/`** or **`features/`**; reuse these primitives before inventing new class stacks.

## Charts (dashboard)

- **Library:** **[Recharts](https://recharts.org)** (~tens of kB gzipped with tree-shaking — see bundle report when optimizing). Use it for **multi-week** trends on **`DashboardPage`**; keep **one** primary chart on small viewports.
- **Accessibility:** pair charts with a **visible data table** (or **expandable** / **screen-reader-only** table) carrying the **same numbers**; name the graphic with **`aria-labelledby`** / **`figure`** + heading. Do not rely on **color alone** — tooltips and labels carry values; **`prefers-reduced-motion`** disables bar/line animations via **`isAnimationActive`**.

## Forms

- **Today:** most forms use **React `useState`** + controlled inputs so beginners can read state flow in one file.
- **react-hook-form** is optional (see **`frontend-patterns.md`**). If you adopt it, surface validation errors next to fields and keep schemas aligned with the API.
- Destructive actions (delete set, etc.) should stay **confirmable** when the product requires it.

## Related

- **`frontend-patterns.md`** — structure, state, API usage, **`useAbortableAsyncEffect`**.
- **`frontend-accessibility-guard`** rule (`.cursor/rules/`) when editing UI.
