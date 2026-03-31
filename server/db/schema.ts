import type { UiPreferences } from '@shared/ui-preferences.js';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
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

/**
 * One profile row per user (preferences + display name).
 * `displayName` is not globally unique (multiple OIDC users may share the same name).
 */
export const profiles = pgTable('profiles', {
  profileId: serial('profileId').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' })
    .unique(),
  displayName: text('displayName').notNull(),
  weightUnit: text('weightUnit').notNull().default('lb'),
  timezone: text('timezone'),
  /** Optional display prefs (text scale, dark mode, high contrast); merged on PATCH. */
  uiPreferences: jsonb('uiPreferences').$type<UiPreferences | null>(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
  /** resistance | cardio | flexibility — must match workout type when logging sets. */
  category: text('category').notNull().default('resistance'),
  /** Custom exercises only: when set, hidden from pickers until un-archived. */
  archivedAt: timestamp('archivedAt', { withTimezone: true }),
});

/**
 * "Clear recents" cutoffs per user and scope.
 * scope: all | resistance | cardio | flexibility
 */
export const exerciseRecentClears = pgTable(
  'exercise_recent_clears',
  {
    clearId: serial('clearId').primaryKey(),
    userId: integer('userId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    scope: text('scope').notNull(),
    clearedAt: timestamp('clearedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('exercise_recent_clears_user_scope_unique').on(t.userId, t.scope),
  ],
);

export const workouts = pgTable('workouts', {
  workoutId: serial('workoutId').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  title: text('title'),
  notes: text('notes'),
  /** resistance | cardio | flexibility */
  workoutType: text('workoutType').notNull().default('resistance'),
  startedAt: timestamp('startedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp('endedAt', { withTimezone: true }),
});

/**
 * Optional grouping container for superset workflows inside one workout.
 * Sets can reference a group via `workout_sets.groupId`.
 */
export const workoutSetGroups = pgTable('workout_set_groups', {
  groupId: serial('groupId').primaryKey(),
  workoutId: integer('workoutId')
    .notNull()
    .references(() => workouts.workoutId, { onDelete: 'cascade' }),
  label: text('label'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workoutSets = pgTable(
  'workout_sets',
  {
    setId: serial('setId').primaryKey(),
    workoutId: integer('workoutId')
      .notNull()
      .references(() => workouts.workoutId, { onDelete: 'cascade' }),
    exerciseTypeId: integer('exerciseTypeId')
      .notNull()
      .references(() => exerciseTypes.exerciseTypeId, { onDelete: 'restrict' }),
    groupId: integer('groupId').references(() => workoutSetGroups.groupId, {
      onDelete: 'set null',
    }),
    setIndex: integer('setIndex').notNull(),
    reps: integer('reps').notNull(),
    weight: real('weight').notNull(),
    notes: text('notes'),
    /** When true, excluded from weekly volume totals; still exported. */
    isWarmup: boolean('isWarmup').notNull().default(false),
    /** Optional rest taken after this set (seconds). */
    restSeconds: integer('restSeconds'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique('workout_sets_workout_set_index_unique').on(t.workoutId, t.setIndex),
    index('idx_workout_sets_workout_set_index').on(t.workoutId, t.setIndex),
  ],
);

/** User-defined training goals (weekly periods; evaluated from workouts/sets). */
export const goals = pgTable('goals', {
  goalId: serial('goalId').primaryKey(),
  userId: integer('userId')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  goalType: text('goalType').notNull(),
  targetValue: real('targetValue').notNull(),
  workoutTypeFilter: text('workoutTypeFilter'),
  timezone: text('timezone'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const goalPeriods = pgTable(
  'goal_periods',
  {
    periodId: serial('periodId').primaryKey(),
    goalId: integer('goalId')
      .notNull()
      .references(() => goals.goalId, { onDelete: 'cascade' }),
    periodStartUtc: timestamp('periodStartUtc', {
      withTimezone: true,
    }).notNull(),
    periodEndUtc: timestamp('periodEndUtc', { withTimezone: true }).notNull(),
    weekStartYmd: text('weekStartYmd').notNull(),
    status: text('status').notNull().default('pending'),
    progressValue: real('progressValue'),
  },
  (t) => [
    unique('goal_periods_goal_week_unique').on(t.goalId, t.periodStartUtc),
  ],
);

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: integer('userId')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    badgeId: text('badgeId').notNull(),
    unlockedAt: timestamp('unlockedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);
