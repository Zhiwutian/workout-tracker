import { describe, expect, it } from 'vitest';
import { parseRestSecondsInput } from './parse-rest-seconds';

describe('parseRestSecondsInput', () => {
  it('returns null for empty or whitespace', () => {
    expect(parseRestSecondsInput('')).toBeNull();
    expect(parseRestSecondsInput('   ')).toBeNull();
  });

  it('parses integer seconds', () => {
    expect(parseRestSecondsInput('90')).toBe(90);
    expect(parseRestSecondsInput('0')).toBe(0);
  });

  it('clamps to 0..86400', () => {
    expect(parseRestSecondsInput('-5')).toBe(0);
    expect(parseRestSecondsInput('999999')).toBe(86400);
  });

  it('treats non-numeric as 0', () => {
    expect(parseRestSecondsInput('abc')).toBe(0);
  });
});
