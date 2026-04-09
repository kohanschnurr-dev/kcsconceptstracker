import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit2, CheckCircle2, DollarSign, Percent,
  CreditCard, Calendar, TrendingDown, Landmark, Info,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LoanStatusBadge, LoanTypeBadge } from '@/components/loans/LoanStatusBadge';
import { DrawScheduleTracker } from '@/components/loans/DrawScheduleTracker';
import { LoanExtensions } from '@/components/loans/LoanExtensions';
import { AmortizationTable } from '@/components/loans/AmortizationTable';
import { PaymentHistoryTab } from '@/components/loans/PaymentHistoryTab';
import { AddLoanModal } from '@/components/loans/AddLoanModal';
import { useLoanDetail } from '@/hooks/useLoans';
import { LOAN_TYPE_LABELS, calcMonthlyPayment, buildDrawInterestSchedule, buildAmortizationSchedule, buildDrawAmortizationSchedule } from '@/types/loans';
import { Slider } from '@/components/ui/slider';
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
  const [earlyPayoffMonth, setEarlyPayoffMonth] = useState<number | null>(null);

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
  const totalInterestPaid = schedule
    .filter(row => row.date <= todayStr)
    .reduce((sum, row) => sum + row.interest, 0);
  const totalExtensionFees = extensions.reduce((s: number, e: any) => s + (e.extension_fee ?? 0), 0);
  const totalScheduleInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  // Draw-based interest for summary
  const drawInterest = loan.has_draws ? buildDrawInterestSchedule(loan, draws) : null;
  const totalDrawFees = drawInterest?.totalFees ?? 0;
  const effectiveInterest = drawInterest ? drawInterest.totalInterest : totalScheduleInterest;
  const totalCost = effectiveInterest + (loan.origination_fee_dollars ?? 0) + (loan.other_closing_costs ?? 0) + totalExtensionFees + totalDrawFees;

  const handleMarkPaidOff = () => {
    updateLoan.mutate({ id: loan.id, status: 'paid_off', outstanding_balance: 0 });
  };

  const handleEdit = async (
    payload: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'>,
  ) => {
    await updateLoan.mutateAsync({ id: loan.id, ...payload });
    setEditOpen(false);
  };

  const fundedDraws = draws.filter(d => d.status === 'funded');
  const drawnBalance = fundedDraws.reduce((s, d) => s + d.draw_amount, 0);
  const currentInterestPmt = drawnBalance * (loan.interest_rate / 100 / 12);

  const summaryStats = [
    { label: 'Original Amount', value: fmt(loan.original_amount), icon: DollarSign, color: 'text-primary bg-primary/10' },
    {
      label: drawInterest ? 'Drawn to Date' : 'Outstanding Balance',
      value: drawInterest ? fmt(drawnBalance) : fmt(loan.outstanding_balance),
      icon: TrendingDown,
      color: 'text-warning bg-warning/10',
      tooltip: drawInterest ? `${fundedDraws.length} funded draw${fundedDraws.length !== 1 ? 's' : ''}` : undefined,
    },
    { label: 'Interest Rate', value: `${loan.interest_rate.toFixed(2)}%`, icon: Percent, color: 'text-blue-400 bg-blue-500/10' },
    {
      label: drawInterest ? 'Current Interest Pmt' : 'Monthly Payment',
      value: drawInterest ? fmt(currentInterestPmt) : fmt(monthly),
      icon: CreditCard,
      color: 'text-success bg-success/10',
      tooltip: drawInterest ? 'Drawn balance × rate ÷ 12' : undefined,
    },
    { label: 'Remaining Term', value: remainingTermLabel, icon: Calendar, color: 'text-primary bg-primary/10' },
    {
      label: drawInterest ? 'Interest Accrued (Draws)' : 'Interest Accrued',
      value: drawInterest ? fmt(drawInterest.totalInterest) : fmt(totalInterestPaid),
      icon: TrendingDown,
      color: 'text-destructive bg-destructive/10',
      tooltip: drawInterest ? 'Interest accrued on funded draws only, at each draw\'s effective rate' : undefined,
    },
  ];

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
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4 mr-1.5" /> Edit
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {summaryStats.map(s => (
            <Card key={s.label} className="glass-card" title={s.tooltip}>
              <CardContent className="p-4 text-center">
                <div className={cn('rounded-lg p-2 w-fit mx-auto mb-2', s.color.split(' ')[1])}>
                  <s.icon className={cn('h-4 w-4', s.color.split(' ')[0])} />
                </div>
                <p className="text-lg font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                {s.tooltip && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-tight">{s.tooltip}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="overview" className="w-1/4">Overview</TabsTrigger>
            <TabsTrigger value="amortization" className="w-1/4">Amortization</TabsTrigger>
            {loan.has_draws && <TabsTrigger value="draws" className="w-1/4">Draw Schedule</TabsTrigger>}
            <TabsTrigger value="payments" className="w-1/4">Payments</TabsTrigger>
          </TabsList>

          {/* Early Payoff Simulator */}
          {loan.status === 'active' && loan.loan_term_months > 1 && (() => {
            const baseTerm = loan.loan_term_months;
            const extensionMonths = extensions.reduce((sum: number, ext: any) => {
              const from = new Date(ext.extended_from);
              const to = new Date(ext.extended_to);
              const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
              return sum + Math.max(months, 0);
            }, 0);
            const term = baseTerm + extensionMonths;
            const selectedMonth = earlyPayoffMonth ?? term;

            // Calculate interest at any given month
            const calcInterestAtMonth = (months: number): number => {
              if (loan.has_draws && drawInterest) {
                return drawInterest.totalInterest * (months / term);
              }
              if (loan.payment_frequency === 'interest_only' || loan.interest_calc_method === 'simple') {
                return loan.original_amount * (loan.interest_rate / 100) / 12 * months;
              }
              const schedule = buildAmortizationSchedule(loan);
              return schedule.slice(0, months).reduce((sum, row) => sum + row.interest, 0);
            };

            const interestAtSelected = calcInterestAtMonth(selectedMonth);
            const interestAtFull = calcInterestAtMonth(term);
            const savings = interestAtFull - interestAtSelected;

            return (
              <Card className="glass-card mt-4">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4" />
                      Early Payoff Simulator
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Month {selectedMonth} of {term}{extensionMonths > 0 ? ` (incl. ${extensionMonths} ext.)` : ''}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={term}
                    step={1}
                    value={[selectedMonth]}
                    onValueChange={([v]) => setEarlyPayoffMonth(v)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Interest Accrued</p>
                      <p className="text-sm font-semibold text-warning">{fmt(interestAtSelected)}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Savings vs Full Term</p>
                      <p className="text-sm font-semibold text-success">{fmt(savings)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

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
                  <InfoRow label="Interest Accrued" value={fmt(effectiveInterest)} />
                  <InfoRow label="Total Cost of Loan" value={<span className="font-semibold text-warning">{fmt(totalCost)}</span>} />
                  {loan.has_prepayment_penalty && (
                    <InfoRow label="Prepay Penalty" value={<Badge variant="outline" className="text-xs bg-warning/20 text-warning border-warning/30">Yes</Badge>} />
                  )}
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

          {/* Amortization */}
          <TabsContent value="amortization">
            <div className="mt-4">
              <AmortizationTable
                loan={loan}
                extensionMonths={extensionMonths}
                draws={draws}
                hasDraws={loan.has_draws}
              />
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
    </MainLayout>
  );
}
