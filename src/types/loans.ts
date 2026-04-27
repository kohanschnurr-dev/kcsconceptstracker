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

// Stable color per loan type — used in both the donut chart and the type badge
// so the column color matches the chart legend at a glance.
export const LOAN_TYPE_COLORS: Record<LoanType, { hsl: string; badge: string }> = {
  private_money:    { hsl: 'hsl(270, 60%, 55%)', badge: 'bg-[hsl(270,60%,55%)]/15 text-[hsl(270,60%,65%)] border-[hsl(270,60%,55%)]/40' },
  hard_money:       { hsl: 'hsl(142, 76%, 36%)', badge: 'bg-[hsl(142,76%,36%)]/15 text-[hsl(142,70%,45%)] border-[hsl(142,76%,36%)]/40' },
  dscr:             { hsl: 'hsl(200, 80%, 50%)', badge: 'bg-[hsl(200,80%,50%)]/15 text-[hsl(200,80%,60%)] border-[hsl(200,80%,50%)]/40' },
  construction:     { hsl: 'hsl(32, 95%, 55%)',  badge: 'bg-[hsl(32,95%,55%)]/15 text-[hsl(32,95%,60%)] border-[hsl(32,95%,55%)]/40' },
  conventional:     { hsl: 'hsl(0, 72%, 51%)',   badge: 'bg-[hsl(0,72%,51%)]/15 text-[hsl(0,72%,60%)] border-[hsl(0,72%,51%)]/40' },
  seller_financing: { hsl: 'hsl(45, 93%, 47%)',  badge: 'bg-[hsl(45,93%,47%)]/15 text-[hsl(45,93%,55%)] border-[hsl(45,93%,47%)]/40' },
  heloc:            { hsl: 'hsl(180, 70%, 45%)', badge: 'bg-[hsl(180,70%,45%)]/15 text-[hsl(180,70%,55%)] border-[hsl(180,70%,45%)]/40' },
  bridge:           { hsl: 'hsl(320, 70%, 50%)', badge: 'bg-[hsl(320,70%,50%)]/15 text-[hsl(320,70%,60%)] border-[hsl(320,70%,50%)]/40' },
  portfolio:        { hsl: 'hsl(220, 70%, 55%)', badge: 'bg-[hsl(220,70%,55%)]/15 text-[hsl(220,70%,65%)] border-[hsl(220,70%,55%)]/40' },
  other:            { hsl: 'hsl(240, 5%, 55%)',  badge: 'bg-muted text-muted-foreground border-border' },
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
  funded_draws_total?: number;
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
  fee_amount: number | null;
  fee_percentage: number | null;
  interest_rate_override: number | null;
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

/**
 * Loan types whose interest accrues against the outstanding balance until paid
 * (short-term / interest-only). Amortizing loans (DSCR, conventional, HELOC,
 * portfolio, seller financing) pay interest on a fixed monthly schedule, so
 * "unpaid accrued interest" doesn't apply the same way.
 */
export const ACCRUES_INTEREST_TYPES: LoanType[] = [
  'hard_money',
  'private_money',
  'bridge',
  'construction',
];

/**
 * Compute simple interest accrued from start_date through today, stepping the
 * balance down by each payment's principal_portion (or, when missing, by the
 * full payment amount minus late fees). Subtracts interest already paid so the
 * returned figure represents what's *owed* right now.
 *
 * Use for short-term/interest-only loans. For amortizing loans the caller can
 * still call this to get an "unpaid interest" value but it'll typically be ~0.
 */
export function accruedInterestThroughToday(
  loan: Pick<Loan, 'start_date' | 'interest_rate' | 'original_amount' | 'outstanding_balance'>,
  payments: Pick<LoanPayment, 'payment_date' | 'amount' | 'principal_portion' | 'interest_portion' | 'late_fee'>[],
  asOf: Date = new Date(),
): number {
  if (!loan.start_date) return 0;
  const rate = (loan.interest_rate ?? 0) / 100;
  if (rate <= 0) return 0;

  const startMs = new Date(loan.start_date + 'T00:00:00').getTime();
  const todayMs = new Date(asOf.toISOString().split('T')[0] + 'T00:00:00').getTime();
  if (todayMs <= startMs) return 0;

  // Sort payments chronologically; ignore any future-dated ones.
  const sorted = [...payments]
    .filter(p => p.payment_date && new Date(p.payment_date).getTime() <= todayMs)
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

  let balance = loan.original_amount ?? 0;
  let cursor = startMs;
  let interest = 0;
  let interestPaid = 0;

  const MS_DAY = 1000 * 60 * 60 * 24;

  for (const p of sorted) {
    const pMs = new Date(p.payment_date + 'T00:00:00').getTime();
    const days = Math.max(0, (pMs - cursor) / MS_DAY);
    interest += balance * rate * (days / 365);

    const lateFee = p.late_fee ?? 0;
    // Prefer the explicit principal split; otherwise treat the whole payment
    // (less late fees & explicit interest portion) as principal so balance
    // always moves.
    const principalPortion =
      p.principal_portion != null
        ? p.principal_portion
        : Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - lateFee);
    interestPaid += p.interest_portion ?? 0;
    balance = Math.max(0, balance - principalPortion);
    cursor = pMs;
  }

  // Tail segment: last payment (or start) → today
  const tailDays = Math.max(0, (todayMs - cursor) / MS_DAY);
  interest += balance * rate * (tailDays / 365);

  return Math.max(0, interest - interestPaid);
}

