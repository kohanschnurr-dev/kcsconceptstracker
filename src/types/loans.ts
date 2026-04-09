export type LoanType =
  | 'hard_money'
  | 'private_money'
  | 'conventional'
  | 'dscr'
  | 'seller_financing'
  | 'heloc'
  | 'bridge'
  | 'construction'
  | 'portfolio'
  | 'other';

export type LoanStatus = 'active' | 'paid_off' | 'default' | 'pending';
export type DrawStatus = 'pending' | 'requested' | 'approved' | 'funded' | 'denied';
export type DrawStructure = 'milestone' | 'percentage' | 'custom';

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  hard_money: 'Hard Money',
  private_money: 'Private Money',
  conventional: 'Conventional',
  dscr: 'DSCR',
  seller_financing: 'Seller Financing',
  heloc: 'Home Equity / HELOC',
  bridge: 'Bridge Loan',
  construction: 'Construction Loan',
  portfolio: 'Portfolio Loan',
  other: 'Other',
};

export const LOAN_STATUS_CONFIG: Record<LoanStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  paid_off: { label: 'Paid Off', className: 'bg-muted text-muted-foreground border-border' },
  default: { label: 'Default', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  pending: { label: 'Pending', className: 'bg-warning/20 text-warning border-warning/30' },
};

