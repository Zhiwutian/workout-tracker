import { describe, expect, it } from 'vitest';
import { e2eRelaxRateLimitFieldSchema } from './env.js';

function parseRelax(
  value: string | boolean | undefined,
): { ok: true; value: boolean } | { ok: false } {
  const r = e2eRelaxRateLimitFieldSchema.safeParse({
    E2E_RELAX_RATE_LIMIT: value,
  });
  if (!r.success) return { ok: false };
  return { ok: true, value: r.data.E2E_RELAX_RATE_LIMIT };
}

describe('E2E_RELAX_RATE_LIMIT (env schema coercion)', () => {
  it.each([
    ['true', true],
    ['TRUE', true],
    ['1', true],
    ['yes', true],
    ['on', true],
    ['t', true],
    ['y', true],
    ['false', false],
    ['0', false],
    ['no', false],
    ['off', false],
    ['', false],
    [undefined, false],
  ])('treats %p as relaxed=%p', (input, expected) => {
    const r = parseRelax(input);
    expect(r).toEqual({ ok: true, value: expected });
  });

  it('accepts boolean true from preprocess', () => {
    expect(parseRelax(true)).toEqual({ ok: true, value: true });
  });

  it('rejects non-boolean-coercible garbage', () => {
    expect(parseRelax('maybe').ok).toBe(false);
  });
});
