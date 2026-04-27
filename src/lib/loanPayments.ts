/**
 * Effective payments helper
 *
 * For amortizing loans (DSCR, conventional), payments are auto-derived from
 * the amortization schedule for every month between `first_payment_date` and
 * today. Real `loan_payments` rows override the auto-generated row for that
 * month (matched by year+month).
 *
 * For all other loan types (hard money, private money, bridge, construction),
 * this helper passes manual payments through unchanged — auto-generation does
 * NOT apply because interest accrues against principal until paid.
 */
import type { Loan, LoanPayment } from '@/types/loans';
import { buildAmortizationSchedule } from '@/types/loans';

const AMORTIZING_TYPES = new Set(['dscr', 'conventional']);

export function isAmortizingLoan(loan: Pick<Loan, 'loan_type'>): boolean {
  return AMORTIZING_TYPES.has(loan.loan_type as string);
}

export function isAutoPayment(p: LoanPayment): boolean {
  return (p as any).is_virtual === true;
}

/** YYYY-MM key for a date string */
function ymKey(dateStr: string): string {
  // Defensive against time-zone parsing — only need YYYY-MM
  return dateStr.slice(0, 7);
}

export function getEffectivePayments(
  loan: Loan,
  manualPayments: LoanPayment[],
  extensionMonths: number = 0,
): LoanPayment[] {
  if (!isAmortizingLoan(loan)) {
    return manualPayments;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const schedule = buildAmortizationSchedule(loan, extensionMonths);

  // Bucket manual payments by year-month for fast override lookup.
  const manualByMonth = new Map<string, LoanPayment>();
  for (const p of manualPayments) {
    if (!p.payment_date) continue;
    manualByMonth.set(ymKey(p.payment_date), p);
  }

  const merged: LoanPayment[] = [];

  // Emit one row per scheduled month that is on or before today.
  // Stop at the first scheduled date in the future — those become "Next Payment Due".
  for (const row of schedule) {
    if (row.date > todayStr) break;
    const monthKey = ymKey(row.date);
    const override = manualByMonth.get(monthKey);
    if (override) {
      merged.push(override);
      manualByMonth.delete(monthKey);
      continue;
    }
    const virtual: LoanPayment & { is_virtual: true; source: 'auto' } = {
      id: `auto-${loan.id}-${monthKey}`,
      loan_id: loan.id,
      payment_date: row.date,
      amount: row.payment,
      principal_portion: row.principal,
      interest_portion: row.interest,
      late_fee: null,
      notes: null,
      created_at: row.date,
      is_virtual: true,
      source: 'auto',
    } as any;
    merged.push(virtual);
  }

  // Any remaining manual payments (e.g. extra principal, or dated outside the
  // schedule window) are appended so they still count toward balances.
  for (const p of manualByMonth.values()) {
    merged.push(p);
  }

  merged.sort((a, b) => (a.payment_date ?? '').localeCompare(b.payment_date ?? ''));
  return merged;
}
