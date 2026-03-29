/**
 * Low-level HTTP helpers for the SPA talking to this app’s API.
 * - Adds `credentials: 'include'` so OIDC session cookies are sent on same-site / configured CORS.
 * - Adds `Authorization: Bearer` when a demo/guest JWT exists in `localStorage` (see `auth-storage`).
 * - `fetchJson` unwraps `{ data: T }` success envelopes from `shared/api-contracts`.
 * Feature code should call `fetchJson` / `apiFetch` here—not raw `fetch`—so every route behaves the same.
 */
import {
  type ApiErrorEnvelope,
  type ApiSuccessEnvelope,
} from '@shared/api-contracts';
import { getApiErrorMessage } from '@/lib';
import { resolveApiInput } from './api-base-url';
import { getStoredToken } from './auth-storage';

/**
 * Merge credentials, optional Bearer token, and JSON-friendly defaults into `RequestInit`.
 * Does not override `Accept` or `Content-Type` if already set.
 */
export function mergeApiRequestInit(init: RequestInit = {}): RequestInit {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const body = init.body;
  const hasBody = body !== undefined && body !== null;
  const normalizedBody = typeof body === 'string' ? body.trimStart() : '';
  const isLikelyJsonString =
    normalizedBody.startsWith('{') || normalizedBody.startsWith('[');
  if (hasBody && isLikelyJsonString && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return {
    credentials: 'include',
    ...init,
    headers,
  };
}

/** Low-level fetch with workout-tracker API defaults (origin, cookies, Bearer). */
export async function apiFetch(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  return fetch(resolveApiInput(input), mergeApiRequestInit(init));
}

/**
 * Expect JSON success envelope `{ data: T }`; throw `Error` with API message on failure.
 */
export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(getApiErrorMessage(response.status, errorBody));
  }
  const responseBody = (await response.json()) as ApiSuccessEnvelope<T>;
  return responseBody.data;
}

/** 2xx with empty or ignored body (e.g. 204 DELETE). */
export async function fetchNoContent(
  input: RequestInfo,
  init?: RequestInit,
): Promise<void> {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(getApiErrorMessage(response.status, errorBody));
  }
}
