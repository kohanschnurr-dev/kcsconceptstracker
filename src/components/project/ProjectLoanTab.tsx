import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, Percent, CreditCard, Calendar, TrendingDown,
  Landmark, ExternalLink, Unlink, LinkIcon, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LoanStatusBadge, LoanTypeBadge } from '@/components/loans/LoanStatusBadge';
import { DrawScheduleTracker } from '@/components/loans/DrawScheduleTracker';
import { AmortizationTable } from '@/components/loans/AmortizationTable';
import { PaymentHistoryTab } from '@/components/loans/PaymentHistoryTab';
import { AddLoanModal } from '@/components/loans/AddLoanModal';
import { HardMoneyLoanCalculator } from '@/components/project/HardMoneyLoanCalculator';
import { useLoans, useLoanDetail } from '@/hooks/useLoans';
import { LOAN_TYPE_LABELS, calcMonthlyPayment } from '@/types/loans';
import type { Loan, LoanDraw } from '@/types/loans';
import { formatDisplayDate } from '@/lib/dateUtils';

const fmt = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

interface ProjectLoanTabProps {
  projectId: string;
  purchasePrice?: number;
  totalBudget?: number;
  arv?: number;
  projectStartDate?: string;
  project?: any;
  onSaved?: () => void;
}

function LinkedLoanCard({ loanId, onUnlink }: { loanId: string; onUnlink: () => void }) {
  const {
    loan, draws, payments, isLoading,
    upsertDraw, deleteDraw, addPayment, deletePayment, updateLoan,
  } = useLoanDetail(loanId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center text-muted-foreground">Loading loan details…</CardContent>
      </Card>
    );
  }

  if (!loan) return null;

  const monthly = loan.monthly_payment ?? calcMonthlyPayment(
    loan.original_amount, loan.interest_rate, loan.loan_term_months,
    loan.amortization_period_months, loan.payment_frequency,
  );
  const remainingTerm = Math.max(loan.loan_term_months - payments.length, 0);
  const totalInterestPaid = payments.reduce((s, p) => s + (p.interest_portion ?? 0), 0);

  const originationFee = loan.origination_fee_dollars ?? 0;
  const otherClosingCosts = loan.other_closing_costs ?? 0;
  const totalLoanCost = loan.original_amount + totalInterestPaid + originationFee + otherClosingCosts;

  const summaryStats = [
    { label: 'Original Amount', value: fmt(loan.original_amount), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Balance', value: fmt(loan.outstanding_balance), icon: TrendingDown, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Rate', value: `${loan.interest_rate.toFixed(2)}%`, icon: Percent, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Monthly Payment', value: fmt(monthly), icon: CreditCard, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Remaining', value: `${remainingTerm} mo`, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Interest Paid', value: fmt(totalInterestPaid), icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Origination Fee', value: fmt(originationFee), icon: Landmark, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    ...(otherClosingCosts > 0 ? [{ label: 'Other Closing Costs', value: fmt(otherClosingCosts), icon: DollarSign, color: 'text-muted-foreground', bg: 'bg-muted/30' }] : []),
    { label: 'Total Loan Cost', value: fmt(totalLoanCost), icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
  ];

  const handleEdit = async (payload: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'>) => {
    await updateLoan.mutateAsync({ id: loan.id, ...payload });
    setEditOpen(false);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Landmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold truncate">
              {loan.nickname ?? loan.lender_name}
            </h3>
            <LoanStatusBadge status={loan.status} />
            <LoanTypeBadge type={loan.loan_type} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onUnlink}>
              <Unlink className="h-3.5 w-3.5 mr-1" /> Unlink
            </Button>
            <Link to={`/loans/${loan.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Full Details
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {summaryStats.map(s => (
            <div key={s.label} className="text-center p-3 rounded-lg border border-border bg-card/50">
              <div className={cn('rounded-lg p-1.5 w-fit mx-auto mb-1.5', s.bg)}>
                <s.icon className={cn('h-3.5 w-3.5', s.color)} />
              </div>
              <p className="text-sm font-semibold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sub-tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="amortization">Amortization</TabsTrigger>
            {loan.has_draws && <TabsTrigger value="draws">Draws</TabsTrigger>}
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="space-y-2">
                <InfoRow label="Lender" value={loan.lender_name} />
                {loan.lender_contact && <InfoRow label="Contact" value={loan.lender_contact} />}
                <InfoRow label="Type" value={LOAN_TYPE_LABELS[loan.loan_type as keyof typeof LOAN_TYPE_LABELS] ?? loan.loan_type} />
                <InfoRow label="Start Date" value={formatDisplayDate(loan.start_date)} />
                <InfoRow label="Maturity Date" value={formatDisplayDate(loan.maturity_date)} />
              </div>
              <div className="space-y-2">
                <InfoRow label="Original Amount" value={fmt(loan.original_amount)} />
                <InfoRow label="Interest Rate" value={`${loan.interest_rate.toFixed(2)}% ${loan.rate_type}`} />
                <InfoRow label="Term" value={`${loan.loan_term_months} months`} />
                <InfoRow label="Payment Freq." value={loan.payment_frequency.replace('_', ' ')} />
                {loan.origination_fee_dollars && <InfoRow label="Origination Fee" value={fmt(loan.origination_fee_dollars)} />}
                {loan.other_closing_costs && <InfoRow label="Other Closing Costs" value={fmt(loan.other_closing_costs)} />}
              </div>
            </div>
            {loan.notes && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">{loan.notes}</div>
            )}
          </TabsContent>

          <TabsContent value="amortization">
            <div className="mt-3">
              <AmortizationTable loan={loan} />
            </div>
          </TabsContent>

          {loan.has_draws && (
            <TabsContent value="draws">
              <div className="mt-3">
                <DrawScheduleTracker
                  draws={draws}
                  totalDrawAmount={loan.total_draw_amount}
                  loanId={loan.id}
                  onUpsert={(draw) => upsertDraw.mutate({ ...draw, loan_id: loan.id } as any)}
                  onDelete={(id) => deleteDraw.mutate(id)}
                />
              </div>
            </TabsContent>
          )}

          <TabsContent value="payments">
            <div className="mt-3">
              <PaymentHistoryTab
                payments={payments}
                loanId={loan.id}
                onAdd={(p) => addPayment.mutate(p)}
                onDelete={(id) => deletePayment.mutate(id)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <AddLoanModal
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={loan}
        onSubmit={async (payload) => { await handleEdit(payload); }}
      />
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

export function ProjectLoanTab({
  projectId, purchasePrice = 0, totalBudget = 0, arv = 0,
  projectStartDate, project, onSaved,
}: ProjectLoanTabProps) {
  const { loans, isLoading, updateLoan } = useLoans();
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');

  const linkedLoans = loans.filter(l => l.project_id === projectId);
  const unlinkedLoans = loans.filter(l => !l.project_id);

  const handleLink = () => {
    if (!selectedLoanId) return;
    updateLoan.mutate({ id: selectedLoanId, project_id: projectId } as any);
    setSelectedLoanId('');
  };

  const handleUnlink = (loanId: string) => {
    updateLoan.mutate({ id: loanId, project_id: null } as any);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading loans…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Link a loan selector */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">Link a Loan</span>
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedLoanId} onValueChange={setSelectedLoanId}>
                <SelectTrigger>
                  <SelectValue placeholder={unlinkedLoans.length ? 'Select an existing loan…' : 'No unlinked loans available'} />
                </SelectTrigger>
                <SelectContent>
                  {unlinkedLoans.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nickname ?? l.lender_name} — {fmt(l.original_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" disabled={!selectedLoanId} onClick={handleLink}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Link
            </Button>
            <Link to="/loans">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Go to Loans →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Linked loans */}
      {linkedLoans.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No loans linked to this project yet. Select one above or{' '}
          <Link to="/loans" className="text-primary hover:underline">create a new loan</Link>.
        </div>
      )}

      {linkedLoans.map(l => (
        <LinkedLoanCard key={l.id} loanId={l.id} onUnlink={() => handleUnlink(l.id)} />
      ))}

      {/* Collapsed quick estimate calculator */}
      <Accordion type="single" collapsible>
        <AccordionItem value="calc" className="border rounded-lg">
          <AccordionTrigger className="px-5 py-3 text-sm font-medium hover:no-underline">
            Quick Estimate Calculator
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <HardMoneyLoanCalculator
              projectId={projectId}
              purchasePrice={purchasePrice}
              totalBudget={totalBudget}
              arv={arv}
              projectStartDate={projectStartDate}
              initialLoanAmount={project?.hm_loan_amount}
              initialInterestRate={project?.hm_interest_rate ?? 12}
              initialLoanTermMonths={project?.hm_loan_term_months ?? 6}
              initialPoints={project?.hm_points ?? 3}
              initialClosingCosts={project?.hm_closing_costs ?? 0}
              initialInterestOnly={project?.hm_interest_only ?? true}
              initialUseToDate={project?.hm_use_to_date ?? false}
              initialLoanStartDate={project?.hm_loan_start_date}
              onSaved={onSaved}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
