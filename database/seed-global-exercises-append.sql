-- Append global exercise catalog (userId NULL) to an existing database.
-- Source of truth for names/categories: `server/scripts/seed.ts` (GLOBAL_EXERCISES) — keep in sync.
-- Idempotent: skips any row whose name already exists as a global exercise.
--
-- Prerequisites: migrations through 0007 applied (exercise_types.category exists).
-- Safe with real user data: does not delete or renumber existing exercise_type IDs.
--
-- Run (example):
--   psql "$DATABASE_URL" -f database/seed-global-exercises-append.sql

INSERT INTO "exercise_types" ("userId", "name", "muscleGroup", "category")
SELECT NULL, t.name, t.muscle_group, t.category
FROM (
  VALUES
    ('Bench press', 'chest'::text, 'resistance'::text),
    ('Incline dumbbell press', 'chest', 'resistance'),
    ('Dumbbell fly', 'chest', 'resistance'),
    ('Push-up', 'chest', 'resistance'),
    ('Cable crossover', 'chest', 'resistance'),
    ('Deadlift', 'back', 'resistance'),
    ('Barbell row', 'back', 'resistance'),
    ('Pull-up', 'back', 'resistance'),
    ('Lat pulldown', 'back', 'resistance'),
    ('Seated cable row', 'back', 'resistance'),
    ('Face pull', 'back', 'resistance'),
    ('Barbell squat', 'legs', 'resistance'),
    ('Romanian deadlift', 'legs', 'resistance'),
    ('Leg press', 'legs', 'resistance'),
    ('Walking lunge', 'legs', 'resistance'),
    ('Bulgarian split squat', 'legs', 'resistance'),
    ('Leg curl', 'legs', 'resistance'),
    ('Leg extension', 'legs', 'resistance'),
    ('Calf raise', 'legs', 'resistance'),
    ('Hip thrust', 'legs', 'resistance'),
    ('Overhead press', 'shoulders', 'resistance'),
    ('Lateral raise', 'shoulders', 'resistance'),
    ('Rear delt fly', 'shoulders', 'resistance'),
    ('Arnold press', 'shoulders', 'resistance'),
    ('Shrug', 'shoulders', 'resistance'),
    ('Barbell curl', 'arms', 'resistance'),
    ('Tricep pushdown', 'arms', 'resistance'),
    ('Skull crusher', 'arms', 'resistance'),
    ('Hammer curl', 'arms', 'resistance'),
    ('Dip', 'arms', 'resistance'),
    ('Running', 'Standard'::text, 'cardio'),
    ('Rowing machine', 'Standard', 'cardio'),
    ('Cycling', 'Standard', 'cardio'),
    ('Elliptical', 'Standard', 'cardio'),
    ('Jump rope', 'HIIT', 'cardio'),
    ('Stair climber', 'Standard', 'cardio'),
    ('Swimming', 'Standard', 'cardio'),
    ('Brisk walk', 'Standard', 'cardio'),
    ('Hamstring stretch', 'legs', 'flexibility'),
    ('Quad stretch', 'legs', 'flexibility'),
    ('Hip flexor stretch', 'legs', 'flexibility'),
    ('Pigeon pose', 'legs', 'flexibility'),
    ('Cat-cow', 'back', 'flexibility'),
    ('Child''s pose', 'back', 'flexibility'),
    ('Thoracic rotation', 'back', 'flexibility'),
    ('Cross-body shoulder stretch', 'shoulders', 'flexibility'),
    ('Doorway pec stretch', 'chest', 'flexibility'),
    ('Tricep overhead stretch', 'arms', 'flexibility'),
    ('Wrist flexor stretch', 'arms', 'flexibility')
) AS t(name, muscle_group, category)
WHERE NOT EXISTS (
  SELECT 1
  FROM "exercise_types" e
  WHERE e."userId" IS NULL
    AND e."name" = t.name
);
