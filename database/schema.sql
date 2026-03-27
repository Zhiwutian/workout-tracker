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
  "updatedAt" timestamptz not null default now()
);

create table "exercise_types" (
  "exerciseTypeId" serial primary key,
  "userId" integer references "users" ("userId") on delete cascade,
  "name" text not null,
  "muscleGroup" text
);

create table "workouts" (
  "workoutId" serial primary key,
  "userId" integer not null references "users" ("userId") on delete cascade,
  "title" text,
  "notes" text,
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
  "createdAt" timestamptz not null default now()
);
