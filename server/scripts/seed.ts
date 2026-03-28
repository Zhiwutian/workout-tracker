import { count, isNull } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { exerciseTypes } from '@server/db/schema.js';
import { logger } from '@server/lib/logger.js';
import type { WorkoutType } from '@shared/workout-types';

/** Keep in sync with `database/seed-global-exercises-append.sql` (idempotent SQL for existing DBs). */
const GLOBAL_EXERCISES: {
  name: string;
  muscleGroup: string | null;
  category: WorkoutType;
}[] = [
  // Resistance — chest
  { name: 'Bench press', muscleGroup: 'chest', category: 'resistance' },
  {
    name: 'Incline dumbbell press',
    muscleGroup: 'chest',
    category: 'resistance',
  },
  { name: 'Dumbbell fly', muscleGroup: 'chest', category: 'resistance' },
  { name: 'Push-up', muscleGroup: 'chest', category: 'resistance' },
  { name: 'Cable crossover', muscleGroup: 'chest', category: 'resistance' },
  // Resistance — back
  { name: 'Deadlift', muscleGroup: 'back', category: 'resistance' },
  { name: 'Barbell row', muscleGroup: 'back', category: 'resistance' },
  { name: 'Pull-up', muscleGroup: 'back', category: 'resistance' },
  { name: 'Lat pulldown', muscleGroup: 'back', category: 'resistance' },
  { name: 'Seated cable row', muscleGroup: 'back', category: 'resistance' },
  { name: 'Face pull', muscleGroup: 'back', category: 'resistance' },
  // Resistance — legs
  { name: 'Barbell squat', muscleGroup: 'legs', category: 'resistance' },
  { name: 'Romanian deadlift', muscleGroup: 'legs', category: 'resistance' },
  { name: 'Leg press', muscleGroup: 'legs', category: 'resistance' },
  { name: 'Walking lunge', muscleGroup: 'legs', category: 'resistance' },
  {
    name: 'Bulgarian split squat',
    muscleGroup: 'legs',
    category: 'resistance',
  },
  { name: 'Leg curl', muscleGroup: 'legs', category: 'resistance' },
  { name: 'Leg extension', muscleGroup: 'legs', category: 'resistance' },
  { name: 'Calf raise', muscleGroup: 'legs', category: 'resistance' },
  { name: 'Hip thrust', muscleGroup: 'legs', category: 'resistance' },
  // Resistance — shoulders
  { name: 'Overhead press', muscleGroup: 'shoulders', category: 'resistance' },
  { name: 'Lateral raise', muscleGroup: 'shoulders', category: 'resistance' },
  { name: 'Rear delt fly', muscleGroup: 'shoulders', category: 'resistance' },
  { name: 'Arnold press', muscleGroup: 'shoulders', category: 'resistance' },
  { name: 'Shrug', muscleGroup: 'shoulders', category: 'resistance' },
  // Resistance — arms
  { name: 'Barbell curl', muscleGroup: 'arms', category: 'resistance' },
  { name: 'Tricep pushdown', muscleGroup: 'arms', category: 'resistance' },
  { name: 'Skull crusher', muscleGroup: 'arms', category: 'resistance' },
  { name: 'Hammer curl', muscleGroup: 'arms', category: 'resistance' },
  { name: 'Dip', muscleGroup: 'arms', category: 'resistance' },
  // Cardio
  { name: 'Running', muscleGroup: null, category: 'cardio' },
  { name: 'Rowing machine', muscleGroup: null, category: 'cardio' },
  { name: 'Cycling', muscleGroup: null, category: 'cardio' },
  { name: 'Elliptical', muscleGroup: null, category: 'cardio' },
  { name: 'Jump rope', muscleGroup: null, category: 'cardio' },
  { name: 'Stair climber', muscleGroup: null, category: 'cardio' },
  { name: 'Swimming', muscleGroup: null, category: 'cardio' },
  { name: 'Brisk walk', muscleGroup: null, category: 'cardio' },
  // Flexibility (muscleGroup = primary area)
  { name: 'Hamstring stretch', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Quad stretch', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Hip flexor stretch', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Pigeon pose', muscleGroup: 'legs', category: 'flexibility' },
  { name: 'Cat-cow', muscleGroup: 'back', category: 'flexibility' },
  { name: "Child's pose", muscleGroup: 'back', category: 'flexibility' },
  { name: 'Thoracic rotation', muscleGroup: 'back', category: 'flexibility' },
  {
    name: 'Cross-body shoulder stretch',
    muscleGroup: 'shoulders',
    category: 'flexibility',
  },
  {
    name: 'Doorway pec stretch',
    muscleGroup: 'chest',
    category: 'flexibility',
  },
  {
    name: 'Tricep overhead stretch',
    muscleGroup: 'arms',
    category: 'flexibility',
  },
  {
    name: 'Wrist flexor stretch',
    muscleGroup: 'arms',
    category: 'flexibility',
  },
];

/**
 * Seed global exercise catalog (userId null) when table has no global rows yet.
 */
async function seedGlobalExercises(): Promise<void> {
  const db = getDrizzleDb();
  if (!db) {
    throw new Error('DATABASE_URL is required to run db:seed');
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(exerciseTypes)
    .where(isNull(exerciseTypes.userId));

  if (total > 0) {
    logger.info({ total }, 'Skipping exercise seed: global exercises exist');
    return;
  }

  await db.insert(exerciseTypes).values(
    GLOBAL_EXERCISES.map((e) => ({
      userId: null,
      name: e.name,
      muscleGroup: e.muscleGroup,
      category: e.category,
    })),
  );
  logger.info('Seeded global exercise types');
}

seedGlobalExercises()
  .then(() => {
    logger.info({ nodeEnv: env.NODE_ENV }, 'db:seed completed');
  })
  .catch((err) => {
    logger.error({ err }, 'db:seed failed');
    process.exit(1);
  });
