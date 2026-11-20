import { describe, expect, it } from 'vitest';
import {
  assertValidCriteria,
  DomainError,
  validateCriteria,
  type EvaluationCriterion,
} from '../../src/index.js';
import { AC_RFQ } from './fixtures.js';

const price = (weightBps: number, id = 'p'): EvaluationCriterion => ({
  id,
  label: 'Price',
  kind: 'PRICE',
  weightBps,
});
const quality = (weightBps: number, id = 'q'): EvaluationCriterion => ({
  id,
  label: 'Quality',
  kind: 'QUALITATIVE',
  weightBps,
});

const codes = (criteria: EvaluationCriterion[]) =>
  validateCriteria(criteria).issues.map((issue) => issue.code);

describe('validateCriteria (B-09)', () => {
  it('accepts one price criterion plus qualitative criteria totalling 100%', () => {
    expect(validateCriteria(AC_RFQ.criteria)).toEqual({
      valid: true,
      issues: [],
      totalWeightBps: 10_000,
    });
    expect(() => assertValidCriteria(AC_RFQ.criteria)).not.toThrow();
  });

  it('blocks weights that do not total 100% with a clear message', () => {
    const result = validateCriteria([price(6000), quality(3500)]);
    expect(result.valid).toBe(false);
    expect(result.totalWeightBps).toBe(9500);
    expect(result.issues).toEqual([
      {
        code: 'WEIGHTS_NOT_100_PERCENT',
        message: 'Criterion weights must total 100% (10000 bps); current total is 9500 bps',
      },
    ]);
    expect(codes([price(6000), quality(4500)])).toEqual(['WEIGHTS_NOT_100_PERCENT']);
  });

  it('requires exactly one price criterion', () => {
    expect(codes([quality(10_000)])).toEqual(['PRICE_CRITERION_COUNT']);
    expect(codes([price(5000, 'a'), price(4000, 'b'), quality(1000)])).toEqual([
      'PRICE_CRITERION_COUNT',
    ]);
  });

  it('requires at least one qualitative criterion', () => {
    expect(codes([price(10_000)])).toEqual(['NO_QUALITATIVE_CRITERION']);
  });

  it('flags out-of-range, fractional and duplicate weights', () => {
    expect(codes([price(0), quality(10_000)])).toEqual(['INVALID_WEIGHT']);
    expect(codes([price(10_001), quality(1)])).toContain('INVALID_WEIGHT');
    expect(codes([price(5000.5), quality(4999.5)])).toEqual(['INVALID_WEIGHT', 'INVALID_WEIGHT']);
    expect(codes([price(5000), quality(2500, 'q'), quality(2500, 'q')])).toEqual([
      'DUPLICATE_CRITERION',
    ]);
  });

  it('reports every problem at once for an empty list', () => {
    expect(codes([])).toEqual([
      'PRICE_CRITERION_COUNT',
      'NO_QUALITATIVE_CRITERION',
      'WEIGHTS_NOT_100_PERCENT',
    ]);
  });

  it('throws INVALID_CRITERIA with the issues as details', () => {
    try {
      assertValidCriteria([price(10_000)]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('INVALID_CRITERIA');
      expect((error as DomainError).details).toHaveLength(1);
    }
  });
});
