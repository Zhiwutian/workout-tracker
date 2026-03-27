import { appendFileSync } from 'node:fs';
import { logger } from '@server/lib/logger.js';

const DEBUG_LOG_PATH = '/workspace/.cursor/debug-4c6fd1.log';
const SESSION_ID = '4c6fd1';

/** NDJSON line for debug mode (workspace path; no-op on hosts without /workspace). */
export function agentDebugLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}): void {
  const row = {
    sessionId: SESSION_ID,
    timestamp: Date.now(),
    runId: payload.runId ?? 'pre-fix',
    hypothesisId: payload.hypothesisId,
    location: payload.location,
    message: payload.message,
    data: payload.data ?? {},
  };
  const line = JSON.stringify(row) + '\n';
  try {
    appendFileSync(DEBUG_LOG_PATH, line);
  } catch {
    /* Render / CI: path missing */
  }
  logger.info(
    {
      agentDebugSession: SESSION_ID,
      hypothesisId: payload.hypothesisId,
      location: payload.location,
      message: payload.message,
      data: payload.data ?? {},
      runId: payload.runId ?? 'pre-fix',
    },
    'agent-debug',
  );
}
