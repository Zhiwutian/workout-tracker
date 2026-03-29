set client_min_messages to warning;

-- Canonical SQL mirror of Drizzle schema (workout tracker).
drop schema if exists "public" cascade;

create schema "public";

create table "users" (
  "userId" serial primary key,
  "authSubject" text not null unique,
  "createdAt" timestamptz not null default now()
);

create table "profiles" (
  "profileId" serial primary key,
  "userId" integer not null unique references "users" ("userId") on delete cascade,
  "displayName" text not null,
  "weightUnit" text not null default 'lb',
  "timezone" text,
  "uiPreferences" jsonb,
  "updatedAt" timestamptz not null default now()
);

create table "exercise_types" (
  "exerciseTypeId" serial primary key,
  "userId" integer references "users" ("userId") on delete cascade,
  "name" text not null,
  "muscleGroup" text,
  "category" text not null default 'resistance',
  "archivedAt" timestamptz
);

create table "workouts" (
  "workoutId" serial primary key,
  "userId" integer not null references "users" ("userId") on delete cascade,
  "title" text,
  "notes" text,
  "workoutType" text not null default 'resistance',
  "startedAt" timestamptz not null default now(),
  "endedAt" timestamptz
);

create table "workout_sets" (
  "setId" serial primary key,
  "workoutId" integer not null references "workouts" ("workoutId") on delete cascade,
  "exerciseTypeId" integer not null references "exercise_types" ("exerciseTypeId") on delete restrict,
  "setIndex" integer not null,
  "reps" integer not null,
  "weight" real not null,
  "notes" text,
  "isWarmup" boolean not null default false,
  "restSeconds" integer,
  "createdAt" timestamptz not null default now()
);

create table "goals" (
  "goalId" serial primary key,
  "userId" integer not null references "users" ("userId") on delete cascade,
  "goalType" text not null,
  "targetValue" double precision not null,
  "workoutTypeFilter" text,
  "timezone" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "goal_periods" (
  "periodId" serial primary key,
  "goalId" integer not null references "goals" ("goalId") on delete cascade,
  "periodStartUtc" timestamptz not null,
  "periodEndUtc" timestamptz not null,
  "weekStartYmd" text not null,
  "status" text not null default 'pending',
  "progressValue" double precision,
  constraint "goal_periods_goal_week_unique" unique ("goalId", "periodStartUtc")
);

create table "user_achievements" (
  "userId" integer not null references "users" ("userId") on delete cascade,
  "badgeId" text not null,
  "unlockedAt" timestamptz not null default now(),
  primary key ("userId", "badgeId")
);

create index "idx_workouts_user_started" on "workouts" ("userId", "startedAt");
