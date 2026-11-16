import { Discount, GstMode, SaleTotals } from '@org/shared-models';

/** One line the calculator works on: the rate (the version's MRP), the quantity, its own discount and its GST rate (sales R7, R43, R44). */
export interface CounterCalcLine {
  rate: number;
  quantity: number;
  discount: Discount;
  gstRatePercent: number;
}

/** A line's amounts as the calculator worked them (sales R7, R44). */
export interface CounterCalcLineAmounts {
  gross: number;
  itemDiscount: number;
  lineAmount: number;
  totalDiscountShare: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export interface CounterCalcResult {
  lines: CounterCalcLineAmounts[];
  totals: SaleTotals;
}

/**
 * Sales R7, R44: the one amount rule of an order, an invoice and a counter bill, ported from the server's `SaleCalculation` so the
 * screen shows the same numbers the API will return. Every step is rounded to 2 decimals half away from zero, done on integer paise
 * (BigInt) to match the server's `decimal`; the paise left by sharing the total discount go to the largest line (the first on a tie);
 * the grand total is rounded to the nearest rupee and the difference is the round-off.
 */
export function computeCounterTotals(lines: CounterCalcLine[], totalDiscount: Discount, gstMode: GstMode): CounterCalcResult {
  const bases = lines.map((line) => {
    const gross = BigInt(paise(line.rate)) * BigInt(line.quantity);
    const itemDiscount = discountOn(gross, line.discount);
    return { gross, itemDiscount, lineAmount: gross - itemDiscount };
  });
  const subtotal = bases.reduce((sum, b) => sum + b.lineAmount, 0n);

  // A rupee discount above the subtotal is refused by the API (400); the live total clamps it so the screen stays readable.
  const wanted = discountOn(subtotal, totalDiscount);
  const discount = wanted > subtotal ? subtotal : wanted;

  const shares = shareDiscount(bases.map((b) => b.lineAmount), subtotal, discount);
  const amounts = bases.map((b, i) => withTax(b.lineAmount, shares[i], lines[i].gstRatePercent, gstMode));
  const taxable = amounts.reduce((s, a) => s + a.taxable, 0n);
  const cgst = amounts.reduce((s, a) => s + a.cgst, 0n);
  const sgst = amounts.reduce((s, a) => s + a.sgst, 0n);
  const igst = amounts.reduce((s, a) => s + a.igst, 0n);
  const before = taxable + cgst + sgst + igst;
  const grand = divRound(before, 100n) * 100n;

  return {
    lines: bases.map((b, i) => ({
      gross: amount(b.gross),
      itemDiscount: amount(b.itemDiscount),
      lineAmount: amount(b.lineAmount),
      totalDiscountShare: amount(shares[i]),
      taxable: amount(amounts[i].taxable),
      cgst: amount(amounts[i].cgst),
      sgst: amount(amounts[i].sgst),
      igst: amount(amounts[i].igst),
    })),
    totals: {
      subtotal: amount(subtotal),
      totalDiscount: amount(discount),
      taxable: amount(taxable),
      cgst: amount(cgst),
      sgst: amount(sgst),
      igst: amount(igst),
      roundOff: amount(grand - before),
      grandTotal: amount(grand),
      gst: amount(cgst + sgst + igst),
      beforeRounding: amount(before),
    },
  };
}

/** Sales R7, BR-GST-05: the GST mode of a bill (the same rule as the server's `SaleMoney.GstModeOf`). */
export function gstModeOf(isGstApplied: boolean, companyState: string | null | undefined, schoolState: string | null | undefined): GstMode {
  if (!isGstApplied) return 'NOT_APPLIED';
  const company = companyState?.trim();
  const school = schoolState?.trim();
  if (!company || !school) return 'SAME_STATE';
  return company.toLowerCase() === school.toLowerCase() ? 'SAME_STATE' : 'OTHER_STATE';
}

/** R7: the rupee amount a discount takes from a base, in paise (BR-DIS-04). */
function discountOn(base: bigint, discount: Discount): bigint {
  switch (discount.kind) {
    case 'PERCENT':
      return divRound(base * BigInt(paise(discount.value)), 10_000n);
    case 'AMOUNT':
      return BigInt(paise(discount.value));
    default:
      return 0n;
  }
}

/** R7 step 3: the total discount shared by line amount; the rounding rest goes to the largest line (the first on a tie). */
function shareDiscount(amounts: bigint[], subtotal: bigint, discount: bigint): bigint[] {
  const shares = amounts.map(() => 0n);
  if (subtotal === 0n || discount === 0n) return shares;

  for (let i = 0; i < amounts.length; i++) {
    shares[i] = divRound(discount * amounts[i], subtotal);
  }
  let largest = 0;
  for (let i = 1; i < amounts.length; i++) {
    if (amounts[i] > amounts[largest]) largest = i;
  }
  shares[largest] += discount - shares.reduce((sum, s) => sum + s, 0n);
  return shares;
}

/** R7 step 4: the line's taxable value and its GST at the item's rate (CGST + SGST on the same state, IGST on another). */
function withTax(lineAmount: bigint, share: bigint, ratePercent: number, mode: GstMode): { taxable: bigint; cgst: bigint; sgst: bigint; igst: bigint } {
  const taxable = lineAmount - share;
  if (mode === 'SAME_STATE') {
    const half = divRound(taxable * BigInt(paise(ratePercent)), 20_000n);
    return { taxable, cgst: half, sgst: half, igst: 0n };
  }
  if (mode === 'OTHER_STATE') {
    return { taxable, cgst: 0n, sgst: 0n, igst: divRound(taxable * BigInt(paise(ratePercent)), 10_000n) };
  }
  return { taxable, cgst: 0n, sgst: 0n, igst: 0n };
}

/** Rounds `value / divisor` to the nearest integer, half away from zero; both are positive whole numbers. */
function divRound(value: bigint, divisor: bigint): bigint {
  return (2n * value + divisor) / (2n * divisor);
}

/** A money amount as whole paise (the values are two-decimal, so this is exact). */
function paise(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

/** Whole paise back to a money amount. */
function amount(paiseValue: bigint): number {
  return Number(paiseValue) / 100;
}
