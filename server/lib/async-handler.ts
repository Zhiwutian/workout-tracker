/**
 * Express does not automatically catch `Promise` rejections from `async` route handlers.
 * Wrapping handlers with `asyncHandler` forwards failures to `next(err)` so
 * `server/lib/error-middleware.ts` can return a consistent JSON error shape.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

/** Async Express route handler with access to `next` (e.g. Zod `parse` + `next(err)` patterns). */
export type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export type AsyncHandlerOptions = {
  /** Runs before `next(err)` (e.g. structured warn logs). */
  onError?: (err: unknown, req: Request) => void;
};

/**
 * Wrap an async route handler so rejections reach Express `error-middleware` via `next(err)`.
 */
export function asyncHandler(
  handler: AsyncRouteHandler,
  options?: AsyncHandlerOptions,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch((err: unknown) => {
      options?.onError?.(err, req);
      next(err);
    });
  };
}
