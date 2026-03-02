import { useState, useMemo, useEffect } from 'react';
import { Landmark, DollarSign, Percent, Save, Loader2, TrendingUp, Clock, Settings, CalendarClock, RotateCcw, ChevronDown, TableProperties, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { parseDateString } from '@/lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEFAULT_TERM_PRESETS = [6, 12, 18, 360];
const TERM_PRESETS_KEY = 'loan-term-presets';

function getTermPresets(): number[] {
  try {
    const stored = localStorage.getItem(TERM_PRESETS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 4 && parsed.every((n: any) => typeof n === 'number' && n > 0)) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_TERM_PRESETS;
}

function formatTermLabel(months: number): string {
  return `${months}`;
}

function calculateToDateMonths(startDateStr: string, endDate?: Date): number {
  const start = parseDateString(startDateStr);
  const end = endDate || new Date();
  const diffMs = end.getTime() - start.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.44);
  return Math.round(months * 10) / 10;
}

interface HardMoneyLoanCalculatorProps {
  projectId: string;
  purchasePrice: number;
  totalBudget: number;
  arv: number;
  projectStartDate?: string;
  initialLoanAmount?: number;
  initialInterestRate?: number;
  initialLoanTermMonths?: number;
  initialPoints?: number;
  initialClosingCosts?: number;
  initialInterestOnly?: boolean;
  initialUseToDate?: boolean;
  initialLoanStartDate?: string;
  onSaved?: () => void;
}

export function HardMoneyLoanCalculator({
  projectId,
  purchasePrice,
  totalBudget,
  arv,
  projectStartDate,
  initialLoanAmount,
  initialInterestRate = 12,
  initialLoanTermMonths = 6,
  initialPoints = 3,
  initialClosingCosts = 0,
  initialInterestOnly = true,
  initialUseToDate = false,
  initialLoanStartDate,
  onSaved,
}: HardMoneyLoanCalculatorProps) {
  // Editable purchase price for testing scenarios
  const [editablePurchasePrice, setEditablePurchasePrice] = useState(purchasePrice);
  
  // Default loan amount to 75% of purchase price if not set
  const defaultLoanAmount = initialLoanAmount ?? (purchasePrice * 0.75);
  const defaultClosingCosts = initialClosingCosts ?? (purchasePrice * 0.02);
  
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTermMonths, setLoanTermMonths] = useState(initialLoanTermMonths);
  const [points, setPoints] = useState(initialPoints);
  const [closingCosts, setClosingCosts] = useState(defaultClosingCosts);
  const [interestOnly, setInterestOnly] = useState(initialInterestOnly);
  const [saving, setSaving] = useState(false);
  const [useToDate, setUseToDate] = useState(initialUseToDate);
  const [loanStartDate, setLoanStartDate] = useState(initialLoanStartDate || projectStartDate || '');

  // Custom term popover
  const [customTermOpen, setCustomTermOpen] = useState(false);
  const [customTermInput, setCustomTermInput] = useState('');

  // Term presets settings
  const [termPresets, setTermPresets] = useState<number[]>(getTermPresets);
  const [termSettingsOpen, setTermSettingsOpen] = useState(false);
  const [editTermSlots, setEditTermSlots] = useState<string[]>(termPresets.map(String));

  // To Date calculation
  const [toDateEndDate, setToDateEndDate] = useState<Date>(new Date());
  const [termDaysOverride, setTermDaysOverride] = useState<number | null>(null);

  const toDateMonths = useMemo(() => {
    if (!loanStartDate) return null;
    return calculateToDateMonths(loanStartDate, toDateEndDate);
  }, [loanStartDate, toDateEndDate]);

  const toDateDays = useMemo(() => {
    if (!loanStartDate) return null;
    const start = parseDateString(loanStartDate);
    return Math.round((toDateEndDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [loanStartDate, toDateEndDate]);

  // Restore "To Date" mode on mount if it was saved
  useEffect(() => {
    if (initialUseToDate && toDateMonths && toDateMonths > 0 && toDateDays) {
      setLoanTermMonths(toDateMonths);
      setTermDaysOverride(toDateDays);
      setUseToDate(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // One-time on mount

  // Sync term/days when loanStartDate or toDateEndDate changes in To Date mode
  useEffect(() => {
    if (!useToDate || !loanStartDate) return;
    const newMonths = calculateToDateMonths(loanStartDate, toDateEndDate);
    const start = parseDateString(loanStartDate);
    const newDays = Math.round(
      (toDateEndDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (newMonths > 0) {
      setLoanTermMonths(newMonths);
      setTermDaysOverride(newDays);
    }
  }, [loanStartDate, toDateEndDate, useToDate]);

  const handleSave = async () => {
    setSaving(true);
    const saveLoanStartDate = loanStartDate && loanStartDate !== projectStartDate ? loanStartDate : null;
    const { error } = await supabase
      .from('projects')
      .update({
        hm_loan_amount: loanAmount,
        hm_interest_rate: interestRate,
        hm_loan_term_months: loanTermMonths,
        hm_points: points,
        hm_closing_costs: closingCosts,
        hm_interest_only: interestOnly,
        hm_use_to_date: useToDate,
        hm_loan_start_date: saveLoanStartDate,
      } as any)
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save loan details');
      console.error(error);
    } else {
      toast.success('Loan details saved');
      onSaved?.();
    }
    setSaving(false);
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const dailyRate = interestRate / 100 / 365;
    const dailyInterest = loanAmount * dailyRate;
    
    let monthlyPayment: number;
    let totalInterest: number;
    
    const termDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
    
    if (interestOnly) {
      monthlyPayment = (loanAmount * (interestRate / 100)) / 12;
      totalInterest = dailyInterest * termDays;
    } else {
      if (monthlyRate > 0 && loanTermMonths > 0) {
        monthlyPayment = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
          (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
        totalInterest = (monthlyPayment * loanTermMonths) - loanAmount;
      } else {
        monthlyPayment = loanAmount / loanTermMonths;
        totalInterest = 0;
      }
    }
    
    const pointsCost = loanAmount * (points / 100);
    const totalLoanCost = totalInterest + pointsCost + closingCosts;
    const termYears = loanTermMonths / 12;
    const effectiveAPR = termYears > 0 ? ((totalLoanCost / loanAmount) / termYears) * 100 : 0;
    
    const monthlyInterestPortion = loanAmount * monthlyRate;
    const monthlyPrincipal = interestOnly ? 0 : monthlyPayment - monthlyInterestPortion;

    return {
      monthlyPayment,
      dailyInterest,
      totalInterest,
      pointsCost,
      totalLoanCost,
      effectiveAPR,
      monthlyInterestPortion,
      monthlyPrincipal,
    };
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, interestOnly, termDaysOverride]);

  // Rate sensitivity analysis
  const rateSensitivity = useMemo(() => {
    const sellingCosts = arv * 0.06;
    const termDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
    
    return [0, 1, 2].map(bump => {
      const adjustedRate = interestRate + bump;
      const dailyInt = loanAmount * (adjustedRate / 100 / 365);
      const adjustedInterest = dailyInt * termDays;
      const pointsCost = loanAmount * (points / 100);
      const adjustedProfit = arv - editablePurchasePrice - totalBudget - adjustedInterest - pointsCost - closingCosts - sellingCosts;
      
      return { 
        rate: adjustedRate, 
        interest: adjustedInterest, 
        profit: adjustedProfit 
      };
    });
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, arv, editablePurchasePrice, totalBudget, termDaysOverride]);

  // Payoff timeline comparison
  const payoffComparison = useMemo(() => {
    const dailyInt = loanAmount * (interestRate / 100 / 365);
    const allowedMonths = [4, 6, 12, 18].filter(m => m <= loanTermMonths);
    
    const isFractional = loanTermMonths % 1 !== 0;
    if (isFractional && !allowedMonths.includes(loanTermMonths)) {
      allowedMonths.push(loanTermMonths);
      allowedMonths.sort((a, b) => a - b);
    }
    
    const currentTermDays = termDaysOverride ?? Math.round(loanTermMonths * 30.44);
    
    return allowedMonths.map(months => {
      const days = months === loanTermMonths && termDaysOverride ? termDaysOverride : Math.round(months * 30.44);
      return {
        months,
        interest: dailyInt * days,
        savings: months < loanTermMonths ? dailyInt * (currentTermDays - days) : 0,
        isCurrent: months === loanTermMonths,
      };
    });
  }, [loanAmount, interestRate, loanTermMonths, termDaysOverride]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const loanToValue = editablePurchasePrice > 0 ? ((loanAmount / editablePurchasePrice) * 100) : 0;

  const handleSaveTermPresets = () => {
    const newPresets = editTermSlots.map(s => {
      const val = parseFloat(s);
      return isNaN(val) || val <= 0 ? 6 : val;
    });
    setTermPresets(newPresets);
    localStorage.setItem(TERM_PRESETS_KEY, JSON.stringify(newPresets));
    setTermSettingsOpen(false);
    toast.success('Term presets saved');
  };

  const handleResetTermPresets = () => {
    setTermPresets(DEFAULT_TERM_PRESETS);
    setEditTermSlots(DEFAULT_TERM_PRESETS.map(String));
    localStorage.removeItem(TERM_PRESETS_KEY);
    toast.success('Term presets reset to defaults');
  };

  const termOptions = termPresets;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          Loan Calculator
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-5">
            {/* Purchase Price (Editable) */}
            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="purchase-price"
                  type="number"
                  value={editablePurchasePrice || ''}
                  onChange={(e) => setEditablePurchasePrice(Number(e.target.value))}
                  className="pl-9 rounded-sm"
                  placeholder="0"
                />
              </div>
              {editablePurchasePrice !== purchasePrice && (
                <p className="text-xs text-warning">Testing mode - differs from project price</p>
              )}
            </div>

            {/* Loan Amount */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="loan-amount">Loan Amount</Label>
                <span className="text-xs text-muted-foreground">
                  {loanToValue.toFixed(0)}% of Purchase Price
                </span>
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loan-amount"
                  type="number"
                  value={loanAmount || ''}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="pl-9 rounded-sm"
                  placeholder="0"
                />
              </div>
              <Slider
                value={[loanAmount]}
                onValueChange={([val]) => setLoanAmount(val)}
                min={0}
                max={editablePurchasePrice > 0 ? editablePurchasePrice : 500000}
                step={1000}
                className="mt-2"
              />
            </div>

            {/* Interest Rate + Loan Term — same row */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
              <div className="space-y-2">
                <Label htmlFor="interest-rate">Annual Interest Rate</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="interest-rate"
                    type="number"
                    value={interestRate || ''}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="pl-9 rounded-sm"
                    step={0.01}
                    min={0}
                    max={30}
                    placeholder="12"
                  />
                </div>
              </div>

              {/* Loan Term */}
              <div className="space-y-2">
                <Label>Loan Term (Months)</Label>
              <div className="flex flex-wrap gap-2">
                {termOptions.map((term) => (
                  <Button
                    key={term}
                    type="button"
                    variant={loanTermMonths === term && !useToDate ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setLoanTermMonths(term); setTermDaysOverride(null); setUseToDate(false); }}
                    className="rounded-sm min-w-[4rem]"
                  >
                    {formatTermLabel(term)}
                  </Button>
                ))}
                <Popover open={customTermOpen} onOpenChange={setCustomTermOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant={!termOptions.includes(loanTermMonths) && !useToDate ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-sm min-w-[4rem]"
                    >
                      {!termOptions.includes(loanTermMonths) && !useToDate ? loanTermMonths : 'Custom'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-3" align="end">
                    <div className="space-y-2">
                      <Label htmlFor="custom-term" className="text-xs">Custom Term (Months)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-term"
                          type="number"
                          value={customTermInput}
                          onChange={(e) => setCustomTermInput(e.target.value)}
                          className="h-8 rounded-sm text-sm"
                          placeholder="e.g. 9 or 1.5"
                          min={0.5}
                          max={600}
                          step={0.5}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseFloat(customTermInput);
                              if (val > 0 && val <= 600) {
                                setLoanTermMonths(val);
                                setTermDaysOverride(null);
                                setUseToDate(false);
                                setCustomTermOpen(false);
                                setCustomTermInput('');
                              }
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            const val = parseFloat(customTermInput);
                            if (val > 0 && val <= 600) {
                              setLoanTermMonths(val);
                              setTermDaysOverride(null);
                              setUseToDate(false);
                              setCustomTermOpen(false);
                              setCustomTermInput('');
                            }
                          }}
                        >
                          Set
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* To Date Button + Date Picker */}
                {loanStartDate && toDateMonths !== null && toDateMonths > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant={useToDate ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-sm rounded-r-none border-primary/50 min-w-[4rem]"
                      onClick={() => { setLoanTermMonths(toDateMonths); if (toDateDays) setTermDaysOverride(toDateDays); setUseToDate(true); }}
                    >
                      <CalendarClock className="h-3.5 w-3.5 mr-1" />
                      To Date
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={useToDate ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-sm rounded-l-none border-l-0 border-primary/50 px-1.5"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <div className="p-3 pb-1 text-xs text-muted-foreground font-medium">
                          {toDateDays} days from loan start
                        </div>
                        <Calendar
                          mode="single"
                          selected={toDateEndDate}
                          onSelect={(date) => {
                            if (date) {
                              setToDateEndDate(date);
                              const newMonths = calculateToDateMonths(loanStartDate, date);
                              if (newMonths > 0) {
                                setLoanTermMonths(newMonths);
                                const start = parseDateString(loanStartDate);
                                const exactDays = Math.round((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                setTermDaysOverride(exactDays);
                              }
                            }
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                        <div className="px-3 pb-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs h-7"
                            onClick={() => {
                              const today = new Date();
                              setToDateEndDate(today);
                              const newMonths = calculateToDateMonths(loanStartDate, today);
                              if (newMonths > 0) {
                                setLoanTermMonths(newMonths);
                                const start = parseDateString(loanStartDate);
                                const exactDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                setTermDaysOverride(exactDays);
                              }
                            }}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset to Today
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Term Settings Gear */}
                <Popover open={termSettingsOpen} onOpenChange={(open) => {
                  setTermSettingsOpen(open);
                  if (open) setEditTermSlots(termPresets.map(String));
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-sm h-9 w-9 p-0"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Term Presets</Label>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleResetTermPresets}>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                      {editTermSlots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-10">Slot {i + 1}</span>
                          <Input
                            type="number"
                            value={slot}
                            onChange={(e) => {
                              const updated = [...editTermSlots];
                              updated[i] = e.target.value;
                              setEditTermSlots(updated);
                            }}
                            className="h-7 text-xs rounded-sm"
                            min={0.5}
                            max={600}
                            step={0.5}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {parseFloat(slot) >= 12 && parseFloat(slot) % 12 === 0
                              ? `= ${parseFloat(slot) / 12}yr`
                              : 'mo'}
                          </span>
                        </div>
                      ))}
                      <Button size="sm" className="w-full h-7 text-xs" onClick={handleSaveTermPresets}>
                        Save Presets
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            </div>

            {/* Loan Start Date */}
            <div className="space-y-2">
              <Label>Loan Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-sm",
                      !loanStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {loanStartDate ? format(parseDateString(loanStartDate), 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={loanStartDate ? parseDateString(loanStartDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const d = String(date.getDate()).padStart(2, '0');
                        setLoanStartDate(`${y}-${m}-${d}`);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {loanStartDate && projectStartDate && loanStartDate !== projectStartDate && (
                <p className="text-xs text-muted-foreground">
                  Project started: {format(parseDateString(projectStartDate), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
            {/* Points/Origination */}
            <div className="space-y-2">
              <Label htmlFor="points">Points / Origination (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="points"
                  type="number"
                  value={points || ''}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="pl-9 rounded-sm"
                  step={0.5}
                  min={0}
                  max={10}
                />
              </div>
            </div>

            {/* Closing Costs */}
            <div className="space-y-2">
              <Label htmlFor="closing-costs">Closing Costs</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="closing-costs"
                  type="number"
                  value={closingCosts || ''}
                  onChange={(e) => setClosingCosts(Number(e.target.value))}
                  className="pl-9 rounded-sm"
                  placeholder="0"
                />
              </div>
            </div>
            </div>

            {/* Interest Type Toggle */}
            <div className="flex items-center justify-between p-3 rounded-sm bg-muted/50 border border-border">
              <div>
                <Label htmlFor="interest-type" className="cursor-pointer">Interest Only</Label>
                <p className="text-xs text-muted-foreground">
                  {interestOnly ? 'Pay interest only during term' : 'Principal + Interest payments'}
                </p>
              </div>
              <Switch
                id="interest-type"
                checked={interestOnly}
                onCheckedChange={setInterestOnly}
              />
            </div>

            {/* Amortization Schedule */}
            {!interestOnly && loanAmount > 0 && loanTermMonths > 0 && (
              <AmortizationSchedule
                loanAmount={loanAmount}
                monthlyRate={interestRate / 100 / 12}
                monthlyPayment={calculations.monthlyPayment}
                loanTermMonths={Math.ceil(loanTermMonths)}
                formatCurrency={formatCurrency}
              />
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-sm bg-primary/10 border border-primary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Monthly Payment</p>
                <p className="text-lg font-bold font-mono text-primary">
                  {formatCurrency(calculations.monthlyPayment)}
                </p>
                {!interestOnly && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    P: {formatCurrency(calculations.monthlyPrincipal)}  |  I: {formatCurrency(calculations.monthlyInterestPortion)}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-sm bg-warning/10 border border-warning/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Interest</p>
                <p className="text-lg font-bold font-mono text-warning">
                  {formatCurrency(calculations.totalInterest)}
                </p>
              </div>
              <div className="p-3 rounded-sm bg-destructive/10 border border-destructive/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Effective APR</p>
                <p className="text-lg font-bold font-mono text-destructive">
                  {calculations.effectiveAPR.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Daily Interest */}
            <div className="flex items-center justify-between p-3 rounded-sm bg-primary/5 border border-primary/20">
              <span className="text-sm text-muted-foreground">Daily Interest</span>
              <span className="text-sm font-bold font-mono text-primary">
                {formatCurrency(calculations.dailyInterest)} / day
              </span>
            </div>

            {/* Total Loan Cost Breakdown */}
            <div className="p-4 rounded-sm bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Total Loan Cost</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {formatCurrency(calculations.totalLoanCost)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 text-sm text-muted-foreground">
                <span>Points: {formatCurrency(calculations.pointsCost)}</span>
                <span>Interest: {formatCurrency(calculations.totalInterest)}</span>
                <span>Closing: {formatCurrency(closingCosts)}</span>
              </div>
            </div>

            {/* Rate Sensitivity Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Rate Sensitivity
              </h4>
              <div className="rounded-sm border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Rate</th>
                      <th className="text-right p-2 font-medium">Interest</th>
                      <th className="text-right p-2 font-medium">Est. Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateSensitivity.map((row, idx) => (
                      <tr 
                        key={row.rate} 
                        className={cn(
                          "border-t border-border",
                          idx === 0 && "bg-primary/5"
                        )}
                      >
                        <td className="p-2 font-mono">
                          {row.rate.toFixed(1)}%
                          {idx === 0 && <span className="text-xs text-primary ml-1">(current)</span>}
                        </td>
                        <td className="p-2 text-right font-mono">{formatCurrency(row.interest)}</td>
                        <td className={cn(
                          "p-2 text-right font-mono",
                          row.profit >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {formatCurrency(row.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payoff Timeline */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Payoff Timeline
              </h4>
              <div className="space-y-2">
                {payoffComparison.map((row) => (
                  <div 
                    key={row.months} 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-sm border",
                      row.isCurrent 
                        ? "bg-primary/10 border-primary/30" 
                        : row.months < loanTermMonths
                          ? "bg-success/5 border-success/20"
                          : "bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        If sold at <span className="font-mono font-medium">{row.months % 1 !== 0 ? row.months.toFixed(1) : row.months} mo</span>:
                        {row.isCurrent && row.months % 1 !== 0 && (
                          <span className="text-xs text-primary ml-1">(current)</span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-sm">{formatCurrency(row.interest)} int</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- Amortization Schedule Sub-component ---- */
function AmortizationSchedule({
  loanAmount,
  monthlyRate,
  monthlyPayment,
  loanTermMonths,
  formatCurrency,
}: {
  loanAmount: number;
  monthlyRate: number;
  monthlyPayment: number;
  loanTermMonths: number;
  formatCurrency: (n: number) => string;
}) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = loanAmount;
    for (let m = 1; m <= loanTermMonths && balance > 0.01; m++) {
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, balance);
      balance = balance - principal;
      schedule.push({
        month: m,
        payment: principal + interest,
        principal,
        interest,
        balance: Math.max(balance, 0),
      });
    }
    return schedule;
  }, [loanAmount, monthlyRate, monthlyPayment, loanTermMonths]);

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-between text-sm"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-primary" />
          Amortization Schedule
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="rounded-sm border border-border overflow-hidden max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">#</th>
                <th className="text-right p-2 font-medium">Payment</th>
                <th className="text-right p-2 font-medium">Principal</th>
                <th className="text-right p-2 font-medium">Interest</th>
                <th className="text-right p-2 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.month} className="border-t border-border">
                  <td className="p-2 font-mono text-muted-foreground">{r.month}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(r.payment)}</td>
                  <td className="p-2 text-right font-mono text-success">{formatCurrency(r.principal)}</td>
                  <td className="p-2 text-right font-mono text-warning">{formatCurrency(r.interest)}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
