import {
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
// Note: exercise_types intentionally has no DB unique on (userId,name) because PostgreSQL
// treats NULL userId oddly in composite uniques; enforce custom names in the service layer.

/**
 * Authenticated identity. `authSubject` maps 1:1 to OIDC `sub` when OAuth is wired;
 * demo sign-up uses `demo:<uuid>`; guest sessions use `guest:<uuid>` (no IdP).
 */
export const users = pgTable('users', {
  userId: serial('userId').primaryKey(),
  authSubject: text('authSubject').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** One profile row per user (preferences + display name). */
export const profiles = pgTable(
  'profiles',
  {
    profileId: serial('profileId').primaryKey(),
    userId: integer('userId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' })
      .unique(),
    displayName: text('displayName').notNull(),
    weightUnit: text('weightUnit').notNull().default('lb'),
    timezone: text('timezone'),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('profiles_display_name_unique').on(table.displayName),
  ],
);

/**
 * Exercises: `userId` null = global catalog (seeded); non-null = user-defined custom.
 */
export const exerciseTypes = pgTable('exercise_types', {
  exerciseTypeId: serial('exerciseTypeId').primaryKey(),
  userId: integer('userId').references(() => users.userId, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  muscleGroup: text('muscleGroup'),
});

export const workouts = pgTable('workouts', {
  workoutId: serial('workoutId').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  title: text('title'),
  notes: text('notes'),
  startedAt: timestamp('startedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp('endedAt', { withTimezone: true }),
});

export const workoutSets = pgTable('workout_sets', {
  setId: serial('setId').primaryKey(),
  workoutId: integer('workoutId')
    .notNull()
    .references(() => workouts.workoutId, { onDelete: 'cascade' }),
  exerciseTypeId: integer('exerciseTypeId')
    .notNull()
    .references(() => exerciseTypes.exerciseTypeId, { onDelete: 'restrict' }),
  setIndex: integer('setIndex').notNull(),
  reps: integer('reps').notNull(),
  weight: real('weight').notNull(),
  notes: text('notes'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
