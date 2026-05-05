import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { calcMonthlyPayment, calcFirstPaymentDate, LOAN_TYPE_LABELS, LOAN_PURPOSE_OPTIONS } from '@/types/loans';
import type { Loan, LoanDraw, DrawStructure } from '@/types/loans';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, addMonths } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (loan: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'>, draws: Omit<LoanDraw, 'id' | 'created_at' | 'loan_id'>[]) => Promise<void>;
  initialData?: Partial<Loan>;
}

const STEPS = ['Loan Details', 'Terms', 'Fees', 'Draw Schedule', 'Collateral & Notes'];

const empty = (): Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'project_name'> => ({
  user_id: '',
  project_id: null,
  nickname: '',
  lender_name: '',
  lender_contact: '',
  loan_type: 'hard_money',
  loan_type_other: null,
  original_amount: 0,
  outstanding_balance: 0,
  interest_rate: 0,
  rate_type: 'fixed',
  variable_index: null,
  variable_margin: null,
  variable_rate_cap: null,
  variable_rate_floor: null,
  variable_adjustment_frequency: null,
  loan_term_months: 12,
  amortization_period_months: 360,
  payment_frequency: 'monthly',
  payment_frequency_custom: null,
  interest_calc_method: 'simple',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  maturity_date: format(addMonths(new Date(), 12), 'yyyy-MM-dd'),
  first_payment_date: null,
  origination_fee_points: null,
  origination_fee_dollars: null,
  other_closing_costs: null,
  has_prepayment_penalty: false,
  prepayment_penalty_terms: null,
  extension_fee: null,
  extension_terms: null,
  has_draws: false,
  total_draw_amount: null,
  draw_structure: null,
  custom_draw_terms: null,
  collateral_type: null,
  collateral_description: null,
  ltv_at_origination: null,
  has_personal_guarantee: false,
  notes: null,
  status: 'active',
  monthly_payment: null,
});

const emptyDraw = (n: number): Omit<LoanDraw, 'id' | 'created_at' | 'loan_id'> => ({
  draw_number: n,
  milestone_name: '',
  draw_percentage: null,
  draw_amount: 0,
  expected_date: null,
  status: 'pending',
  date_funded: null,
  notes: '',
  fee_amount: null,
  fee_percentage: null,
  interest_rate_override: null,
});

