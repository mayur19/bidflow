import { BPS_SCALE } from './basis-points.js';
import { DomainError } from './errors.js';

/**
 * Evaluation criteria for an RFQ (FR-06). Exactly one PRICE criterion plus
 * one or more QUALITATIVE criteria; weights are basis points totalling
 * 10 000 (100 %). Acceptance test B-09.
 */
export type CriterionKind = 'PRICE' | 'QUALITATIVE';

export interface EvaluationCriterion {
  readonly id: string;
  readonly label: string;
  readonly kind: CriterionKind;
  readonly weightBps: number;
}

export type CriteriaIssueCode =
  | 'INVALID_WEIGHT'
  | 'DUPLICATE_CRITERION'
  | 'PRICE_CRITERION_COUNT'
  | 'NO_QUALITATIVE_CRITERION'
  | 'WEIGHTS_NOT_100_PERCENT';

export interface CriteriaIssue {
  readonly code: CriteriaIssueCode;
  readonly message: string;
  readonly criterionId?: string;
}

export interface CriteriaValidation {
  readonly valid: boolean;
  readonly issues: readonly CriteriaIssue[];
  readonly totalWeightBps: number;
}

function weightIssues(criteria: readonly EvaluationCriterion[]): CriteriaIssue[] {
  return criteria
    .filter((c) => !Number.isInteger(c.weightBps) || c.weightBps < 1 || c.weightBps > BPS_SCALE)
    .map((c) => ({
      code: 'INVALID_WEIGHT' as const,
      criterionId: c.id,
      message: `Weight for "${c.label}" must be between 0.01% and 100%`,
    }));
}

function duplicateIssues(criteria: readonly EvaluationCriterion[]): CriteriaIssue[] {
  const seen = new Set<string>();
  return criteria.flatMap((c) => {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      return [];
    }
    return [{ code: 'DUPLICATE_CRITERION' as const, criterionId: c.id, message: 'Duplicate id' }];
  });
}

function structureIssues(criteria: readonly EvaluationCriterion[]): CriteriaIssue[] {
  const priceCount = criteria.filter((c) => c.kind === 'PRICE').length;
  const issues: CriteriaIssue[] = [];
  if (priceCount !== 1) {
    issues.push({
      code: 'PRICE_CRITERION_COUNT',
      message: `Exactly one price criterion is required (found ${priceCount})`,
    });
  }
  if (!criteria.some((c) => c.kind === 'QUALITATIVE')) {
    issues.push({
      code: 'NO_QUALITATIVE_CRITERION',
      message: 'At least one non-price criterion is required',
    });
  }
  return issues;
}

export function validateCriteria(criteria: readonly EvaluationCriterion[]): CriteriaValidation {
  const totalWeightBps = criteria.reduce((sum, c) => sum + c.weightBps, 0);
  const issues = [...weightIssues(criteria), ...duplicateIssues(criteria)];
  issues.push(...structureIssues(criteria));
  if (totalWeightBps !== BPS_SCALE) {
    issues.push({
      code: 'WEIGHTS_NOT_100_PERCENT',
      message: `Criterion weights must total 100% (10000 bps); current total is ${totalWeightBps} bps`,
    });
  }
  return { valid: issues.length === 0, issues, totalWeightBps };
}

export function assertValidCriteria(criteria: readonly EvaluationCriterion[]): void {
  const result = validateCriteria(criteria);
  if (!result.valid) {
    throw new DomainError('INVALID_CRITERIA', 'Evaluation criteria are invalid', result.issues);
  }
}
