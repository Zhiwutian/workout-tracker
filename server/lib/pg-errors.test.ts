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
});
