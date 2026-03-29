import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./auth-storage', () => ({
  getStoredToken: vi.fn(),
}));

import { mergeApiRequestInit } from './api-client';
import * as authStorage from './auth-storage';

describe('mergeApiRequestInit', () => {
  beforeEach(() => {
    vi.mocked(authStorage.getStoredToken).mockReturnValue(null);
  });

  it('sets Accept application/json when missing', () => {
    const m = mergeApiRequestInit();
    expect(new Headers(m.headers).get('Accept')).toBe('application/json');
  });

  it('does not override Accept when set', () => {
    const m = mergeApiRequestInit({
      headers: { Accept: 'text/plain' },
    });
    expect(new Headers(m.headers).get('Accept')).toBe('text/plain');
  });

  it('sets Bearer when token present', () => {
    vi.mocked(authStorage.getStoredToken).mockReturnValue('tok');
    const m = mergeApiRequestInit();
    expect(new Headers(m.headers).get('Authorization')).toBe('Bearer tok');
  });

  it('sets Content-Type for JSON object body string', () => {
    const m = mergeApiRequestInit({
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });
    expect(new Headers(m.headers).get('Content-Type')).toBe('application/json');
  });

  it('does not set Content-Type when already set', () => {
    const m = mergeApiRequestInit({
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: '{}',
    });
    expect(new Headers(m.headers).get('Content-Type')).toBe('application/xml');
  });

  it('uses credentials include', () => {
    const m = mergeApiRequestInit();
    expect(m.credentials).toBe('include');
  });
});
