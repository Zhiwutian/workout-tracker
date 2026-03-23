import { describe, expect, it } from 'vitest';
import { setVolume } from './volume.js';

describe('setVolume', () => {
  it('multiplies reps by weight', () => {
    expect(setVolume(10, 200)).toBe(2000);
  });

  it('handles fractional weight', () => {
    expect(setVolume(5, 52.5)).toBe(262.5);
  });
});
