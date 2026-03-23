DROP TABLE IF EXISTS "todos" CASCADE;--> statement-breakpoint
CREATE TABLE "users" (
	"userId" serial PRIMARY KEY NOT NULL,
	"authSubject" text NOT NULL,
	"createdAt" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "users_authSubject_unique" UNIQUE("authSubject")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"profileId" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"displayName" text NOT NULL,
	"weightUnit" text DEFAULT 'lb' NOT NULL,
	"timezone" text,
	"updatedAt" timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_display_name_unique" ON "profiles" USING btree ("displayName");--> statement-breakpoint
CREATE TABLE "exercise_types" (
	"exerciseTypeId" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"name" text NOT NULL,
	"muscleGroup" text
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"workoutId" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" text,
	"notes" text,
	"startedAt" timestamptz DEFAULT now() NOT NULL,
	"endedAt" timestamptz
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"setId" serial PRIMARY KEY NOT NULL,
	"workoutId" integer NOT NULL,
	"exerciseTypeId" integer NOT NULL,
	"setIndex" integer NOT NULL,
	"reps" integer NOT NULL,
	"weight" real NOT NULL,
	"notes" text,
	"createdAt" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_types" ADD CONSTRAINT "exercise_types_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_userId_users_userId_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("userId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workoutId_workouts_workoutId_fk" FOREIGN KEY ("workoutId") REFERENCES "public"."workouts"("workoutId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exerciseTypeId_exercise_types_exerciseTypeId_fk" FOREIGN KEY ("exerciseTypeId") REFERENCES "public"."exercise_types"("exerciseTypeId") ON DELETE restrict ON UPDATE no action;
