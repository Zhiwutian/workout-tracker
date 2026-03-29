/** Sign-in flows, session, `/api/me`, `/api/profile`, and the demo hello endpoint. */
import { fetchJson, fetchNoContent } from '@/lib/api-client';
import type { AuthOptionsResponse, MeResponse } from '@/lib/api/types';

export async function readHelloMessage(): Promise<string> {
  const helloData = await fetchJson<{ message: string }>('/api/hello');
  return helloData.message;
}

export async function readAuthOptions(): Promise<AuthOptionsResponse> {
  return fetchJson<AuthOptionsResponse>('/api/auth/options');
}

export async function postSessionLogout(): Promise<void> {
  await fetchNoContent('/api/auth/logout', { method: 'POST' });
}

export async function signUp(displayName: string): Promise<{ token: string }> {
  return fetchJson<{ token: string }>('/api/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

export async function signIn(displayName: string): Promise<{ token: string }> {
  return fetchJson<{ token: string }>('/api/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
}

export async function createGuestSession(): Promise<{ token: string }> {
  return fetchJson<{ token: string }>('/api/auth/guest', {
    method: 'POST',
  });
}

export async function readMe(): Promise<MeResponse> {
  return fetchJson<MeResponse>('/api/me');
}

export async function patchProfile(body: {
  displayName?: string;
  weightUnit?: 'lb' | 'kg';
  timezone?: string | null;
}): Promise<MeResponse> {
  return fetchJson<MeResponse>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
