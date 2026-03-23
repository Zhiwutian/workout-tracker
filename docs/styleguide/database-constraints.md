# Database constraints and API parity

Cross-reference for **Postgres**, **Drizzle** (`server/db/schema.ts`), **Zod** (controllers), and **`shared/api-contracts.ts`**. Update this doc when any layer changes.

## `profiles`

| Field / rule  | Zod / service                    | DB                                            |
| ------------- | -------------------------------- | --------------------------------------------- |
| `displayName` | trim, 1–120 chars; unique in app | `UNIQUE` index `profiles_display_name_unique` |
| `weightUnit`  | `lb` \| `kg` in profile patch    | `text` default `lb`                           |
| `timezone`    | optional string, max 64          | nullable `text`                               |

Conflicts return **409** (`display name already taken`) from auth sign-up and profile update.

## `exercise_types`

| Field / rule  | Zod / service                                        | DB                    |
| ------------- | ---------------------------------------------------- | --------------------- |
| `userId`      | `null` = global catalog; else must match authed user | nullable FK → `users` |
| `name`        | 1–120 chars (create body)                            | `text` NOT NULL       |
| `muscleGroup` | optional, max 80                                     | nullable `text`       |

**Service:** reject duplicate **custom** `(userId, name)` in application code (no DB unique on `(userId, name)` because `userId` is null for globals).

## `workouts`

| Field / rule | Zod (controller)   | DB                     |
| ------------ | ------------------ | ---------------------- |
| `title`      | optional, max 200  | nullable `text`        |
| `notes`      | optional, max 4000 | nullable `text`        |
| `endedAt`    | ISO string or null | nullable `timestamptz` |

All access: **`userId`** must match **`req.user.userId`** (service layer).

## `workout_sets`

| Field / rule     | Zod                          | DB                                        |
| ---------------- | ---------------------------- | ----------------------------------------- |
| `exerciseTypeId` | positive int                 | FK → `exercise_types` (`RESTRICT` delete) |
| `reps`           | int 1–9999                   | `integer` NOT NULL                        |
| `weight`         | number 0–99999               | `real` NOT NULL                           |
| `setIndex`       | int 0–9999 (optional create) | `integer` NOT NULL                        |
| `notes`          | optional, max 2000           | nullable `text`                           |

Access only through a **workout** owned by the current user.

## `users`

| Field / rule  | Notes                                        |
| ------------- | -------------------------------------------- |
| `authSubject` | Unique; demo `demo:<uuid>`, later OIDC `sub` |

## Stats query

- **`GET /api/stats/weekly-volume`**: `weekStart` query must match `YYYY-MM-DD` (UTC week semantics—see `docs/assumptions.md`).

## When to add an index

- New **`WHERE` / `JOIN` / `ORDER BY`** on large tables in hot routes.
- Prefer verifying with **`EXPLAIN (ANALYZE, BUFFERS)`** on realistic data when possible.
