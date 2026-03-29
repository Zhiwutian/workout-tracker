/**
 * **`GET /api/hello`** — minimal JSON sanity check (useful in tutorials and deploy smoke).
 */
import { Request, Response } from 'express';
import { sendSuccess } from '@server/lib/http-response.js';

/** Handle `GET /api/hello`. */
export function readHello(_req: Request, res: Response): void {
  sendSuccess(res, { message: 'Hello, World!' });
}