export const DRAW_STATUS_CONFIG: Record<DrawStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
  requested: { label: 'Requested', className: 'bg-warning/20 text-warning border-warning/30' },
  approved: { label: 'Approved', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  funded: { label: 'Funded', className: 'bg-success/20 text-success border-success/30' },
  denied: { label: 'Denied', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export interface Loan {
  id: string;
  user_id: string;
  project_id: string | null;
  nickname: string | null;
  lender_name: string;
  lender_contact: string | null;
  loan_type: LoanType;
  loan_type_other: string | null;
  original_amount: number;
  outstanding_balance: number;
  interest_rate: number;
  rate_type: 'fixed' | 'variable';
  variable_index: string | null;
  variable_margin: number | null;
  variable_rate_cap: number | null;
  variable_rate_floor: number | null;
  variable_adjustment_frequency: string | null;
  loan_term_months: number;
  amortization_period_months: number | null;
  payment_frequency: string;
  payment_frequency_custom: string | null;
  interest_calc_method: string;
  start_date: string;
  maturity_date: string;
  first_payment_date: string | null;
  origination_fee_points: number | null;
  origination_fee_dollars: number | null;
  other_closing_costs: number | null;
  has_prepayment_penalty: boolean;
  prepayment_penalty_terms: string | null;
  extension_fee: number | null;
  extension_terms: string | null;
  has_draws: boolean;
  total_draw_amount: number | null;
  draw_structure: DrawStructure | null;
  custom_draw_terms: string | null;
  collateral_type: string | null;
  collateral_description: string | null;
  ltv_at_origination: number | null;
  has_personal_guarantee: boolean;
  notes: string | null;
  status: LoanStatus;
  monthly_payment: number | null;
  created_at: string;
  updated_at: string;
  // joined
  project_name?: string;
}

export interface LoanDraw {
  id: string;
  loan_id: string;
  draw_number: number;
  milestone_name: string | null;
  draw_percentage: number | null;
  draw_amount: number;
  expected_date: string | null;
  status: DrawStatus;
  date_funded: string | null;
  notes: string | null;
  created_at: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  amount: number;
  principal_portion: number | null;
  interest_portion: number | null;
  late_fee: number | null;
  notes: string | null;
  created_at: string;
}

export interface AmortizationRow {
  payment_number: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  drawn_balance?: number;   // cumulative funded draw balance at this date (construction loans)
  draw_events?: string[];   // draw names/labels that funded during this period
  is_balloon?: boolean;
}

/** Standard amortization payment: P * r(1+r)^n / ((1+r)^n - 1) */
export function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
  amortMonths?: number | null,
  paymentFreq?: string,
): number {
  if (paymentFreq === 'interest_only') return (principal * annualRate) / 100 / 12;
  if (paymentFreq === 'deferred') return 0;
  const amort = amortMonths ?? termMonths;
  if (amort === 0 || annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  const n = amort;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/**
 * True accrued interest for a construction loan with draws.
 * Each funded draw accrues interest only from its funded date forward.
 *   Interest = draw_amount × annual_rate × (days_outstanding / 365)
 */
export function calcDrawAccruedInterest(loan: Loan, draws: LoanDraw[]): number {
  const today = new Date();
  const annualRate = loan.interest_rate / 100;
  return draws
    .filter(d => d.status === 'funded' && d.date_funded)
    .reduce((total, draw) => {
      const fundedDate = new Date(draw.date_funded!);
      const daysOutstanding = Math.max(0, (today.getTime() - fundedDate.getTime()) / 86400000);
      return total + draw.draw_amount * annualRate * (daysOutstanding / 365);
    }, 0);
}

/**
 * Current live interest-only payment based on funded draw balance.
 * Used for the "Monthly Payment" stat card on construction loans.
 */
export function calcDrawCurrentPayment(loan: Loan, draws: LoanDraw[]): number {
  const drawnBalance = draws
    .filter(d => d.status === 'funded')
    .reduce((s, d) => s + d.draw_amount, 0);
  return drawnBalance * (loan.interest_rate / 100 / 12);
}

/**
 * Draw-weighted amortization schedule for construction/rehab loans.
 *
 * Logic:
 *  - Funded draws contribute to the interest-bearing balance from their date_funded.
 *  - Unfunded draws with an expected_date are included as projections.
 *  - Each payment row shows interest only on the cumulative drawn balance for that period.
 *  - Interest-only loans pay interest each period + full balloon at maturity.
 *  - Rows where a draw funded are annotated with draw_events for display.
 */
export function buildDrawWeightedSchedule(loan: Loan, draws: LoanDraw[]): AmortizationRow[] {
  type DrawEvent = { date: Date; amount: number; label: string; isFunded: boolean };

  const events: DrawEvent[] = [
    ...draws
      .filter(d => d.status === 'funded' && d.date_funded)
      .map(d => ({
        date: new Date(d.date_funded!),
        amount: d.draw_amount,
        label: d.milestone_name ?? `Draw #${d.draw_number} (${fmtUSD(d.draw_amount)})`,
        isFunded: true,
      })),
    ...draws
      .filter(d => ['pending', 'requested', 'approved'].includes(d.status) && d.expected_date)
      .map(d => ({
        date: new Date(d.expected_date!),
        amount: d.draw_amount,
        label: `${d.milestone_name ?? `Draw #${d.draw_number}`} – projected`,
        isFunded: false,
      })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const r = loan.interest_rate / 100 / 12;
  const term = loan.loan_term_months;
  const firstPayment = new Date((loan.first_payment_date ?? loan.start_date) + 'T12:00:00');
  const rows: AmortizationRow[] = [];

  for (let i = 1; i <= term; i++) {
    const payDate = new Date(firstPayment);
    payDate.setMonth(firstPayment.getMonth() + i - 1);

    // Period window: previous payment date → this payment date
    const periodStart = new Date(firstPayment);
    periodStart.setMonth(firstPayment.getMonth() + i - 2);

    // Draws that funded/project within this billing period
    const periodEvents = events.filter(e => e.date > periodStart && e.date <= payDate);

    // Cumulative drawn balance as of this payment date
    const drawnBalance = events
      .filter(e => e.date <= payDate)
      .reduce((s, e) => s + e.amount, 0);

    const interest = drawnBalance * r;
    const isBalloon = i === term;
    const drawEventLabels = periodEvents.map(e => e.label);

    if (loan.payment_frequency === 'interest_only' || loan.payment_frequency === 'monthly') {
      // Treat as interest-only during the draw period; balloon at end
      rows.push({
        payment_number: i,
        date: payDate.toISOString().split('T')[0],
        payment: isBalloon ? drawnBalance + interest : interest,
        principal: isBalloon ? drawnBalance : 0,
        interest,
        balance: drawnBalance,
        drawn_balance: drawnBalance,
        draw_events: drawEventLabels.length > 0 ? drawEventLabels : undefined,
        is_balloon: isBalloon,
      });
    } else {
      // Amortizing: payment re-calculates each month against current drawn balance
      const payment =
        drawnBalance > 0
          ? calcMonthlyPayment(drawnBalance, loan.interest_rate, Math.max(term - i + 1, 1))
          : 0;
      const principal = isBalloon ? drawnBalance : Math.max(payment - interest, 0);
      rows.push({
        payment_number: i,
        date: payDate.toISOString().split('T')[0],
        payment: isBalloon ? drawnBalance + interest : payment,
        principal,
        interest,
        balance: drawnBalance,
        drawn_balance: drawnBalance,
        draw_events: drawEventLabels.length > 0 ? drawEventLabels : undefined,
        is_balloon: isBalloon,
      });
    }
  }

  return rows;
}

function fmtUSD(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

/** Build full amortization schedule */
export function buildAmortizationSchedule(loan: Loan): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const r = loan.interest_rate / 100 / 12;
  const amort = loan.amortization_period_months ?? loan.loan_term_months;
  const term = loan.loan_term_months;
  const monthly = loan.monthly_payment ?? calcMonthlyPayment(loan.original_amount, loan.interest_rate, term, amort, loan.payment_frequency);
  const start = new Date(loan.first_payment_date ?? loan.start_date);

  let balance = loan.original_amount;

  for (let i = 1; i <= term; i++) {
    const paymentDate = new Date(start);
    paymentDate.setMonth(start.getMonth() + i - 1);

    if (loan.payment_frequency === 'interest_only') {
      const interest = balance * r;
      const isBalloon = i === term;
      rows.push({
        payment_number: i,
        date: paymentDate.toISOString().split('T')[0],
        payment: isBalloon ? balance + interest : interest,
        principal: isBalloon ? balance : 0,
        interest,
        balance: isBalloon ? 0 : balance,
        is_balloon: isBalloon,
      });
      if (isBalloon) balance = 0;
    } else {
      const interest = balance * r;
      const principal = Math.min(monthly - interest, balance);
      balance = Math.max(balance - principal, 0);
      const isBalloon = i === term && balance > 0.01;
      const actualPayment = isBalloon ? monthly + balance : monthly;
      const actualPrincipal = isBalloon ? principal + balance : principal;
      rows.push({
        payment_number: i,
        date: paymentDate.toISOString().split('T')[0],
        payment: actualPayment,
        principal: actualPrincipal,
        interest,
        balance: isBalloon ? 0 : balance,
        is_balloon: isBalloon,
      });
      if (isBalloon) balance = 0;
    }
    if (balance <= 0.01) break;
  }
  return rows;
}