/**
 * Effective outstanding balance derived from payments. Falls back to the
 * stored outstanding_balance when no payments exist.
 */
export function effectiveOutstandingBalance(
  loan: Pick<Loan, 'original_amount' | 'outstanding_balance'>,
  payments: Pick<LoanPayment, 'amount' | 'principal_portion' | 'interest_portion' | 'late_fee'>[],
): number {
  if (!payments.length) return loan.outstanding_balance ?? loan.original_amount ?? 0;
  const principalPaid = payments.reduce((s, p) => {
    if (p.principal_portion != null) return s + p.principal_portion;
    return s + Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - (p.late_fee ?? 0));
  }, 0);
  return Math.max(0, (loan.original_amount ?? 0) - principalPaid);
}

/* ── Draw-based interest accrual ─────────────────────────── */

export interface DrawInterestPeriod {
  label: string;
  startDate: string;
  endDate: string;
  days: number;
  balance: number;
  interest: number;
  fees: number;
  effectiveRate: number;
}

export interface DrawInterestResult {
  periods: DrawInterestPeriod[];
  totalInterest: number;
  totalFees: number;
  weightedAvgBalance: number;
}

/**
 * Build a draw-based interest schedule.
 * Interest only accrues on the cumulative funded amount between draw dates.
 */
/** Calculate the effective fee for a draw */
export function calcDrawFee(draw: LoanDraw): number {
  const flat = draw.fee_amount ?? 0;
  const pct = draw.fee_percentage ? (draw.draw_amount * draw.fee_percentage / 100) : 0;
  // Use the larger of the two if both are set
  if (flat > 0 && pct > 0) return Math.max(flat, pct);
  return flat || pct;
}

