import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, CheckCircle2, DollarSign, Percent,
  CreditCard, Calendar, CalendarClock, TrendingDown, Landmark, Info, ChevronDown, Trash2,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LoanStatusBadge, LoanTypeBadge } from '@/components/loans/LoanStatusBadge';
import { DrawScheduleTracker } from '@/components/loans/DrawScheduleTracker';
import { LoanExtensions } from '@/components/loans/LoanExtensions';
import { AmortizationTable } from '@/components/loans/AmortizationTable';
import { InterestScheduleTable } from '@/components/loans/InterestScheduleTable';
import { PaymentHistoryTab } from '@/components/loans/PaymentHistoryTab';
import { AddLoanModal } from '@/components/loans/AddLoanModal';
import { useLoanDetail, useLoans } from '@/hooks/useLoans';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LOAN_TYPE_LABELS, calcMonthlyPayment, buildDrawInterestSchedule, buildAmortizationSchedule, calcDrawFee, ACCRUES_INTEREST_TYPES, currentAccruedInterest, buildInterestAttributionBreakdown } from '@/types/loans';
import { getEffectivePayments, isAutoPayment } from '@/lib/loanPayments';

import type { Loan, LoanDraw } from '@/types/loans';
import { formatDisplayDate } from '@/lib/dateUtils';

