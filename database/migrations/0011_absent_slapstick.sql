CREATE TABLE "workout_set_groups" (
	"groupId" serial PRIMARY KEY NOT NULL,
	"workoutId" integer NOT NULL,
	"label" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "groupId" integer;--> statement-breakpoint
ALTER TABLE "workout_set_groups" ADD CONSTRAINT "workout_set_groups_workoutId_workouts_workoutId_fk" FOREIGN KEY ("workoutId") REFERENCES "public"."workouts"("workoutId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_groupId_workout_set_groups_groupId_fk" FOREIGN KEY ("groupId") REFERENCES "public"."workout_set_groups"("groupId") ON DELETE set null ON UPDATE no action;