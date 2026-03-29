/**
 * **`/api/health`** (liveness) and **`/api/ready`** (readiness, includes DB). Used by orchestrators and smoke checks.
 */
import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '@server/lib/http-response.js';
import { readHealthReport } from '@server/services/health-service.js';

/** Handle `GET /api/health`. */
export async function readHealth(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const report = await readHealthReport();
  sendSuccess(res, report, 200);
}

/** Handle `GET /api/ready` with stricter dependency readiness checks. */
export async function readReady(
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const report = await readHealthReport();
  const statusCode = report.database === 'ok' ? 200 : 503;
  sendSuccess(res, report, statusCode);
}