const fmt = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { deleteLoan } = useLoans();
  

  const { loan, draws, payments, extensions, isLoading, upsertDraw, deleteDraw, addPayment, deletePayment, addExtension, deleteExtension, updateLoan } = useLoanDetail(id!);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
      </MainLayout>
    );
  }

  if (!loan) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Loan not found.</p>
          <Button variant="outline" onClick={() => navigate('/loans')}>Back to Loans</Button>
        </div>
      </MainLayout>
    );
  }

  const monthly = loan.monthly_payment ?? calcMonthlyPayment(loan.original_amount, loan.interest_rate, loan.loan_term_months, loan.amortization_period_months, loan.payment_frequency);
  const effectiveMaturity = extensions.length > 0
    ? extensions.reduce((latest: string, e: any) => e.extended_to > latest ? e.extended_to : latest, loan.maturity_date)
    : loan.maturity_date;
  const matDate = new Date(effectiveMaturity + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diffMs = matDate.getTime() - today.getTime();
  const diffDays = Math.max(Math.ceil(diffMs / 86400000), 0);
  const diffMonths = Math.floor(diffDays / 30.44);
  const remainingTermLabel = diffMonths >= 1 ? `${diffMonths} mo` : `${diffDays} days`;
  // Calculate interest accrued through today from amortization schedule
  const extensionMonths = extensions.reduce((sum: number, ext: any) => {
    const from = new Date(ext.extended_from);
    const to = new Date(ext.extended_to);
    return sum + Math.max((to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 0);
  }, 0);
  const schedule = buildAmortizationSchedule(loan, extensionMonths);
  const todayStr = new Date().toISOString().split('T')[0];
  const totalExtensionFees = extensions.reduce((s: number, e: any) => s + (e.extension_fee ?? 0), 0);
  const totalScheduleInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  // Draw-based interest for summary
  const drawInterest = loan.has_draws ? buildDrawInterestSchedule(loan, draws, extensionMonths) : null;
  // Compute draw fees directly from all draws (not just funded ones in the interest schedule)
  const totalDrawFees = loan.has_draws
    ? draws.reduce((sum, d) => sum + calcDrawFee(d as any), 0)
    : 0;
  const effectiveInterest = drawInterest ? drawInterest.totalInterest : totalScheduleInterest;

  // Single source of truth — chronological ledger.
  const accruesUnpaidInterest = ACCRUES_INTEREST_TYPES.includes(loan.loan_type as any);
  const interestPaid = payments.reduce((s, p) => s + (p.interest_portion ?? 0), 0);
  const liveAccruedInterest = currentAccruedInterest(loan, payments, draws, extensions);

  const handleMarkPaidOff = () => {
    updateLoan.mutate({ id: loan.id, status: 'paid_off', outstanding_balance: 0 });
  };

  const handleEdit = async (
    payload: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'>,
  ) => {
    await updateLoan.mutateAsync({ id: loan.id, ...payload });
    setEditOpen(false);
  };

  const isTraditional = loan.loan_type === 'conventional' || loan.loan_type === 'dscr';
  // Only count draws that have actually been funded — not pending/planned ones.
  const fundedDrawSum = draws.filter(d => d.status === 'funded').reduce((s, d) => s + (d.draw_amount ?? 0), 0);
  const loanAmountValue = isTraditional || !loan.has_draws ? loan.original_amount : loan.original_amount + fundedDrawSum;
  const loanAmountLabel = isTraditional ? 'Original Amount' : 'Loan Amount';
  const hasLoanBreakdown = !isTraditional && loan.has_draws && draws.length > 0;

  // Effective payments: amortizing loans (DSCR/Conventional) auto-derive a
  // virtual payment row for every elapsed scheduled month. Manual entries
  // override the auto row for that month.
  const effectivePayments = getEffectivePayments(loan, payments, extensionMonths);

  // Remaining principal = total disbursed (original + funded draws) minus principal paid.
  const principalPaidForBalance = effectivePayments.reduce((s, p) => {
    if (p.principal_portion != null) return s + p.principal_portion;
    return s + Math.max(0, (p.amount ?? 0) - (p.interest_portion ?? 0) - (p.late_fee ?? 0));
  }, 0);
  const effectiveBalance = Math.max(0, (loanAmountValue ?? 0) - principalPaidForBalance);

  const interestAttribution = loan.has_draws
    ? buildInterestAttributionBreakdown(loan, payments, draws, extensions)
    : null;
  const hasInterestBreakdown = !!interestAttribution && interestAttribution.length > 1;
  const combinedInterest = liveAccruedInterest;
  const totalCost = combinedInterest + (loan.origination_fee_dollars ?? 0) + (loan.other_closing_costs ?? 0) + totalExtensionFees + totalDrawFees;

  const principalPaid = effectivePayments.reduce((s, p) => s + (p.principal_portion ?? 0), 0);
  const hasBalanceBreakdown = effectivePayments.length > 0;

  // Next Payment Due (amortizing loans): the first scheduled date strictly
  // after today. Because effectivePayments already includes every elapsed
  // month, this is just first_payment_date + effectivePayments.length months,
  // then advanced forward if it's still in the past.
  const computeNextPaymentDue = (): { date: Date; daysUntil: number } | null => {
    if (!isTraditional) return null;
    const baseStr = loan.first_payment_date ?? loan.start_date;
    if (!baseStr) return null;
    const base = new Date(baseStr + 'T00:00:00');
    if (isNaN(base.getTime())) return null;
    const next = new Date(base);
    if (!loan.first_payment_date) next.setMonth(next.getMonth() + 1);
    next.setMonth(next.getMonth() + effectivePayments.length);
    const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
    while (next.getTime() < todayMid.getTime()) {
      next.setMonth(next.getMonth() + 1);
    }
    const daysUntil = Math.ceil((next.getTime() - todayMid.getTime()) / 86400000);
    return { date: next, daysUntil };
  };
  const nextPaymentDue = computeNextPaymentDue();
  const nextPaymentLabel = nextPaymentDue
    ? nextPaymentDue.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const nextPaymentColor = nextPaymentDue && nextPaymentDue.daysUntil <= 7
    ? 'text-warning bg-warning/10'
    : 'text-primary bg-primary/10';

  const summaryStats = isTraditional
    ? [
        {
          label: loanAmountLabel,
          value: fmt(loanAmountValue),
          icon: DollarSign,
          color: 'text-primary bg-primary/10',
          hasBreakdown: hasLoanBreakdown,
        },
        { label: 'Next Payment Due', value: nextPaymentLabel, icon: CalendarClock, color: nextPaymentColor },
        {
          label: 'Outstanding Balance',
          value: fmt(effectiveBalance),
          icon: TrendingDown,
          color: 'text-warning bg-warning/10',
          hasBalanceBreakdown,
        },
        { label: 'Monthly Payment', value: fmt(monthly), icon: CreditCard, color: 'text-success bg-success/10' },
        { label: 'Remaining Term', value: remainingTermLabel, icon: Calendar, color: 'text-primary bg-primary/10' },
      ]
    : [
        {
          label: loanAmountLabel,
          value: fmt(loanAmountValue),
          icon: DollarSign,
          color: 'text-primary bg-primary/10',
          hasBreakdown: hasLoanBreakdown,
        },
        { label: 'Interest Accrued', value: fmt(combinedInterest), icon: TrendingDown, color: 'text-destructive bg-destructive/10', hasInterestBreakdown },
        { label: 'Balance', value: fmt(effectiveBalance + combinedInterest), icon: Landmark, color: 'text-blue-400 bg-blue-500/10', hasBalanceBreakdown },
        { label: 'Monthly Payment', value: fmt(monthly), icon: CreditCard, color: 'text-success bg-success/10' },
        { label: 'Remaining Term', value: remainingTermLabel, icon: Calendar, color: 'text-primary bg-primary/10' },
      ];

  const gridCols = summaryStats.length;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Back + header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/loans')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">
                  {loan.nickname ?? `${loan.lender_name} — ${loan.project_name ?? 'No Project'}`}
                </h1>
                <LoanStatusBadge status={loan.status} />
                <LoanTypeBadge type={loan.loan_type} />
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Landmark className="h-3.5 w-3.5" />
                <span>{loan.lender_name}</span>
                {loan.project_name && (
                  <>
                    <span>·</span>
                    <Link to={`/projects/${loan.project_id}`} className="hover:text-primary transition-colors">
                      {loan.project_name}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loan.status === 'active' && (
              <Button variant="outline" size="sm" onClick={handleMarkPaidOff}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Paid Off
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${gridCols} gap-3`}>
          {summaryStats.map(s => {
            const cardContent = (
              <CardContent className="p-4 text-center">
                <div className={cn('rounded-lg p-2 w-fit mx-auto mb-2', s.color.split(' ')[1])}>
                  <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
                </div>
                <p className="text-lg font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  {s.label}
                  {((s as any).hasBreakdown || (s as any).hasInterestBreakdown || (s as any).hasBalanceBreakdown) && <ChevronDown className="h-3 w-3" />}
                </p>
                {(s as any).emptyHint && (
                  <p className="text-[10px] text-muted-foreground/70 italic mt-1">{(s as any).emptyHint}</p>
                )}
              </CardContent>
            );

            if ((s as any).hasBreakdown) {
              return (
                <Popover key={s.label}>
                  <PopoverTrigger asChild>
                    <Card className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                      {cardContent}
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Loan</span>
                        <span className="font-medium">{fmt(loan.original_amount)}</span>
                      </div>
                      {draws.map(d => (
                        <div key={d.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Draw #{d.draw_number}{d.milestone_name ? ` — ${d.milestone_name}` : ''}
                          </span>
                          <span className="font-medium">{fmt(d.draw_amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span>{fmt(loanAmountValue)}</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            if ((s as any).hasInterestBreakdown && interestAttribution) {
              return (
                <Popover key={s.label}>
                  <PopoverTrigger asChild>
                    <Card className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                      {cardContent}
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <div className="space-y-2">
                      {interestAttribution.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{item.label}</span>
                          <span className="font-medium whitespace-nowrap">{fmt(item.interest)}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                        <span>Total</span>
                        <span>{fmt(combinedInterest)}</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            if ((s as any).hasBalanceBreakdown) {
              const sortedPmts = [...effectivePayments].sort((a, b) => a.payment_date.localeCompare(b.payment_date));
              let runningPrincipal = loanAmountValue ?? 0;
              return (
                <Popover key={s.label}>
                  <PopoverTrigger asChild>
                    <Card className="glass-card cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                      {cardContent}
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{loanAmountLabel}</span>
                        <span className="font-medium">{fmt(loanAmountValue ?? 0)}</span>
                      </div>

                      {sortedPmts.length > 0 && (
                        <div className="border-t border-border pt-2 space-y-2 max-h-48 overflow-y-auto">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Payments Applied</div>
                          {sortedPmts.map((p) => {
                            const interest = p.interest_portion ?? 0;
                            const lateFee = p.late_fee ?? 0;
                            const principal = p.principal_portion != null
                              ? p.principal_portion
                              : Math.max(0, (p.amount ?? 0) - interest - lateFee);
                            runningPrincipal = Math.max(0, runningPrincipal - principal);
                            return (
                              <div key={p.id} className="text-xs space-y-0.5">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>{formatDisplayDate(p.payment_date)}</span>
                                  <span>{fmt(p.amount ?? 0)}</span>
                                </div>
                                <div className="flex justify-between pl-2 text-[11px]">
                                  <span className="text-muted-foreground">- Principal</span>
                                  <span className="text-success">-{fmt(principal).replace('-', '')}</span>
                                </div>
                                {interest > 0 && (
                                  <div className="flex justify-between pl-2 text-[11px]">
                                    <span className="text-muted-foreground">- Interest</span>
                                    <span className="text-success">-{fmt(interest).replace('-', '')}</span>
                                  </div>
                                )}
                                {lateFee > 0 && (
                                  <div className="flex justify-between pl-2 text-[11px]">
                                    <span className="text-muted-foreground">- Late fee</span>
                                    <span className="text-warning">-{fmt(lateFee).replace('-', '')}</span>
                                  </div>
                                )}
                                <div className="flex justify-between pl-2 text-[11px] italic">
                                  <span className="text-muted-foreground">Principal after</span>
                                  <span>{fmt(runningPrincipal)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                        <span>{isTraditional ? 'Outstanding Balance' : 'Remaining Principal'}</span>
                        <span>{fmt(effectiveBalance)}</span>
                      </div>
                      {!isTraditional && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">+ Interest Accrued</span>
                            <span className="font-medium">{fmt(combinedInterest)}</span>
                          </div>
                          <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                            <span>Balance</span>
                            <span>{fmt(effectiveBalance + combinedInterest)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            return (
              <Card key={s.label} className="glass-card">
                {cardContent}
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="overview" className="w-1/4">Overview</TabsTrigger>
            <TabsTrigger value="amortization" className="w-1/4">{isTraditional ? 'Amortization' : 'Interest Schedule'}</TabsTrigger>
            {loan.has_draws && <TabsTrigger value="draws" className="w-1/4">Draw Schedule</TabsTrigger>}
            <TabsTrigger value="payments" className="w-1/4">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Loan Details</CardTitle></CardHeader>
                <CardContent>
                  <InfoRow label="Lender" value={loan.lender_name} />
                  {loan.lender_contact && <InfoRow label="Contact" value={loan.lender_contact} />}
                  <InfoRow label="Type" value={<LoanTypeBadge type={loan.loan_type} />} />
                  <InfoRow label="Status" value={<LoanStatusBadge status={loan.status} />} />
                  {loan.project_name && <InfoRow label="Project" value={loan.project_name} />}
                  <InfoRow label="Payment Freq." value={loan.payment_frequency.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                  {loan.ltv_at_origination && <InfoRow label="LTV at Origination" value={`${loan.ltv_at_origination}%`} />}
                  
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Loan Terms</CardTitle></CardHeader>
                <CardContent>
                  <InfoRow label="Original Amount" value={fmt(loan.original_amount)} />
                  <InfoRow label="Interest Rate" value={`${loan.interest_rate.toFixed(2)}% ${loan.rate_type}`} />
                  <InfoRow label="Loan Term" value={`${loan.loan_term_months} months`} />
                  {loan.amortization_period_months && <InfoRow label="Amort. Period" value={`${loan.amortization_period_months} months`} />}
                  
                  <InfoRow label="Start Date" value={formatDisplayDate(loan.start_date)} />
                  <InfoRow label="Maturity Date" value={(() => {
                    const effectiveMaturity = extensions.length > 0
                      ? extensions.reduce((latest: string, e: any) => e.extended_to > latest ? e.extended_to : latest, loan.maturity_date)
                      : loan.maturity_date;
                    return (
                      <span className="flex items-center gap-1">
                        {formatDisplayDate(effectiveMaturity)}
                        {extensions.length > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Original: {formatDisplayDate(loan.maturity_date)}</p>
                              <p className="text-xs">{extensions.length} extension{extensions.length > 1 ? 's' : ''} applied</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </span>
                    );
                  })()} />
                  {loan.has_prepayment_penalty && (
                    <InfoRow label="Prepay Penalty" value={<Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">Yes</Badge>} />
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Fees & Costs</CardTitle></CardHeader>
                <CardContent>
                  <InfoRow label="Origination Fee" value={loan.origination_fee_points ? `${loan.origination_fee_points} pts (${fmt(loan.origination_fee_dollars)})` : fmt(loan.origination_fee_dollars)} />
                  <InfoRow label="Other Closing Costs" value={fmt(loan.other_closing_costs)} />
                  {totalExtensionFees > 0 && (
                    <InfoRow label="Extension Fees" value={fmt(totalExtensionFees)} />
                  )}
                  {totalDrawFees > 0 && (
                    <InfoRow label="Draw Fees" value={fmt(totalDrawFees)} />
                  )}
                  <InfoRow label="Interest Accrued" value={fmt(combinedInterest)} />
                  <InfoRow label="Total Cost of Loan" value={<span className="font-semibold text-warning">{fmt(totalCost)}</span>} />
                </CardContent>
              </Card>

              <LoanExtensions
                extensions={extensions}
                loanId={loan.id}
                maturityDate={loan.maturity_date}
                onAdd={(ext) => addExtension.mutate(ext)}
                onDelete={(id) => deleteExtension.mutate(id)}
              />

              {loan.notes && (
                <Card className="glass-card md:col-span-2">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{loan.notes}</p>
                  </CardContent>
                </Card>
              )}

            </div>
          </TabsContent>

          {/* Amortization / Interest Schedule */}
          <TabsContent value="amortization">
            <div className="mt-4">
              {isTraditional ? (
                <AmortizationTable
                  loan={loan}
                  finalDate={effectiveMaturity}
                  extensionMonths={extensions.reduce((sum: number, ext: any) => {
                    const from = new Date(ext.extended_from);
                    const to = new Date(ext.extended_to);
                    return sum + Math.max((to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()), 0);
                  }, 0)}
                />
              ) : (
                <InterestScheduleTable
                  loan={loan}
                  draws={draws}
                  payments={payments}
                  extensions={extensions}
                />
              )}
            </div>
          </TabsContent>

          {/* Draw Schedule */}
          {loan.has_draws && (
            <TabsContent value="draws">
              <div className="mt-4">
                <DrawScheduleTracker
                  draws={draws}
                  totalDrawAmount={loan.total_draw_amount}
                  loanId={loan.id}
                  loan={loan}
                  extensionMonths={extensionMonths}
                  onUpsert={(draw, loanId) => upsertDraw.mutate({ ...draw, loan_id: loanId } as any)}
                  onDelete={id => deleteDraw.mutate(id)}
                />
              </div>
            </TabsContent>
          )}

          {/* Payments */}
          <TabsContent value="payments">
            <div className="mt-4">
              <PaymentHistoryTab
                payments={payments}
                loanId={loan.id}
                loan={loan}
                draws={draws}
                extensions={extensions}
                onAdd={p => addPayment.mutate(p)}
                onDelete={id => deletePayment.mutate(id)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit modal */}
      <AddLoanModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={loan}
        onSubmit={async (payload) => {
          await handleEdit(payload);
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the loan and its draws, payments, and extensions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoan.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteLoan.isPending}
              onClick={async (e) => {
                e.preventDefault();
                await deleteLoan.mutateAsync(loan.id);
                setDeleteOpen(false);
                navigate('/loans');
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoan.isPending ? 'Deleting…' : 'Delete loan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
