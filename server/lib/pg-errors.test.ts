import { describe, expect, it } from 'vitest';
import { getDbFailureHint, isPgUniqueViolation } from './pg-errors.js';

describe('isPgUniqueViolation', () => {
  it('returns false for non-errors', () => {
    expect(isPgUniqueViolation(null)).toBe(false);
    expect(isPgUniqueViolation(new Error('x'))).toBe(false);
  });

  it('detects 23505', () => {
    expect(isPgUniqueViolation({ code: '23505' })).toBe(true);
    expect(isPgUniqueViolation({ code: '23505', constraint: 'c' })).toBe(true);
  });

  it('filters by constraint name when provided', () => {
    expect(
      isPgUniqueViolation(
        { code: '23505', constraint: 'profiles_display_name_unique' },
        'profiles_display_name_unique',
      ),
    ).toBe(true);
    expect(
      isPgUniqueViolation(
        { code: '23505', constraint: 'other' },
        'profiles_display_name_unique',
      ),
    ).toBe(false);
  });

  it('detects 23505 on Drizzle-wrapped error (cause chain)', () => {
    const inner = {
      code: '23505',
      constraint: 'users_authSubject_unique',
    };
    const wrapped = {
      name: 'DrizzleQueryError',
      message: 'duplicate key',
      cause: inner,
    };
    expect(isPgUniqueViolation(wrapped, 'users_authSubject_unique')).toBe(true);
    expect(isPgUniqueViolation(wrapped, 'profiles_display_name_unique')).toBe(
      false,
    );
  });
});

describe('getDbFailureHint', () => {
  it('returns migrate hint for undefined table (42P01)', () => {
    const err = { code: '42P01', message: 'relation "users" does not exist' };
    expect(getDbFailureHint(err)).toContain('db:migrate');
  });

  it('detects 42P01 on Drizzle cause chain', () => {
    const err = {
      name: 'DrizzleQueryError',
      cause: { code: '42P01' },
    };
    expect(getDbFailureHint(err)).toContain('db:migrate');
  });

  it('returns connection hint for ECONNREFUSED', () => {
    expect(getDbFailureHint({ code: 'ECONNREFUSED' })).toContain('connect');
  });

  it('returns undefined for unknown errors', () => {
    expect(getDbFailureHint(new Error('weird'))).toBeUndefined();
  });
});
