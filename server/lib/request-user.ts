import type { Request } from 'express';

/**
 * After `authMiddleware`, `req.user.userId` is the server-trusted identity.
 * Use this helper instead of repeating `req.user?.userId` checks in every controller.
 * If it throws, the route was wired without middleware (a bug)—not a normal client error.
 */
export function requireUserId(req: Request): number {
  const userId = req.user?.userId;
  if (userId === undefined) {
    throw new Error('auth middleware required');
  }
  return userId;
}
