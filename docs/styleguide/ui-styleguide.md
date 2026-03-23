# UI styleguide

Conventions for **workout-tracker** client UI.

## Principles

- Clear hierarchy, readable forms, and obvious primary actions.
- Prefer **accessibility** defaults: labels, focus order, keyboard use, sufficient contrast.
- Keep styling **consistent** across pages (shared components over one-off CSS).

## Implementation (current stack)

- **Tailwind CSS v4** via `@import 'tailwindcss'` in `client/src/index.css`.
- Prefer **utility classes** in components for layout, spacing, and typography.
- Use **`client/src/index.css`** only for global resets and shared tokens as the design system grows.

This repo’s global CSS is intentionally minimal compared to larger apps; when you add design tokens (colors, radii, focus rings), define them in **`index.css`** and document them here.

## Components

- Reusable controls and layout primitives live under **`client/src/components/ui/`**.
- Page-specific markup stays in **`client/src/pages/`** or feature folders.

## Forms

- Use **react-hook-form** + **Zod**; surface validation errors next to fields.
- Keep destructive actions (delete workout, etc.) confirmable when product requires it.

## Related

- **`frontend-patterns.md`** — structure, state, and API usage.
- **`frontend-accessibility-guard`** rule (`.cursor/rules/`) when editing UI.
