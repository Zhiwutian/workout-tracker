import * as oidc from 'openid-client';
import { eq } from 'drizzle-orm';
import { env } from '@server/config/env.js';
import { DbClient, getDrizzleDb } from '@server/db/drizzle.js';
import { profiles, users } from '@server/db/schema.js';
import { ClientError } from '@server/lib/client-error.js';
import { isPgUniqueViolation } from '@server/lib/pg-errors.js';
import { logger } from '@server/lib/logger.js';

let oidcConfigPromise: Promise<oidc.Configuration> | null = null;

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

export function assertOidcConfigured(): void {
  if (!env.AUTH_OIDC_ENABLED) {
    throw new ClientError(503, 'OpenID Connect login is not enabled');
  }
}

export async function getOidcConfiguration(): Promise<oidc.Configuration> {
  assertOidcConfigured();
  if (!oidcConfigPromise) {
    const issuer = new URL(env.AUTH_OIDC_ISSUER);
    const hasSecret = Boolean(env.AUTH_OIDC_CLIENT_SECRET.trim());
    const clientAuth = hasSecret
      ? oidc.ClientSecretPost(env.AUTH_OIDC_CLIENT_SECRET)
      : oidc.None();
    const metadata = hasSecret
      ? { token_endpoint_auth_method: 'client_secret_post' as const }
      : { token_endpoint_auth_method: 'none' as const };
    oidcConfigPromise = oidc.discovery(
      issuer,
      env.AUTH_OIDC_CLIENT_ID,
      metadata,
      clientAuth,
    );
  }
  return oidcConfigPromise;
}

export async function buildOidcAuthorizationRedirect(
  state: string,
  nonce: string,
  codeVerifier: string,
): Promise<string> {
  const config = await getOidcConfiguration();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: env.AUTH_OIDC_REDIRECT_URI,
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  return redirectTo.toString();
}

/**
 * Build callback URL for token exchange; must match AUTH_OIDC_REDIRECT_URI origin/path.
 */
export function buildOidcCallbackUrl(req: { originalUrl: string }): URL {
  const configured = new URL(env.AUTH_OIDC_REDIRECT_URI);
  const q = req.originalUrl.indexOf('?');
  const query = q >= 0 ? req.originalUrl.slice(q) : '';
  return new URL(`${configured.pathname}${query}`, configured.origin);
}

export async function exchangeOidcAuthorizationCode(
  req: { originalUrl: string },
  checks: {
    expectedState: string;
    expectedNonce: string;
    pkceCodeVerifier: string;
  },
): Promise<{ sub: string; displayName: string | null; email: string | null }> {
  const config = await getOidcConfiguration();
  const callbackUrl = buildOidcCallbackUrl(req);
  const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
    expectedState: checks.expectedState,
    expectedNonce: checks.expectedNonce,
    pkceCodeVerifier: checks.pkceCodeVerifier,
  });
  const claims = tokens.claims();
  const sub = claims?.sub;
  if (!sub) {
    throw new ClientError(401, 'id token subject is missing');
  }
  const name =
    typeof claims?.name === 'string' ? claims.name.trim() || null : null;
  const email =
    typeof claims?.email === 'string' ? claims.email.trim() || null : null;
  return { sub, displayName: name, email };
}

function defaultDisplayName(
  displayName: string | null,
  email: string | null,
  sub: string,
): string {
  if (displayName) return displayName.slice(0, 120);
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local.slice(0, 120);
  }
  return `User ${sub.slice(0, 24)}`;
}

/**
 * Find or create user with authSubject = OIDC sub (IdP-unique).
 */
export async function upsertUserFromOidcProfile(input: {
  sub: string;
  displayName: string | null;
  email: string | null;
}): Promise<number> {
  const db = requireDb();
  const [existing] = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.authSubject, input.sub))
    .limit(1);
  if (existing) return existing.userId;

  let displayName = defaultDisplayName(
    input.displayName,
    input.email,
    input.sub,
  );

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ authSubject: input.sub })
          .returning({ userId: users.userId });
        if (!user) throw new ClientError(500, 'failed to create user');
        await tx.insert(profiles).values({
          userId: user.userId,
          displayName,
        });
        return user.userId;
      });
    } catch (err) {
      if (isPgUniqueViolation(err, 'profiles_display_name_unique')) {
        const suffix = ` ${Math.random().toString(36).slice(2, 8)}`;
        displayName = `${defaultDisplayName(input.displayName, input.email, input.sub).slice(0, 110)}${suffix}`;
        logger.warn(
          { err, displayName },
          'oidc profile display name collision; retrying',
        );
        continue;
      }
      throw err;
    }
  }
  throw new ClientError(500, 'could not allocate unique display name');
}
