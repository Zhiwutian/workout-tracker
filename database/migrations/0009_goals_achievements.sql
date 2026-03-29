CREATE TABLE "goals" (
  "goalId" serial PRIMARY KEY,
  "userId" integer NOT NULL REFERENCES "users" ("userId") ON DELETE CASCADE,
  "goalType" text NOT NULL,
  "targetValue" double precision NOT NULL,
  "workoutTypeFilter" text,
  "timezone" text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "goal_periods" (
  "periodId" serial PRIMARY KEY,
  "goalId" integer NOT NULL REFERENCES "goals" ("goalId") ON DELETE CASCADE,
  "periodStartUtc" timestamptz NOT NULL,
  "periodEndUtc" timestamptz NOT NULL,
  "weekStartYmd" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "progressValue" double precision,
  CONSTRAINT "goal_periods_goal_week_unique" UNIQUE ("goalId", "periodStartUtc")
);

CREATE TABLE "user_achievements" (
  "userId" integer NOT NULL REFERENCES "users" ("userId") ON DELETE CASCADE,
  "badgeId" text NOT NULL,
  "unlockedAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "badgeId")
);

CREATE INDEX "idx_workouts_user_started" ON "workouts" ("userId", "startedAt");
