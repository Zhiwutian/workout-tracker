const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

/**
 * Optional absolute API base URL for split frontend/backend hosting.
 * Example: https://your-api-service.onrender.com
 */
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

/**
 * Resolve API request input against optional hosted API origin.
 */
export function resolveApiInput(input: RequestInfo): RequestInfo {
  if (!apiBaseUrl || typeof input !== 'string' || !input.startsWith('/')) {
    return input;
  }
  return `${apiBaseUrl}${input}`;
}

/**
 * Build an `href` for full-page navigation to the API (e.g. OIDC login redirect).
 * Same-origin deploys use a root-relative path; split deploys use the API origin.
 */
export function apiHref(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('apiHref expects a path starting with /');
  }
  if (!apiBaseUrl) {
    return path;
  }
  return `${apiBaseUrl}${path}`;
}
