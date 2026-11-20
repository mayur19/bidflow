import type { BidInput, IneligibilityReason, LineResult, RfqLineInput } from './bid-types.js';
import { DomainError } from './errors.js';
import { multiplyByQuantity } from './line-total.js';
import { addMoney, money, zeroMoney } from './money.js';

export interface BidTotals {
  readonly lines: readonly LineResult[];
  readonly totalMinor: number | null;
  readonly maxLeadDays: number | null;
  readonly reasons: readonly IneligibilityReason[];
}

function assertBidLines(bid: BidInput, rfqLines: readonly RfqLineInput[]): void {
  const known = new Set(rfqLines.map((line) => line.id));
  const seen = new Set<string>();
  for (const line of bid.lines) {
    if (!known.has(line.rfqLineId) || seen.has(line.rfqLineId)) {
      throw new DomainError('INVALID_BID', `Bid ${bid.bidId} has an unknown or duplicate line`, {
        rfqLineId: line.rfqLineId,
      });
    }
    if (!Number.isInteger(line.leadDays) || line.leadDays < 0) {
      throw new DomainError('INVALID_BID', `Bid ${bid.bidId} has an invalid lead time`);
    }
    seen.add(line.rfqLineId);
  }
}

function priceLines(bid: BidInput, rfqLines: readonly RfqLineInput[]): LineResult[] {
  return rfqLines.flatMap((rfqLine) => {
    const quoted = bid.lines.find((line) => line.rfqLineId === rfqLine.id);
    if (!quoted) return [];
    const total = multiplyByQuantity(
      money(quoted.unitPriceMinor, bid.currency),
      rfqLine.quantityMilli,
    );
    return [
      {
        rfqLineId: rfqLine.id,
        quantityMilli: rfqLine.quantityMilli,
        unitPriceMinor: quoted.unitPriceMinor,
        lineTotalMinor: total.amountMinor,
        leadDays: quoted.leadDays,
        compliant: quoted.compliant,
      },
    ];
  });
}

function collectReasons(
  bid: BidInput,
  rfqCurrency: string,
  complete: boolean,
  lines: readonly LineResult[],
  totalMinor: number | null,
): IneligibilityReason[] {
  const checks: ReadonlyArray<readonly [boolean, IneligibilityReason]> = [
    [bid.status === 'WITHDRAWN', 'WITHDRAWN'],
    [Boolean(bid.disqualificationReason), 'DISQUALIFIED'],
    [lines.some((line) => !line.compliant), 'TECHNICALLY_NON_COMPLIANT'],
    [bid.currency !== rfqCurrency, 'CURRENCY_MISMATCH'],
    [!complete, 'INCOMPLETE'],
    [totalMinor !== null && totalMinor <= 0, 'NON_POSITIVE_TOTAL'],
  ];
  return checks.filter(([failed]) => failed).map(([, reason]) => reason);
}

/**
 * Line totals (unit price × quantity, rounded per line) and the bid total
 * (sum of rounded line totals). A bid total exists only when every RFQ line
 * is quoted in the RFQ currency; cross-currency bids are never converted.
 */
export function computeBidTotals(
  bid: BidInput,
  rfqLines: readonly RfqLineInput[],
  rfqCurrency: string,
): BidTotals {
  assertBidLines(bid, rfqLines);
  const lines = priceLines(bid, rfqLines);
  const complete = lines.length === rfqLines.length;
  const comparable = complete && bid.currency === rfqCurrency;
  const totalMinor = comparable
    ? lines.reduce(
        (sum, line) => addMoney(sum, money(line.lineTotalMinor, bid.currency)),
        zeroMoney(bid.currency),
      ).amountMinor
    : null;
  const maxLeadDays = complete ? Math.max(...lines.map((line) => line.leadDays)) : null;
  const reasons = collectReasons(bid, rfqCurrency, complete, lines, totalMinor);
  return { lines, totalMinor, maxLeadDays, reasons };
}
