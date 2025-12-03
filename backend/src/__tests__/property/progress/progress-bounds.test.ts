/**
 * Property 1: Progress percentage bounds
 * Feature: system-improvements, Property 1: Progress percentage bounds
 * Validates: Requirements 1.2
 * 
 * For any file count (processed and total), the calculated progress percentage
 * should always be between 0 and 100 inclusive.
 */

import * as fc from 'fast-check';
import { fileCountArb } from '../generators/common';

/**
 * Calculate progress percentage from file counts
 */
function calculateProgress(processed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((processed / total) * 100);
}

describe('Property 1: Progress percentage bounds', () => {
  it('should keep progress percentage between 0-100 for all file counts', () => {
    fc.assert(
      fc.property(fileCountArb, ({ processed, total }) => {
        const percentage = calculateProgress(processed, total);
        return percentage >= 0 && percentage <= 100;
      }),
      { numRuns: 100 }
    );
  });

  it('should return 0 when total is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('should return 100 when processed equals total (and total > 0)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (count) => {
        return calculateProgress(count, count) === 100;
      }),
      { numRuns: 100 }
    );
  });

  it('should return 0 when processed is 0', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (total) => {
        return calculateProgress(0, total) === 0;
      }),
      { numRuns: 100 }
    );
  });
});
