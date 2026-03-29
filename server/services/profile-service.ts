import type { UiPreferences } from '@shared/ui-preferences.js';
import { eq, sql } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { profiles } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import {
  mergeUiPreferences,
  parseStoredUiPreferences,
} from '@server/lib/ui-preferences.js';

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
  uiPreferences: UiPreferences | null;
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
      uiPreferences: profiles.uiPreferences,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    uiPreferences: parseStoredUiPreferences(row.uiPreferences),
  };
}

export async function updateProfileForUser(
  userId: number,
  patch: {
    displayName?: string;
    weightUnit?: 'lb' | 'kg';
    timezone?: string | null;
    uiPreferences?: UiPreferences;
  },
): Promise<ProfileRecord> {
  const db = requireDb();
  const updates: Record<string, unknown> = { updatedAt: sql`now()` };
  if (patch.displayName !== undefined)
    updates.displayName = patch.displayName.trim();
  if (patch.weightUnit !== undefined) updates.weightUnit = patch.weightUnit;
  if (patch.timezone !== undefined) updates.timezone = patch.timezone;

  if (patch.uiPreferences !== undefined) {
    const [existingRow] = await db
      .select({ uiPreferences: profiles.uiPreferences })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    if (!existingRow) throw new ClientError(404, 'profile not found');
    const existing = parseStoredUiPreferences(existingRow.uiPreferences);
    updates.uiPreferences = mergeUiPreferences(existing, patch.uiPreferences);
  }

  const [row] = await db
    .update(profiles)
    .set(updates)
    .where(eq(profiles.userId, userId))
    .returning({
      userId: profiles.userId,
      displayName: profiles.displayName,
      weightUnit: profiles.weightUnit,
      timezone: profiles.timezone,
      uiPreferences: profiles.uiPreferences,
      updatedAt: profiles.updatedAt,
    });

  if (!row) throw new ClientError(404, 'profile not found');
  return {
    ...row,
    uiPreferences: parseStoredUiPreferences(row.uiPreferences),
  };
}
