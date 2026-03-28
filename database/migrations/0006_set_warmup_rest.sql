ALTER TABLE "workout_sets" ADD COLUMN "isWarmup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN "restSeconds" integer;