export function AddLoanModal({ open, onOpenChange, onSubmit, initialData }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [draws, setDraws] = useState<Omit<LoanDraw, 'id' | 'created_at' | 'loan_id'>[]>([emptyDraw(1)]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  // "Loan Purpose" picker: either one of LOAN_PURPOSE_OPTIONS or "__other__" with custom text in nickname.
  const [purposeMode, setPurposeMode] = useState<string>(() => {
    const initial = (initialData?.nickname ?? '').trim();
    if (!initial) return '';
    return (LOAN_PURPOSE_OPTIONS as readonly string[]).includes(initial) ? initial : '__other__';
  });

  const prevOpen = useRef(false);
  const initialStartRef = useRef<string | null>(null);
  const initialFreqRef = useRef<string | null>(null);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setStep(0);
      if (initialData) {
        setForm(f => ({ ...f, ...initialData, user_id: user?.id ?? '' }));
        initialStartRef.current = (initialData as any).start_date ?? null;
        initialFreqRef.current = (initialData as any).payment_frequency ?? null;
      } else {
        setForm({ ...empty(), user_id: user?.id ?? '' });
        setDraws([emptyDraw(1)]);
        initialStartRef.current = null;
        initialFreqRef.current = null;
      }
    }
    prevOpen.current = open;
  }, [open, user, initialData]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setProjects(data ?? []));
  }, [user]);

  // Auto-calculate maturity date when start + term change
  useEffect(() => {
    if (!form.start_date || !form.loan_term_months) return;
    const start = new Date(form.start_date + 'T12:00:00');
    const maturity = addMonths(start, form.loan_term_months);
    setForm(f => ({ ...f, maturity_date: format(maturity, 'yyyy-MM-dd') }));
  }, [form.start_date, form.loan_term_months]);

  // Auto-calculate origination fee $ from points
  useEffect(() => {
    if (form.origination_fee_points != null && form.original_amount > 0) {
      setForm(f => ({
        ...f,
        origination_fee_dollars: (f.origination_fee_points! / 100) * f.original_amount,
      }));
    }
  }, [form.origination_fee_points, form.original_amount]);

  // Auto-calculate monthly payment live
  const liveMonthlyPayment = useMemo(() => {
    if (form.original_amount <= 0 || form.interest_rate <= 0) return null;
    return calcMonthlyPayment(
      form.original_amount,
      form.interest_rate,
      form.loan_term_months,
      form.amortization_period_months,
      form.payment_frequency,
      form.interest_calc_method,
    );
  }, [form.original_amount, form.interest_rate, form.loan_term_months, form.amortization_period_months, form.payment_frequency, form.interest_calc_method]);

  const set = (field: keyof typeof form, val: any) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const startChanged = initialStartRef.current !== null && initialStartRef.current !== form.start_date;
      const freqChanged = initialFreqRef.current !== null && initialFreqRef.current !== form.payment_frequency;
      const shouldRecompute = startChanged || freqChanged || !form.first_payment_date;
      const computedFirstPayment = shouldRecompute
        ? calcFirstPaymentDate(form.start_date, form.payment_frequency)
        : form.first_payment_date;
      const payload = {
        ...form,
        outstanding_balance: form.outstanding_balance > 0 ? form.outstanding_balance : form.original_amount,
        monthly_payment: liveMonthlyPayment,
        first_payment_date: computedFirstPayment,
      };
      await onSubmit(payload, form.has_draws ? draws : []);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const updateDraw = (i: number, field: string, val: any) =>
    setDraws(d => d.map((dr, idx) => idx === i ? { ...dr, [field]: val } : dr));

  const addDraw = () => setDraws(d => [...d, emptyDraw(d.length + 1)]);
  const removeDraw = (i: number) =>
    setDraws(d => d.filter((_, idx) => idx !== i).map((dr, idx) => ({ ...dr, draw_number: idx + 1 })));

  // Update draw amounts when using percentage mode
  const updateDrawPct = (i: number, pct: number) => {
    const amt = form.total_draw_amount ? (pct / 100) * form.total_draw_amount : 0;
    setDraws(d => d.map((dr, idx) => idx === i ? { ...dr, draw_percentage: pct, draw_amount: amt } : dr));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
        </DialogHeader>

        {/* Step progress */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => (initialData?.id || i <= step) && setStep(i)}
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors',
                  i < step ? 'bg-success text-success-foreground cursor-pointer hover:opacity-80' :
                  i === step ? 'bg-primary text-primary-foreground' :
                  initialData?.id ? 'bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80' :
                  'bg-muted text-muted-foreground',
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 rounded', i < step ? 'bg-success' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm font-medium mb-4">{STEPS[step]}</p>

        {/* ── Step 0: Loan Details ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Project</Label>
                <Select value={form.project_id ?? '__none__'} onValueChange={v => set('project_id', v === '__none__' ? null : v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Project</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loan Purpose <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Select
                  value={purposeMode || '__none__'}
                  onValueChange={v => {
                    if (v === '__none__') { setPurposeMode(''); set('nickname', ''); }
                    else if (v === '__other__') { setPurposeMode('__other__'); set('nickname', ''); }
                    else { setPurposeMode(v); set('nickname', v); }
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select purpose" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {LOAN_PURPOSE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    <SelectItem value="__other__">Other…</SelectItem>
                  </SelectContent>
                </Select>
                {purposeMode === '__other__' && (
                  <Input
                    className="mt-2"
                    placeholder="Describe purpose (e.g. Treehouse/Wales)"
                    value={form.nickname ?? ''}
                    onChange={e => set('nickname', e.target.value)}
                  />
                )}
              </div>
              <div>
                <Label>Lender Name <span className="text-destructive">*</span></Label>
                <Input className="mt-1" placeholder="Lender name" value={form.lender_name} onChange={e => set('lender_name', e.target.value)} />
              </div>
              <div>
                <Label>Lender Contact <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="mt-1" placeholder="Phone / email" value={form.lender_contact ?? ''} onChange={e => set('lender_contact', e.target.value)} />
              </div>
              <div>
                <Label>Loan Type <span className="text-destructive">*</span></Label>
                <Select value={form.loan_type} onValueChange={v => { set('loan_type', v); set('interest_calc_method', (v === 'conventional' || v === 'dscr') ? 'standard' : 'simple'); }}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOAN_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.loan_type === 'other' && (
                <div className="col-span-2">
                  <Label>Describe Loan Type</Label>
                  <Input className="mt-1" value={form.loan_type_other ?? ''} onChange={e => set('loan_type_other', e.target.value)} />
                </div>
              )}
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid_off">Paid Off</SelectItem>
                    <SelectItem value="default">Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Terms ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Original Loan Amount <span className="text-destructive">*</span></Label>
                <Input className="mt-1" type="number" placeholder="250000" value={form.original_amount || ''} onChange={e => set('original_amount', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Outstanding Balance</Label>
                <Input className="mt-1" type="number" placeholder="Same as original if new" value={form.outstanding_balance || ''} onChange={e => set('outstanding_balance', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Interest Rate (%) <span className="text-destructive">*</span></Label>
                <Input className="mt-1" type="number" step="0.01" placeholder="10.00" value={form.interest_rate || ''} onChange={e => set('interest_rate', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Rate Type</Label>
                <Select value={form.rate_type} onValueChange={v => set('rate_type', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.rate_type === 'variable' && (
                <>
                  <div>
                    <Label>Index</Label>
                    <Select value={form.variable_index ?? ''} onValueChange={v => set('variable_index', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select index" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prime">Prime</SelectItem>
                        <SelectItem value="sofr">SOFR</SelectItem>
                        <SelectItem value="libor">LIBOR</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Margin (%)</Label>
                    <Input className="mt-1" type="number" step="0.01" value={form.variable_margin ?? ''} onChange={e => set('variable_margin', parseFloat(e.target.value) || null)} />
                  </div>
                  <div>
                    <Label>Rate Cap (%)</Label>
                    <Input className="mt-1" type="number" step="0.01" value={form.variable_rate_cap ?? ''} onChange={e => set('variable_rate_cap', parseFloat(e.target.value) || null)} />
                  </div>
                  <div>
                    <Label>Rate Floor (%)</Label>
                    <Input className="mt-1" type="number" step="0.01" value={form.variable_rate_floor ?? ''} onChange={e => set('variable_rate_floor', parseFloat(e.target.value) || null)} />
                  </div>
                </>
              )}
              <div>
                <Label>Loan Term (months) <span className="text-destructive">*</span></Label>
                <Input className="mt-1" type="number" placeholder="12" value={form.loan_term_months || ''} onChange={e => set('loan_term_months', parseInt(e.target.value) || 12)} />
              </div>
              <div>
                <Label>Amortization Period (months) <span className="text-muted-foreground text-xs">(if balloon)</span></Label>
                <Input className="mt-1" type="number" placeholder="360" value={form.amortization_period_months ?? ''} onChange={e => set('amortization_period_months', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
              <div>
                <Label>Payment Frequency</Label>
                <Select value={form.payment_frequency} onValueChange={v => set('payment_frequency', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="interest_only">Interest Only</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Label>Interest Calculation</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs">
                        How daily interest is calculated. Different methods yield slightly different amounts.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={form.interest_calc_method} onValueChange={v => set('interest_calc_method', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <div className="flex flex-col items-start">
                        <span>Standard (30/360)</span>
                        <span className="text-xs text-muted-foreground">30-day months, 360-day year</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="actual_360">
                      <div className="flex flex-col items-start">
                        <span>Actual/360</span>
                        <span className="text-xs text-muted-foreground">Actual days / 360 — common for hard money</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="actual_365">
                      <div className="flex flex-col items-start">
                        <span>Actual/365</span>
                        <span className="text-xs text-muted-foreground">Actual days / 365 — more precise</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="simple">
                      <div className="flex flex-col items-start">
                        <span>Simple Interest</span>
                        <span className="text-xs text-muted-foreground">P × R × T — no compounding</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start / Origination Date <span className="text-destructive">*</span></Label>
                <Input className="mt-1" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>
              <div>
                <Label>Maturity Date</Label>
                <Input className="mt-1" type="date" value={form.maturity_date} onChange={e => set('maturity_date', e.target.value)} />
              </div>
            </div>
            {liveMonthlyPayment != null && (
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-sm">
                <span className="text-muted-foreground">Estimated monthly payment: </span>
                <span className="font-semibold text-primary">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(liveMonthlyPayment)}
                </span>
                {form.amortization_period_months && form.amortization_period_months !== form.loan_term_months && (
                  <span className="text-warning ml-2">+ balloon at maturity</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Fees ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origination Fee (points)</Label>
                <Input className="mt-1" type="number" step="0.25" placeholder="2" value={form.origination_fee_points ?? ''} onChange={e => set('origination_fee_points', parseFloat(e.target.value) || null)} />
              </div>
              <div>
                <Label>Origination Fee ($)</Label>
                <Input className="mt-1" type="number" placeholder="0" value={form.origination_fee_dollars ?? ''} onChange={e => { const v = e.target.value; set('origination_fee_dollars', v === '' ? null : parseFloat(v)); }} />
              </div>
              <div>
                <Label>Other Closing Costs</Label>
                <Input className="mt-1" type="number" value={form.other_closing_costs ?? ''} onChange={e => set('other_closing_costs', parseFloat(e.target.value) || null)} />
              </div>
              <div>
                <Label>Extension Fee</Label>
                <Input className="mt-1" type="number" value={form.extension_fee ?? ''} onChange={e => set('extension_fee', parseFloat(e.target.value) || null)} />
              </div>
              <div className="col-span-2">
                <Label>Extension Terms <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input className="mt-1" placeholder="e.g. Two 3-month extensions at 1 point each" value={form.extension_terms ?? ''} onChange={e => set('extension_terms', e.target.value || null)} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Prepayment Penalty</p>
                <p className="text-xs text-muted-foreground">Does this loan have prepayment restrictions?</p>
              </div>
              <Switch checked={form.has_prepayment_penalty} onCheckedChange={v => set('has_prepayment_penalty', v)} />
            </div>
            {form.has_prepayment_penalty && (
              <div>
                <Label>Prepayment Penalty Terms</Label>
                <Textarea className="mt-1" placeholder="e.g. 3% in year 1, 2% in year 2, 1% in year 3" value={form.prepayment_penalty_terms ?? ''} onChange={e => set('prepayment_penalty_terms', e.target.value || null)} />
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Draw Schedule ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Enable Draw Schedule</p>
                <p className="text-xs text-muted-foreground">Track individual draws for construction/rehab loans</p>
              </div>
              <Switch checked={form.has_draws} onCheckedChange={v => set('has_draws', v)} />
            </div>
            {form.has_draws && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Draw Amount</Label>
                    <Input className="mt-1" type="number" value={form.total_draw_amount ?? ''} onChange={e => set('total_draw_amount', parseFloat(e.target.value) || null)} />
                  </div>
                  <div>
                    <Label>Draw Structure</Label>
                    <Select value={form.draw_structure ?? ''} onValueChange={v => set('draw_structure', v as DrawStructure)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select structure" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="milestone">Milestone-Based</SelectItem>
                        <SelectItem value="percentage">Percentage-Based</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.draw_structure === 'custom' && (
                  <div>
                    <Label>Custom Draw Terms</Label>
                    <Textarea className="mt-1" rows={3} value={form.custom_draw_terms ?? ''} onChange={e => set('custom_draw_terms', e.target.value || null)} />
                  </div>
                )}
                {form.draw_structure && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Draw Milestones</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addDraw}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Draw
                      </Button>
                    </div>
                    {draws.map((draw, i) => (
                      <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Draw #{draw.draw_number}</span>
                          {draws.length > 1 && (
                            <button onClick={() => removeDraw(i)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {form.draw_structure !== 'percentage' && (
                            <div>
                              <Label className="text-xs">Milestone Name</Label>
                              <Input className="mt-0.5 h-8 text-sm" placeholder="Foundation Complete" value={draw.milestone_name ?? ''} onChange={e => updateDraw(i, 'milestone_name', e.target.value)} />
                            </div>
                          )}
                          {form.draw_structure === 'percentage' && (
                            <div>
                              <Label className="text-xs">% of Total</Label>
                              <Input className="mt-0.5 h-8 text-sm" type="number" value={draw.draw_percentage ?? ''} onChange={e => updateDrawPct(i, parseFloat(e.target.value) || 0)} />
                            </div>
                          )}
                          <div>
                            <Label className="text-xs">Amount ($)</Label>
                            <Input className="mt-0.5 h-8 text-sm" type="number" value={draw.draw_amount || ''} onChange={e => updateDraw(i, 'draw_amount', parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-xs">Expected Date</Label>
                            <Input className="mt-0.5 h-8 text-sm" type="date" value={draw.expected_date ?? ''} onChange={e => updateDraw(i, 'expected_date', e.target.value || null)} />
                          </div>
                          <div>
                            <Label className="text-xs">Status</Label>
                            <Select value={draw.status} onValueChange={v => updateDraw(i, 'status', v)}>
                              <SelectTrigger className="mt-0.5 h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="requested">Requested</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="funded">Funded</SelectItem>
                                <SelectItem value="denied">Denied</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Collateral & Notes ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Collateral Type</Label>
                <Select value={form.collateral_type ?? ''} onValueChange={v => set('collateral_type', v || null)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_property">Real Property</SelectItem>
                    <SelectItem value="personal_guarantee">Personal Guarantee</SelectItem>
                    <SelectItem value="cross_collateral">Cross-Collateral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>LTV at Origination (%)</Label>
                <Input className="mt-1" type="number" step="0.1" placeholder="70.0" value={form.ltv_at_origination ?? ''} onChange={e => set('ltv_at_origination', parseFloat(e.target.value) || null)} />
              </div>
              <div className="col-span-2">
                <Label>Collateral Description</Label>
                <Textarea className="mt-1" placeholder="e.g. First lien position on 534 St Johns Way, Grand Prairie TX" value={form.collateral_description ?? ''} onChange={e => set('collateral_description', e.target.value || null)} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Personal Guarantee</p>
                <p className="text-xs text-muted-foreground">Borrower personally guarantees this loan</p>
              </div>
              <Switch checked={form.has_personal_guarantee} onCheckedChange={v => set('has_personal_guarantee', v)} />
            </div>
            <div>
              <Label>General Notes</Label>
              <Textarea className="mt-1" rows={4} placeholder="Any special terms, conditions, verbal agreements, etc." value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} />
            </div>
          </div>
        )}

        <DialogFooter className="mt-6 flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div className="flex-1" />
          {/* Edit mode: expose Save & Exit on every step so quick fixes don't require clicking through all 5 steps. */}
          {initialData?.id && step < STEPS.length - 1 && (
            <Button
              variant="outline"
              onClick={handleSubmit}
              disabled={saving || !form.lender_name || form.original_amount <= 0}
            >
              {saving ? 'Saving…' : 'Save & Exit'}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || !form.lender_name || form.original_amount <= 0}>
              {saving ? 'Saving…' : initialData?.id ? 'Save Changes' : 'Add Loan'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
