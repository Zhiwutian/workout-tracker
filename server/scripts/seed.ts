import { count, isNull } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { getDrizzleDb } from '@server/db/drizzle.js';
import { exerciseTypes } from '@server/db/schema.js';
import { logger } from '@server/lib/logger.js';

const GLOBAL_EXERCISES: { name: string; muscleGroup: string | null }[] = [
  { name: 'Barbell squat', muscleGroup: 'legs' },
  { name: 'Bench press', muscleGroup: 'chest' },
  { name: 'Deadlift', muscleGroup: 'back' },
  { name: 'Overhead press', muscleGroup: 'shoulders' },
  { name: 'Barbell row', muscleGroup: 'back' },
  { name: 'Pull-up', muscleGroup: 'back' },
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
    })),
  );
  logger.info('Seeded global exercise types');
}

seedGlobalExercises()
  .catch((err) => {
    logger.error({ err }, 'db:seed failed');
    process.exitCode = 1;
  })
  .finally(() => {
    logger.info({ nodeEnv: env.NODE_ENV }, 'db:seed completed');
  });
