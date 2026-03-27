import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@server/config/env.js';
import { ClientError } from './client-error.js';
import { agentDebugLog } from './agent-debug-log.js';
import { readAppSessionCookie } from './session-cookies.js';

const secret = env.TOKEN_SECRET;

/**
 * Accept Bearer JWT (demo / guest) or signed session cookie (OIDC).
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authorization = req.get('authorization') ?? '';
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const token = bearerMatch?.[1]?.trim();

  if (token) {
    try {
      const payload = jwt.verify(token, secret) as { userId?: unknown };
      if (typeof payload.userId !== 'number') {
        throw new ClientError(401, 'invalid access token payload');
      }
      if (req.path === '/me') {
        // #region agent log
        agentDebugLog({
          hypothesisId: 'H4',
          location: 'authorization-middleware.ts:authMiddleware',
          message: 'api_me_auth_outcome',
          data: { outcome: 'bearer_ok' },
        });
        // #endregion
      }
      req.user = { userId: payload.userId };
      next();
      return;
    } catch (err) {
      if (err instanceof ClientError) {
        throw err;
      }
      throw new ClientError(401, 'invalid access token');
    }
  }

  const session = readAppSessionCookie(req);
  if (session && typeof session.userId === 'number') {
    if (req.path === '/me') {
      // #region agent log
      agentDebugLog({
        hypothesisId: 'H4',
        location: 'authorization-middleware.ts:authMiddleware',
        message: 'api_me_auth_outcome',
        data: { outcome: 'session_cookie_ok' },
      });
      // #endregion
    }
    req.user = { userId: session.userId };
    next();
    return;
  }

  if (req.path === '/me') {
    const c = req.get('cookie') ?? '';
    // #region agent log
    agentDebugLog({
      hypothesisId: 'H1',
      location: 'authorization-middleware.ts:authMiddleware',
      message: 'api_me_auth_outcome',
      data: {
        outcome: 'unauthenticated',
        hadAuthorizationHeader: Boolean(
          (req.get('authorization') ?? '').match(/^Bearer\s+/i),
        ),
        hasWtSessionCookieName: c.includes('wt_session='),
      },
    });
    // #endregion
  }

  throw new ClientError(401, 'authentication required');
}
