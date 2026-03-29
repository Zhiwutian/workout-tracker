# Proposal: Optimization and abstraction pass

**Status:** **Done** (code + docs). Implementation: `asyncHandler`, `domain-zod`, `requireUserId`, `api-client`, `client/src/lib/api/*`, UI primitives, `features/*` splits, `useAbortableAsyncEffect`, `api-client` tests. See **`docs/styleguide/`** and **`CHANGELOG.md`**.

**Audience:** maintainers, Cursor agents  
**Related app:** [workout-tracker](../../README.md) (repo root)  
**Also read:** [docs/styleguide/README.md](../styleguide/README.md)

## 1. Goal (achieved)

Align **workout-tracker** with its **styleguides** and sensible template patterns by:

- Fixing **documentation drift** (paths and patterns now match code).
- Adding **shared backend/frontend utilities** (`asyncHandler`, `api-client`, `requireUserId`, domain Zod).
- **Deduplicating** validation (workout type Zod from `shared/workout-types`).
- **Standardizing UI** (`Select`, `FieldLabel`, `Textarea`) and **splitting** large sections into `features/*`.

## 2. Context (current)

- Styleguides: [docs/styleguide/](../styleguide/README.md).
- Client API: **`client/src/lib/api-client.ts`** + **`client/src/lib/api/*`** + barrel **`workout-api.ts`**.
- Server: **`asyncHandler`** in **`server/routes/api.ts`**; **`domain-zod.ts`**; **`request-user.ts`**.
- **Cross-repo:** Parent workspace may exist for comparison; workout-tracker paths and auth (Bearer + cookies, no `x-device-id`) are documented in **`docs/styleguide/README.md`**.

## 3. Work breakdown (reference)

Sections §3.1–§3.6 described the plan; all items were executed. Keep this file as **history**; live guidance is in the styleguide.

## 4. Quality gates

- **`pnpm run ci:local`** from repo root; update **`CHANGELOG.md`** when behavior changes.

## 5. Optional follow-ups (still optional)

- Incrementally move stable DTO types from client types → **`shared/`** where both sides need them.
- **ESLint import boundaries** if `features/` grows large.
- Broader **RHF** adoption on selected forms only if it reduces complexity.

## 6. Execution checklist (archived)

- [x] §3.1 guides + parent note
- [x] §3.2 `asyncHandler` + controller migrations
- [x] §3.3 `domain-zod`
- [x] §3.4 `api-client` + `api/*` + barrel
- [x] §3.5 UI primitives
- [x] §3.6 feature splits + `useAbortableAsyncEffect`
- [x] CHANGELOG + `ci:local` + docs + teaching comments
