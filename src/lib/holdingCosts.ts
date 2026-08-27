export type HoldingMode = 'pct' | 'flat' | 'monthly';
export type MonthlyRateMode = 'dollar' | 'pct';

export interface HoldingCostInputs {
  mode: HoldingMode;
  pct: string;
  flat: string;
  monthlyRate: string;
  monthlyRateMode: MonthlyRateMode;
  months: string;
  purchasePrice: number;
}

/** Monthly carry amount in dollars (only meaningful in monthly mode). */
export function monthlyCarryAmount(
  monthlyRate: string,
  monthlyRateMode: MonthlyRateMode,
  purchasePrice: number,
): number {
  const rate = parseFloat(monthlyRate) || 0;
  return monthlyRateMode === 'pct' ? purchasePrice * (rate / 100) : rate;
}

export function computeHoldingCosts(input: HoldingCostInputs): number {
  const { mode, pct, flat, monthlyRate, monthlyRateMode, months, purchasePrice } = input;
  if (mode === 'pct') return purchasePrice * ((parseFloat(pct) || 0) / 100);
  if (mode === 'flat') return parseFloat(flat) || 0;
  const monthly = monthlyCarryAmount(monthlyRate, monthlyRateMode, purchasePrice);
  return monthly * (parseFloat(months) || 0);
}

const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/** e.g. "(6 mo @ $1,800/mo)" or "(3%)" or "(flat)" */
export function holdingCostLabel(input: HoldingCostInputs): string {
  const { mode, pct, monthlyRate, monthlyRateMode, months, purchasePrice } = input;
  if (mode === 'pct') return `(${parseFloat(pct) || 0}%)`;
  if (mode === 'flat') return '(flat)';
  const m = parseFloat(months) || 0;
  const rateText =
    monthlyRateMode === 'pct'
      ? `${parseFloat(monthlyRate) || 0}%/mo (${money(monthlyCarryAmount(monthlyRate, monthlyRateMode, purchasePrice))}/mo)`
      : `${money(monthlyCarryAmount(monthlyRate, monthlyRateMode, purchasePrice))}/mo`;
  return `(${m} mo @ ${rateText})`;
}
