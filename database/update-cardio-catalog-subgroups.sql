-- One-off: tag global cardio rows for catalog drill-down (Standard vs HIIT).
-- Safe to run multiple times. Only touches globals (userId IS NULL).
--
--   psql "$DATABASE_URL" -f database/update-cardio-catalog-subgroups.sql

UPDATE "exercise_types"
SET "muscleGroup" = 'Standard'
WHERE "userId" IS NULL
  AND "category" = 'cardio'
  AND ("muscleGroup" IS NULL OR trim("muscleGroup") = '');

UPDATE "exercise_types"
SET "muscleGroup" = 'HIIT'
WHERE "userId" IS NULL
  AND "category" = 'cardio'
  AND "name" = 'Jump rope';
