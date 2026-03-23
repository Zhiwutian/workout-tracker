import { eq, sql } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { profiles } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { isPgUniqueViolation } from '@server/lib/pg-errors.js';

function requireDb(): DbClient {
  const db = getDrizzleDb();
  if (!db) {
    throw new ClientError(
      503,
      'database is not configured. set DATABASE_URL and run migrations.',
    );
  }
  return db;
}

export type ProfileRecord = {
  userId: number;
  displayName: string;
  weightUnit: string;
  timezone: string | null;
  updatedAt: Date;
};

export async function readProfileForUser(
  userId: number,
): Promise<ProfileRecord | null> {
  const db = requireDb();
  const [row] = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      weightUnit: profiles.weightUnit,
      timezone: profiles.timezone,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function updateProfileForUser(
  userId: number,
  patch: {
    displayName?: string;
    weightUnit?: 'lb' | 'kg';
    timezone?: string | null;
  },
): Promise<ProfileRecord> {
  const db = requireDb();
  const updates: Record<string, unknown> = { updatedAt: sql`now()` };
  if (patch.displayName !== undefined)
    updates.displayName = patch.displayName.trim();
  if (patch.weightUnit !== undefined) updates.weightUnit = patch.weightUnit;
  if (patch.timezone !== undefined) updates.timezone = patch.timezone;

  try {
    const [row] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId))
      .returning({
        userId: profiles.userId,
        displayName: profiles.displayName,
        weightUnit: profiles.weightUnit,
        timezone: profiles.timezone,
        updatedAt: profiles.updatedAt,
      });

    if (!row) throw new ClientError(404, 'profile not found');
    return row;
  } catch (err) {
    if (isPgUniqueViolation(err, 'profiles_display_name_unique')) {
      throw new ClientError(409, 'display name already taken');
    }
    throw err;
  }
}
