import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { profiles, users } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { isPgUniqueViolation } from '@server/lib/pg-errors.js';
import { env } from '@server/config/env.js';

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

export type AuthTokenPayload = { userId: number };

export function signAccessToken(userId: number): string {
  return jwt.sign({ userId } satisfies AuthTokenPayload, env.TOKEN_SECRET, {
    expiresIn: '7d',
  });
}

/** Demo sign-up: creates user + profile; OIDC will replace this flow later. */
export async function signUpDemo(displayName: string): Promise<{
  token: string;
  userId: number;
  authSubject: string;
  displayName: string;
}> {
  const db = requireDb();
  const authSubject = `demo:${randomUUID()}`;
  const trimmed = displayName.trim();

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ authSubject })
        .returning({ userId: users.userId, authSubject: users.authSubject });

      if (!user) throw new ClientError(500, 'failed to create user');

      await tx.insert(profiles).values({
        userId: user.userId,
        displayName: trimmed,
      });

      return {
        token: signAccessToken(user.userId),
        userId: user.userId,
        authSubject: user.authSubject,
        displayName: trimmed,
      };
    });
  } catch (err) {
    if (isPgUniqueViolation(err, 'profiles_display_name_unique')) {
      throw new ClientError(409, 'display name already taken');
    }
    throw err;
  }
}

/** Demo sign-in by unique display name. */
/** True when this row was created via Continue as guest (`guest:<uuid>`). */
export function isGuestAuthSubject(
  authSubject: string | null | undefined,
): boolean {
  return Boolean(authSubject?.startsWith('guest:'));
}

export async function getAuthSubjectForUser(
  userId: number,
): Promise<string | null> {
  const db = requireDb();
  const [row] = await db
    .select({ authSubject: users.authSubject })
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);
  return row?.authSubject ?? null;
}

/**
 * Anonymous session: new user + profile, same JWT API as demo sign-up.
 * Display name is unique (`Guest <uuid>`) to satisfy `profiles_display_name_unique`.
 */
export async function createGuestUser(): Promise<{
  token: string;
  userId: number;
  authSubject: string;
  displayName: string;
}> {
  const db = requireDb();
  const id = randomUUID();
  const authSubject = `guest:${id}`;
  const displayName = `Guest ${id}`;

  return await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ authSubject })
      .returning({ userId: users.userId, authSubject: users.authSubject });

    if (!user) throw new ClientError(500, 'failed to create user');

    await tx.insert(profiles).values({
      userId: user.userId,
      displayName,
    });

    return {
      token: signAccessToken(user.userId),
      userId: user.userId,
      authSubject: user.authSubject,
      displayName,
    };
  });
}

export async function signInByDisplayName(displayName: string): Promise<{
  token: string;
  userId: number;
  authSubject: string;
  displayName: string;
}> {
  const db = requireDb();
  const row = await db
    .select({
      userId: profiles.userId,
      displayName: profiles.displayName,
      authSubject: users.authSubject,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.userId))
    .where(eq(profiles.displayName, displayName.trim()))
    .limit(1);

  const found = row[0];
  if (!found) {
    throw new ClientError(404, 'no account found for that display name');
  }

  return {
    token: signAccessToken(found.userId),
    userId: found.userId,
    authSubject: found.authSubject,
    displayName: found.displayName,
  };
}
