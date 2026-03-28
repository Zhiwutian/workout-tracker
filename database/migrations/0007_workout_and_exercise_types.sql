ALTER TABLE "exercise_types" ADD COLUMN "category" text DEFAULT 'resistance' NOT NULL;--> statement-breakpoint
ALTER TABLE "workouts" ADD COLUMN "workoutType" text DEFAULT 'resistance' NOT NULL;