export function buildDrawInterestSchedule(
  loan: Pick<Loan, 'interest_rate' | 'interest_calc_method' | 'maturity_date' | 'start_date'>,
  draws: LoanDraw[],
  extensionMonths: number = 0,
): DrawInterestResult | null {
  const funded = draws
    .filter(d => d.status === 'funded' && (d.date_funded || d.expected_date))
    .sort((a, b) => a.draw_number - b.draw_number);

  if (funded.length === 0) return null;

  const dayBasis = loan.interest_calc_method === 'actual_365' ? 365 : 360;
  const maturity = new Date(loan.maturity_date);
  if (extensionMonths > 0) {
    maturity.setMonth(maturity.getMonth() + extensionMonths);
  }

  const periods: DrawInterestPeriod[] = [];
  let maxDays = 0;
  let balanceDaysSum = 0;

  for (const draw of funded) {
    const effectiveRate = draw.interest_rate_override ?? loan.interest_rate;
    const dailyRate = (effectiveRate / 100) / dayBasis;

    const drawDate = draw.date_funded ?? draw.expected_date!;
    const periodStart = new Date(drawDate);

    const days = Math.max(
      Math.round((maturity.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    const interest = draw.draw_amount * dailyRate * days;
    const fees = calcDrawFee(draw);
    if (days > maxDays) maxDays = days;
    balanceDaysSum += draw.draw_amount * days;

    const nameSuffix = draw.milestone_name ? ` — ${draw.milestone_name}` : '';
    periods.push({
      label: `Draw #${draw.draw_number}${nameSuffix}`,
      startDate: drawDate,
      endDate: maturity.toISOString().split('T')[0],
      days,
      balance: draw.draw_amount,
      interest,
      fees,
      effectiveRate,
    });
  }

  return {
    periods,
    totalInterest: periods.reduce((s, p) => s + p.interest, 0),
    totalFees: periods.reduce((s, p) => s + p.fees, 0),
    weightedAvgBalance: maxDays > 0 ? balanceDaysSum / maxDays : 0,
  };
}

/** Compute the first payment date from start_date + one payment period */
export function calcFirstPaymentDate(startDate: string, frequency: string): string {
  const [y, m, d] = startDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  switch (frequency) {
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'bi_weekly':
      date.setDate(date.getDate() + 14);
      break;
    default: // monthly, interest_only, deferred, etc.
      date.setMonth(date.getMonth() + 1);
      break;
  }
  const fy = date.getFullYear();
  const fm = String(date.getMonth() + 1).padStart(2, '0');
  const fd = String(date.getDate()).padStart(2, '0');
  return `${fy}-${fm}-${fd}`;
}

/** Compute the next upcoming payment date from a first payment date + frequency */
export function calcNextPaymentDate(firstPayment: string, frequency: string): string {
  const [y, m, d] = firstPayment.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (date < today) {
    switch (frequency) {
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'annually':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'bi_weekly':
        date.setDate(date.getDate() + 14);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
        break;
    }
  }
  const fy = date.getFullYear();
  const fm = String(date.getMonth() + 1).padStart(2, '0');
  const fd = String(date.getDate()).padStart(2, '0');
  return `${fy}-${fm}-${fd}`;
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
export function buildAmortizationSchedule(
  loan: Loan,
  extensionMonths: number = 0,
  finalDateOverride?: string,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const amort = loan.amortization_period_months ?? loan.loan_term_months;
  const term = loan.loan_term_months + extensionMonths;
  const monthly = loan.monthly_payment ?? calcMonthlyPayment(loan.original_amount, loan.interest_rate, term, amort, loan.payment_frequency, loan.interest_calc_method);
  const startStr = loan.first_payment_date ?? loan.start_date;
  const start = new Date(startStr + 'T00:00:00');
  const method = loan.interest_calc_method;

  let balance = loan.original_amount;

  for (let i = 1; i <= term; i++) {
    let paymentDate = new Date(start);
    paymentDate.setMonth(start.getMonth() + i - 1);

    // Pin the final/balloon row to the explicit maturity date when provided,
    // so extensions to a non-month-boundary date (e.g. May 7) display correctly.
    const isFinal = i === term;
    if (isFinal && finalDateOverride) {
      paymentDate = new Date(finalDateOverride + 'T00:00:00');
    }

    const interest = periodInterest(balance, loan.interest_rate, paymentDate, method);

    if (loan.payment_frequency === 'interest_only' || method === 'simple') {
      const isBalloon = isFinal;
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
      const isBalloon = isFinal && balance > 0.01;
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

/* ── Event-based interest schedule ──────────────────────── */

export type InterestLedgerKind = 'start' | 'draw' | 'payment' | 'today' | 'pending_draw' | 'maturity';

export interface InterestLedgerRow {
  date: string;                 // YYYY-MM-DD
  kind: InterestLedgerKind;
  label: string;
  sublabel?: string;
  drawAmount?: number;          // funds added to principal
  principalPaid?: number;       // principal portion of payment
  interestPaid?: number;        // interest portion of payment
  lateFee?: number;
  daysSincePrior: number;
  interestAccrued: number;      // simple interest on prior balance for daysSincePrior
  balance: number;              // outstanding principal AFTER this event
  unpaidInterest: number;       // cumulative accrued − cumulative paid
  isFuture: boolean;
}

export interface InterestLedgerResult {
  rows: InterestLedgerRow[];
  totalDisbursed: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalInterestAccrued: number;
  currentBalance: number;       // principal as of today
  currentUnpaidInterest: number;
  projectedPayoff: number;      // balance + unpaid interest at maturity
}

interface BuildInterestScheduleArgs {
  loan: Pick<Loan, 'original_amount' | 'interest_rate' | 'interest_calc_method' | 'start_date' | 'maturity_date'>;
  draws: LoanDraw[];
  payments: LoanPayment[];
  extensions?: { extended_to: string }[];
  asOf?: Date;
}

export function buildInterestSchedule({
  loan,
  draws,
  payments,
  extensions = [],
  asOf = new Date(),
}: BuildInterestScheduleArgs): InterestLedgerResult {
  const dayBasis = loan.interest_calc_method === 'actual_365' ? 365 : 360;
  const dailyRate = (loan.interest_rate / 100) / dayBasis;
  const MS_DAY = 1000 * 60 * 60 * 24;

  const todayStr = (() => {
    const y = asOf.getFullYear();
    const m = String(asOf.getMonth() + 1).padStart(2, '0');
    const d = String(asOf.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const effectiveMaturity = extensions.length
    ? extensions.reduce((latest, e) => (e.extended_to > latest ? e.extended_to : latest), loan.maturity_date)
    : loan.maturity_date;

  type RawEvent = {
    date: string;
    kind: InterestLedgerKind;
    label: string;
    sublabel?: string;
    drawAmount?: number;
    principalPaid?: number;
    interestPaid?: number;
    lateFee?: number;
    sortKey: string;            // for stable ordering on same day
  };

  const events: RawEvent[] = [];

  // Loan start
  events.push({
    date: loan.start_date,
    kind: 'start',
    label: 'Loan Originated',
    sublabel: 'Initial disbursement',
    drawAmount: loan.original_amount,
    sortKey: '0',
  });

  // Funded draws (past) and pending draws (future)
  for (const d of draws) {
    const isFunded = d.status === 'funded' && !!d.date_funded;
    const date = isFunded ? d.date_funded! : d.expected_date;
    if (!date) continue;
    const milestone = d.milestone_name ? ` — ${d.milestone_name}` : '';
    events.push({
      date,
      kind: isFunded ? 'draw' : 'pending_draw',
      label: `Draw #${d.draw_number}${milestone}`,
      sublabel: isFunded ? 'Funded' : `${d.status.replace(/_/g, ' ')}`,
      drawAmount: d.draw_amount,
      sortKey: `1-${d.draw_number}`,
    });
  }

  // Payments
  const sortedPayments = [...payments].sort((a, b) => {
    if (a.payment_date !== b.payment_date) return a.payment_date.localeCompare(b.payment_date);
    return (a.created_at ?? '').localeCompare(b.created_at ?? '');
  });
  for (const p of sortedPayments) {
    const interest = p.interest_portion ?? 0;
    const lateFee = p.late_fee ?? 0;
    const principal = p.principal_portion != null
      ? p.principal_portion
      : Math.max(0, (p.amount ?? 0) - interest - lateFee);
    events.push({
      date: p.payment_date,
      kind: 'payment',
      label: 'Payment',
      sublabel: `Total ${formatUsd(p.amount ?? 0)}`,
      principalPaid: principal,
      interestPaid: interest,
      lateFee: lateFee || undefined,
      sortKey: `2-${p.created_at ?? ''}`,
    });
  }

  // Sort by date then sortKey
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.sortKey.localeCompare(b.sortKey);
  });

  // Inject "Today" before any future events
  const todayInjectIdx = events.findIndex(e => e.date > todayStr);
  const todayEvent: RawEvent = {
    date: todayStr,
    kind: 'today',
    label: 'Today',
    sublabel: 'Live position',
    sortKey: '9',
  };
  if (todayInjectIdx === -1) events.push(todayEvent);
  else events.splice(todayInjectIdx, 0, todayEvent);

  // Inject Maturity at the end (only if after today/last event)
  const lastDate = events[events.length - 1].date;
  if (effectiveMaturity > lastDate || effectiveMaturity > todayStr) {
    events.push({
      date: effectiveMaturity,
      kind: 'maturity',
      label: 'Maturity',
      sublabel: 'Balloon payoff',
      sortKey: 'z',
    });
  }

  // Walk and compute
  const rows: InterestLedgerRow[] = [];
  let balance = 0;
  let cumulativeInterestAccrued = 0;
  let cumulativeInterestPaid = 0;
  let totalDisbursed = 0;
  let totalPrincipalPaid = 0;
  let priorDate: string | null = null;

  for (const e of events) {
    const days = priorDate
      ? Math.max(0, Math.round((parseLocal(e.date).getTime() - parseLocal(priorDate).getTime()) / MS_DAY))
      : 0;
    const interestAccrued = balance * dailyRate * days;
    cumulativeInterestAccrued += interestAccrued;

    if (e.drawAmount && (e.kind === 'start' || e.kind === 'draw' || e.kind === 'pending_draw')) {
      balance += e.drawAmount;
      totalDisbursed += e.drawAmount;
    }
    if (e.kind === 'payment') {
      balance = Math.max(0, balance - (e.principalPaid ?? 0));
      cumulativeInterestPaid += e.interestPaid ?? 0;
      totalPrincipalPaid += e.principalPaid ?? 0;
    }

    rows.push({
      date: e.date,
      kind: e.kind,
      label: e.label,
      sublabel: e.sublabel,
      drawAmount: e.drawAmount,
      principalPaid: e.principalPaid,
      interestPaid: e.interestPaid,
      lateFee: e.lateFee,
      daysSincePrior: days,
      interestAccrued,
      balance,
      unpaidInterest: Math.max(0, cumulativeInterestAccrued - cumulativeInterestPaid),
      isFuture: e.date > todayStr,
    });
    priorDate = e.date;
  }

  const todayRow = rows.find(r => r.kind === 'today');
  const maturityRow = rows.find(r => r.kind === 'maturity');

  return {
    rows,
    totalDisbursed,
    totalPrincipalPaid,
    totalInterestPaid: cumulativeInterestPaid,
    totalInterestAccrued: cumulativeInterestAccrued,
    currentBalance: todayRow ? todayRow.balance : balance,
    currentUnpaidInterest: todayRow ? todayRow.unpaidInterest : 0,
    projectedPayoff: maturityRow ? maturityRow.balance + maturityRow.unpaidInterest : balance,
  };
}

function parseLocal(d: string): Date {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
}

function formatUsd(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}
