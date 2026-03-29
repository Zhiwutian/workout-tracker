# UI styleguide

Conventions for **workout-tracker** client UI. This repo is a **learning resource**: prefer clarity and consistency over clever one-offs.

## Principles

- Clear hierarchy, readable forms, and obvious primary actions.
- Prefer **accessibility** defaults: labels linked to controls (`htmlFor` / `id`), focus order, keyboard use, sufficient contrast.
- Keep styling **consistent** across pages (**shared components** over copy-pasted Tailwind).

## Implementation (current stack)

- **Tailwind CSS v4** via `@import 'tailwindcss'` in `client/src/index.css`.
- Prefer **utility classes** in components for layout, spacing, and typography.
- Use **`client/src/index.css`** only for global resets and shared tokens as the design system grows.

This repo’s global CSS is intentionally minimal compared to larger apps; when you add design tokens (colors, radii, focus rings), define them in **`index.css`** and document them here.

## Display shell (accessibility)

- **State:** `textScale` (`sm`–`xl`), `darkMode`, `highContrast` live in **`client/src/state/app-state-store.ts`** and persist with **`DISPLAY_STORAGE_KEYS`** (`wt-text-scale`, `wt-dark-mode`, `wt-high-contrast`).
- **Shell classes:** **`App.tsx`** applies `app-text-scale-*` plus either default light (`bg-slate-50`), `app-dark-mode`, or `app-high-contrast`. If both contrast toggles are on, **high contrast wins** for the shell (see Profile copy).
- **Global overrides:** **`index.css`** maps Tailwind `text-*` sizes under each scale and adjusts slate / indigo / amber / toast colors under `.app-dark-mode` and `.app-high-contrast`.
- **User controls:** **Profile → Display and accessibility**; Phase 2 may sync to the server (see **`docs/proposals/display-and-accessibility-settings.md`**).

## Components (`client/src/components/ui/`)

| Primitive                                                      | Role                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **`Button`**                                                   | Primary actions, variants (`ghost`, etc.).                                                       |
| **`Input`**                                                    | Single-line text and numeric fields (shared focus ring).                                         |
| **`Select`**                                                   | Native `<select>` with the same visual baseline as **`Input`**.                                  |
| **`FieldLabel`**                                               | Consistent label styling; override with **`className`** for larger form sections (e.g. profile). |
| **`Textarea`**                                                 | Multi-line notes (e.g. set notes); matches **`Input`** border/focus.                             |
| **`Card`**, **`Badge`**, **`EmptyState`**, **`SectionHeader`** | Layout and emphasis.                                                                             |

Page-specific markup stays in **`pages/`** or **`features/`**; reuse these primitives before inventing new class stacks.

## Forms

- **Today:** most forms use **React `useState`** + controlled inputs so beginners can read state flow in one file.
- **react-hook-form** is optional (see **`frontend-patterns.md`**). If you adopt it, surface validation errors next to fields and keep schemas aligned with the API.
- Destructive actions (delete set, etc.) should stay **confirmable** when the product requires it.

## Related

- **`frontend-patterns.md`** — structure, state, API usage, **`useAbortableAsyncEffect`**.
- **`frontend-accessibility-guard`** rule (`.cursor/rules/`) when editing UI.
