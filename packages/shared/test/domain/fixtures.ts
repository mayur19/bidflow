import type { BidInput, ComparisonRfq, ScoreInput } from '../../src/index.js';

/**
 * PRD §8 seeded case: Cedar Grove Hotels sources 20 air-conditioning
 * replacement units (+ installation). Metro Electrical is the cheapest bid
 * but technically non-compliant on the unit line.
 */
export const AC_RFQ: ComparisonRfq = {
  currency: 'USD',
  lines: [
    { id: 'line-units', description: 'Split AC unit, 24k BTU, R-32', quantityMilli: 20_000 },
    { id: 'line-install', description: 'Installation and commissioning', quantityMilli: 20_000 },
  ],
  criteria: [
    { id: 'price', label: 'Price', kind: 'PRICE', weightBps: 6000 },
    { id: 'quality', label: 'Technical quality', kind: 'QUALITATIVE', weightBps: 2500 },
    { id: 'delivery', label: 'Delivery', kind: 'QUALITATIVE', weightBps: 1500 },
  ],
};

function bid(
  bidId: string,
  supplierName: string,
  unit: number,
  install: number,
  leadDays: number,
  overrides: Partial<BidInput> = {},
): BidInput {
  return {
    bidId,
    supplierId: `sup-${bidId}`,
    supplierName,
    currency: 'USD',
    status: 'SUBMITTED',
    submittedAt: '2026-11-10T09:00:00.000Z',
    lines: [
      { rfqLineId: 'line-units', unitPriceMinor: unit, leadDays, compliant: true },
      { rfqLineId: 'line-install', unitPriceMinor: install, leadDays: 2, compliant: true },
    ],
    ...overrides,
  };
}

export const PEAK = bid('bid-peak', 'Peak HVAC', 185_000, 22_000, 21);
export const ALLIED = bid('bid-allied', 'Allied Facilities', 179_000, 26_000, 14);
export const METRO: BidInput = {
  ...bid('bid-metro', 'Metro Electrical', 169_000, 18_000, 35),
  lines: [
    { rfqLineId: 'line-units', unitPriceMinor: 169_000, leadDays: 35, compliant: false },
    { rfqLineId: 'line-install', unitPriceMinor: 18_000, leadDays: 2, compliant: true },
  ],
};

export const AC_BIDS: readonly BidInput[] = [PEAK, METRO, ALLIED];

function score(
  bidId: string,
  criterionId: string,
  value: number,
  evaluatorId = 'eval-1',
): ScoreInput {
  return { bidId, criterionId, evaluatorId, score: value };
}

export const AC_SCORES: readonly ScoreInput[] = [
  score('bid-peak', 'quality', 90),
  score('bid-peak', 'delivery', 70),
  score('bid-allied', 'quality', 75),
  score('bid-allied', 'delivery', 95),
  score('bid-metro', 'quality', 60),
  score('bid-metro', 'delivery', 50),
];

export { bid as makeBid, score as makeScore };
