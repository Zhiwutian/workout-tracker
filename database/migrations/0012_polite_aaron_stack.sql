WITH ranked_sets AS (
  SELECT
    "setId",
    ROW_NUMBER() OVER (
      PARTITION BY "workoutId"
      ORDER BY "setIndex", "setId"
    ) - 1 AS next_set_index
  FROM "workout_sets"
)
UPDATE "workout_sets" ws
SET "setIndex" = ranked_sets.next_set_index
FROM ranked_sets
WHERE ws."setId" = ranked_sets."setId"
  AND ws."setIndex" <> ranked_sets.next_set_index;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_workout_sets_workout_set_index" ON "workout_sets" USING btree ("workoutId","setIndex");--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'workout_sets_workout_set_index_unique'
  ) THEN
    ALTER TABLE "workout_sets"
      ADD CONSTRAINT "workout_sets_workout_set_index_unique" UNIQUE("workoutId","setIndex");
  END IF;
END $$;