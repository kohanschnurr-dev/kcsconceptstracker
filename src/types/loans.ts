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
  months_held: number | null;
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
  is_balloon?: boolean;
  accrued_interest?: number;
}

/* ── Draw-based interest accrual ─────────────────────────── */

export interface DrawInterestPeriod {
  label: string;
  startDate: string;
  endDate: string;
  days: number;
  balance: number;
  interest: number;
}

export interface DrawInterestResult {
  periods: DrawInterestPeriod[];
  totalInterest: number;
  weightedAvgBalance: number;
}

/**
 * Build a draw-based interest schedule.
 * Interest only accrues on the cumulative funded amount between draw dates.
 */
export function buildDrawInterestSchedule(
  loan: Pick<Loan, 'interest_rate' | 'interest_calc_method' | 'maturity_date' | 'start_date'>,
  draws: LoanDraw[],
): DrawInterestResult | null {
  const funded = draws
    .filter(d => d.status === 'funded' && d.date_funded)
    .sort((a, b) => a.date_funded!.localeCompare(b.date_funded!));

  if (funded.length === 0) return null;

  const dayBasis = loan.interest_calc_method === 'actual_365' ? 365 : 360;
  const dailyRate = (loan.interest_rate / 100) / dayBasis;
  const maturity = new Date(loan.maturity_date);

  const periods: DrawInterestPeriod[] = [];
  let runningBalance = 0;
  let totalDays = 0;
  let balanceDaysSum = 0;

  for (let i = 0; i < funded.length; i++) {
    const draw = funded[i];
    runningBalance += draw.draw_amount;

    const periodStart = new Date(draw.date_funded!);
    const periodEnd = i < funded.length - 1
      ? new Date(funded[i + 1].date_funded!)
      : maturity;

    const days = Math.max(
      Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    const interest = runningBalance * dailyRate * days;
    totalDays += days;
    balanceDaysSum += runningBalance * days;

    periods.push({
      label: i < funded.length - 1
        ? `Draw #${draw.draw_number} → Draw #${funded[i + 1].draw_number}`
        : `Draw #${draw.draw_number} → Maturity`,
      startDate: draw.date_funded!,
      endDate: periodEnd.toISOString().split('T')[0],
      days,
      balance: runningBalance,
      interest,
    });
  }

  return {
    periods,
    totalInterest: periods.reduce((s, p) => s + p.interest, 0),
    weightedAvgBalance: totalDays > 0 ? balanceDaysSum / totalDays : 0,
  };
}

/** Standard amortization payment: P * r(1+r)^n / ((1+r)^n - 1) */
export function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
  amortMonths?: number | null,
  paymentFreq?: string,
  interestCalcMethod?: string,
): number {
  if (paymentFreq === 'interest_only') return (principal * annualRate) / 100 / 12;
  if (paymentFreq === 'deferred') return 0;
  const amort = amortMonths ?? termMonths;
  if (amort === 0 || annualRate === 0) return principal / termMonths;

  // Simple interest for investor loans: interest-only with balloon at maturity
  if (interestCalcMethod === 'simple') {
    return (principal * annualRate / 100 / 12);
  }

  // Compute monthly rate based on calc method
  let r: number;
  if (interestCalcMethod === 'actual_360') {
    r = (annualRate / 100) * (30 / 360) ; // ~30 days per month / 360
  } else if (interestCalcMethod === 'actual_365') {
    r = (annualRate / 100) * (30.4167 / 365); // avg days per month / 365
  } else {
    r = annualRate / 100 / 12; // standard 30/360
  }

  const n = amort;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Return actual number of days in the month of the given date */
function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Compute period interest based on the interest calculation method */
function periodInterest(balance: number, annualRate: number, paymentDate: Date, method?: string): number {
  const rate = annualRate / 100;
  if (method === 'actual_360') {
    return balance * rate * daysInMonth(paymentDate) / 360;
  }
  if (method === 'actual_365') {
    return balance * rate * daysInMonth(paymentDate) / 365;
  }
  // Standard 30/360
  return balance * rate / 12;
}

/** Build full amortization schedule */
export function buildAmortizationSchedule(loan: Loan): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const amort = loan.amortization_period_months ?? loan.loan_term_months;
  const term = loan.loan_term_months;
  const monthly = loan.monthly_payment ?? calcMonthlyPayment(loan.original_amount, loan.interest_rate, term, amort, loan.payment_frequency, loan.interest_calc_method);
  const start = new Date(loan.first_payment_date ?? loan.start_date);
  const method = loan.interest_calc_method;

  let balance = loan.original_amount;

  for (let i = 1; i <= term; i++) {
    const paymentDate = new Date(start);
    paymentDate.setMonth(start.getMonth() + i - 1);

    const interest = periodInterest(balance, loan.interest_rate, paymentDate, method);

    if (loan.payment_frequency === 'interest_only' || method === 'simple') {
      // Interest-only: no principal until final balloon payment
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
