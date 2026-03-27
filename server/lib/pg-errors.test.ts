import { describe, expect, it } from 'vitest';
import { isPgUniqueViolation } from './pg-errors.js';

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
