import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Save, Loader2, Home, Percent, Building, Settings2, ArrowDownToLine, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface CashFlowCalculatorProps {
  projectId: string;
  totalBudget: number;
  totalSpent: number;
  initialPurchasePrice?: number;
  initialArv?: number;
  initialMonthlyRent?: number;
  initialLoanAmount?: number;
  initialInterestRate?: number;
  initialLoanTermYears?: number;
  initialAnnualPropertyTaxes?: number;
  initialAnnualInsurance?: number;
  initialAnnualHoa?: number;
  initialVacancyRate?: number;
  initialMonthlyMaintenance?: number;
  initialManagementRate?: number;
  initialRehabOverride?: number | null;
  hmLoanAmount?: number;
  hmInterestRate?: number;
  hmLoanTermMonths?: number;
  onSaved?: () => void;
}

export function CashFlowCalculator({ 
  projectId, 
  totalBudget, 
  totalSpent,
  initialPurchasePrice = 0,
  initialArv = 0,
  initialMonthlyRent = 0,
  initialLoanAmount = 0,
  initialInterestRate = 0,
  initialLoanTermYears = 30,
  initialAnnualPropertyTaxes = 0,
  initialAnnualInsurance = 0,
  initialAnnualHoa = 0,
  initialVacancyRate = 8,
  initialMonthlyMaintenance = 0,
  initialManagementRate = 10,
  initialRehabOverride,
  hmLoanAmount = 0,
  hmInterestRate = 0,
  hmLoanTermMonths = 0,
  onSaved,
}: CashFlowCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  const [arv, setArv] = useState(initialArv);
  const [monthlyRent, setMonthlyRent] = useState(initialMonthlyRent);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTermMonths, setLoanTermMonths] = useState(Math.round((initialLoanTermYears ?? 30) * 12));
  const [rehabMode, setRehabMode] = useState<'budget' | 'spent' | 'manual'>(initialRehabOverride != null ? 'manual' : 'budget');
  const [rehabOverride, setRehabOverride] = useState(initialRehabOverride ?? totalBudget);
  const [annualPropertyTaxes, setAnnualPropertyTaxes] = useState(initialAnnualPropertyTaxes);
  const [annualInsurance, setAnnualInsurance] = useState(initialAnnualInsurance);
  const [annualHoa, setAnnualHoa] = useState(initialAnnualHoa);
  const [vacancyRate, setVacancyRate] = useState(initialVacancyRate);
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(initialMonthlyMaintenance);
  const [managementRate, setManagementRate] = useState(initialManagementRate);
  const [saving, setSaving] = useState(false);
  const [expandedCard, setExpandedCard] = useState<'monthly' | 'annual' | 'roi' | null>(null);
  const [taxPeriod, setTaxPeriod] = useState<'month' | 'year'>('year');
  const [hoaPeriod, setHoaPeriod] = useState<'month' | 'year'>('year');
  const [insurancePeriod, setInsurancePeriod] = useState<'month' | 'year'>('year');
  const [maintenancePeriod, setMaintenancePeriod] = useState<'month' | 'year'>('month');
  const [refiEnabled, setRefiEnabled] = useState(initialLoanAmount > 0 || hmLoanAmount > 0);
  const [useManualLoan, setUseManualLoan] = useState(false);

  const PeriodToggle = ({ value, onChange }: { value: 'month' | 'year'; onChange: (v: 'month' | 'year') => void }) => (
    <span className="inline-flex rounded-full border border-border overflow-hidden text-[10px] font-semibold leading-none">
      <button
        type="button"
        onClick={() => onChange('year')}
        className={cn(
          "px-1.5 py-0.5 transition-colors",
          value === 'year' ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:bg-muted/80"
        )}
      >
        Yr
      </button>
      <button
        type="button"
        onClick={() => onChange('month')}
        className={cn(
          "px-1.5 py-0.5 transition-colors",
          value === 'month' ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:bg-muted/80"
        )}
      >
        Mo
      </button>
    </span>
  );

  useEffect(() => {
    setPurchasePrice(initialPurchasePrice);
    setArv(initialArv);
    setMonthlyRent(initialMonthlyRent);
    setLoanAmount(initialLoanAmount);
    setInterestRate(initialInterestRate);
    setLoanTermMonths(Math.round((initialLoanTermYears ?? 30) * 12));
    setRehabMode(initialRehabOverride != null ? 'manual' : 'budget');
    setRehabOverride(initialRehabOverride ?? totalBudget);
    setAnnualPropertyTaxes(initialAnnualPropertyTaxes);
    setAnnualInsurance(initialAnnualInsurance);
    setAnnualHoa(initialAnnualHoa);
    setVacancyRate(initialVacancyRate);
    setMonthlyMaintenance(initialMonthlyMaintenance);
    setManagementRate(initialManagementRate);
    setRefiEnabled(initialLoanAmount > 0 || hmLoanAmount > 0);
    setUseManualLoan(initialLoanAmount > 0 && hmLoanAmount > 0 && (initialLoanAmount !== hmLoanAmount || initialInterestRate !== hmInterestRate));
  }, [
    initialPurchasePrice, initialArv, initialMonthlyRent, initialLoanAmount,
    initialInterestRate, initialLoanTermYears, initialAnnualPropertyTaxes,
    initialAnnualInsurance, initialAnnualHoa, initialVacancyRate, initialMonthlyMaintenance,
    initialManagementRate, hmLoanAmount, hmInterestRate
  ]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        purchase_price: purchasePrice,
        arv: arv,
        monthly_rent: monthlyRent,
        loan_amount: refiEnabled ? (useManualLoan ? loanAmount : effectiveLoanAmt) : 0,
        interest_rate: useManualLoan ? interestRate : effectiveRate,
        loan_term_years: (useManualLoan ? loanTermMonths : effectiveTerm) / 12,
        annual_property_taxes: annualPropertyTaxes,
        annual_insurance: annualInsurance,
        annual_hoa: annualHoa,
        vacancy_rate: vacancyRate,
        monthly_maintenance: monthlyMaintenance,
        management_rate: managementRate,
        cashflow_rehab_override: rehabMode === 'manual' ? rehabOverride : null,
      } as any)
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save');
      console.error(error);
    } else {
      toast.success('Saved');
      onSaved?.();
    }
    setSaving(false);
  };

  // Suggested loan amount for placeholder display only
  const suggestedLoanAmount = arv * 0.75;
  // Determine effective loan values: use Loan tab unless manual override
  const effectiveLoanAmt = useManualLoan ? loanAmount : (hmLoanAmount > 0 ? hmLoanAmount : loanAmount);
  const effectiveRate = useManualLoan ? interestRate : (hmLoanAmount > 0 ? hmInterestRate : interestRate);
  const effectiveTerm = useManualLoan ? loanTermMonths : (hmLoanAmount > 0 ? hmLoanTermMonths : loanTermMonths);
  // When refi disabled or no loan entered, treat as all-cash deal
  const effectiveLoanAmount = refiEnabled && effectiveLoanAmt > 0 ? effectiveLoanAmt : 0;

  // Monthly mortgage payment (P&I) using amortization formula
  const monthlyInterestRate = (effectiveRate / 100) / 12;
  const numberOfPayments = effectiveTerm;
  let monthlyMortgage = 0;
  if (effectiveLoanAmount > 0 && monthlyInterestRate > 0 && numberOfPayments > 0) {
    monthlyMortgage = effectiveLoanAmount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  }

  // Income calculations
  const vacancyAllowance = monthlyRent * (vacancyRate / 100);
  const grossMonthlyIncome = monthlyRent - vacancyAllowance;

  // Expense calculations
  const monthlyTaxes = annualPropertyTaxes / 12;
  const monthlyInsurance = annualInsurance / 12;
  const monthlyHoa = annualHoa / 12;
  const managementFee = monthlyRent * (managementRate / 100);
  const totalMonthlyExpenses = monthlyTaxes + monthlyInsurance + monthlyHoa + monthlyMaintenance + managementFee;

  // Cash flow calculations
  const monthlyCashFlow = grossMonthlyIncome - monthlyMortgage - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;

  // Rehab budget: use manual override or project totalBudget
  const activeRehabBudget = rehabMode === 'manual' ? (rehabOverride || 0) : rehabMode === 'spent' ? totalSpent : totalBudget;

  // Cash invested = Purchase + Rehab - Loan Amount (money left in deal after refi)
  const totalInvestment = purchasePrice + activeRehabBudget;
  const cashInvested = totalInvestment - effectiveLoanAmount;
  const cashOnCashROI = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;

  // Refi analysis
  const refiCashOut = effectiveLoanAmount - totalInvestment;
  const equityInProperty = arv - effectiveLoanAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5" />
          Cash Flow Calculator
        </CardTitle>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Property Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="purchase-price">Purchase Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="purchase-price"
                type="number"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="pl-9"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="arv">After Repair Value (ARV)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="arv"
                type="number"
                value={arv || ''}
                onChange={(e) => setArv(Number(e.target.value))}
                className="pl-9"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="monthly-rent">Monthly Rent</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthly-rent"
                type="number"
                value={monthlyRent || ''}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="pl-9"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Rehab Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Label htmlFor="rehab-budget" className="mb-0">Construction Budget</Label>
              <span className="inline-flex rounded-full border border-border overflow-hidden text-[10px] font-semibold leading-none">
                <button
                  type="button"
                  onClick={() => { setRehabMode('budget'); setRehabOverride(totalBudget); }}
                  className={cn(
                    "px-2 py-0.5 transition-colors",
                    rehabMode === 'budget' ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Budget
                </button>
                <button
                  type="button"
                  onClick={() => { setRehabMode('spent'); setRehabOverride(totalSpent); }}
                  className={cn(
                    "px-2 py-0.5 transition-colors",
                    rehabMode === 'spent' ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Spent
                </button>
                <button
                  type="button"
                  onClick={() => setRehabMode('manual')}
                  className={cn(
                    "px-2 py-0.5 transition-colors",
                    rehabMode === 'manual' ? "bg-primary/20 text-primary font-bold" : "text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  Manual
                </button>
              </span>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="rehab-budget"
                type="number"
                value={rehabMode === 'manual' ? (rehabOverride || '') : rehabMode === 'spent' ? totalSpent : totalBudget}
                onChange={(e) => setRehabOverride(Number(e.target.value))}
                className="pl-9"
                placeholder="0"
                readOnly={rehabMode !== 'manual'}
                disabled={rehabMode !== 'manual'}
              />
            </div>
          </div>
          {rehabMode !== 'manual' && (
            <p className="text-xs text-muted-foreground pb-2">
              {rehabMode === 'budget' ? 'Auto from project budget categories' : 'Auto from total spent'}
            </p>
          )}
        </div>

        {/* Expenses */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              EXPENSES
            </h3>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="start">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground">DEFAULT PRESETS</p>
                  <div>
                    <Label className="text-xs">Vacancy %</Label>
                    <Input
                      type="number"
                      step="1"
                      value={(() => { try { return JSON.parse(localStorage.getItem('cashflow-presets') || '{}').vacancy ?? ''; } catch { return ''; } })()}
                      onChange={(e) => {
                        const presets = (() => { try { return JSON.parse(localStorage.getItem('cashflow-presets') || '{}'); } catch { return {}; } })();
                        presets.vacancy = e.target.value ? Number(e.target.value) : undefined;
                        localStorage.setItem('cashflow-presets', JSON.stringify(presets));
                      }}
                      placeholder="8"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Management %</Label>
                    <Input
                      type="number"
                      step="1"
                      value={(() => { try { return JSON.parse(localStorage.getItem('cashflow-presets') || '{}').management ?? ''; } catch { return ''; } })()}
                      onChange={(e) => {
                        const presets = (() => { try { return JSON.parse(localStorage.getItem('cashflow-presets') || '{}'); } catch { return {}; } })();
                        presets.management = e.target.value ? Number(e.target.value) : undefined;
                        localStorage.setItem('cashflow-presets', JSON.stringify(presets));
                      }}
                      placeholder="10"
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Used as defaults for new projects without saved values.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="annual-taxes" className="mb-0">Property Taxes</Label>
                <PeriodToggle value={taxPeriod} onChange={setTaxPeriod} />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annual-taxes"
                  type="number"
                  value={taxPeriod === 'year' ? (annualPropertyTaxes || '') : (annualPropertyTaxes ? Math.round(annualPropertyTaxes / 12) : '')}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAnnualPropertyTaxes(taxPeriod === 'month' ? val * 12 : val);
                  }}
                  className="pl-9"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="annual-insurance" className="mb-0">Insurance</Label>
                <PeriodToggle value={insurancePeriod} onChange={setInsurancePeriod} />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annual-insurance"
                  type="number"
                  value={insurancePeriod === 'year' ? (annualInsurance || '') : (annualInsurance ? Math.round(annualInsurance / 12) : '')}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAnnualInsurance(insurancePeriod === 'month' ? val * 12 : val);
                  }}
                  className="pl-9"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="annual-hoa" className="mb-0">HOA</Label>
                <PeriodToggle value={hoaPeriod} onChange={setHoaPeriod} />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annual-hoa"
                  type="number"
                  value={hoaPeriod === 'year' ? (annualHoa || '') : (annualHoa ? Math.round(annualHoa / 12) : '')}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAnnualHoa(hoaPeriod === 'month' ? val * 12 : val);
                  }}
                  className="pl-9"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="monthly-maintenance" className="mb-0">Maintenance</Label>
                <PeriodToggle value={maintenancePeriod} onChange={setMaintenancePeriod} />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="monthly-maintenance"
                  type="number"
                  value={maintenancePeriod === 'month' ? (monthlyMaintenance !== null && monthlyMaintenance !== undefined ? monthlyMaintenance : '') : (monthlyMaintenance ? Math.round(monthlyMaintenance * 12) : '')}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMonthlyMaintenance(maintenancePeriod === 'year' ? val / 12 : val);
                  }}
                  className="pl-9"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="vacancy-rate">Vacancy %</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vacancy-rate"
                  type="number"
                  step="1"
                  value={vacancyRate !== null && vacancyRate !== undefined ? vacancyRate : ''}
                  onChange={(e) => setVacancyRate(Number(e.target.value))}
                  className="pl-9"
                  placeholder="8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="management-rate">Management %</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="management-rate"
                  type="number"
                  step="1"
                  value={managementRate !== null && managementRate !== undefined ? managementRate : ''}
                  onChange={(e) => setManagementRate(Number(e.target.value))}
                  className="pl-9"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Refi Section - Toggleable */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              REFI / LOAN
            </h3>
            <Switch
              checked={refiEnabled}
              onCheckedChange={setRefiEnabled}
              className="scale-75"
            />
            {refiEnabled && !useManualLoan && hmLoanAmount > 0 && (
              <span className="text-xs text-muted-foreground italic">Using Loan tab</span>
            )}
            {refiEnabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  if (!useManualLoan) {
                    // Switch to manual — copy current effective values into manual fields
                    setLoanAmount(effectiveLoanAmt);
                    setInterestRate(effectiveRate);
                    setLoanTermMonths(effectiveTerm);
                    setUseManualLoan(true);
                  } else {
                    // Switch back to Loan tab
                    setUseManualLoan(false);
                  }
                }}
              >
                {useManualLoan ? (
                  <>
                    <ArrowDownToLine className="h-3 w-3" />
                    Use Loan Tab
                  </>
                ) : (
                  <>
                    <Pencil className="h-3 w-3" />
                    Manual
                  </>
                )}
              </Button>
            )}
          </div>
          <Collapsible open={refiEnabled}>
            <CollapsibleContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="loan-amount">Loan Amount (75% ARV)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="loan-amount"
                        type="number"
                        value={useManualLoan ? (loanAmount || '') : (effectiveLoanAmt || '')}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="pl-9"
                        placeholder={suggestedLoanAmount.toFixed(0)}
                        readOnly={!useManualLoan}
                        disabled={!useManualLoan}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="interest-rate"
                        type="number"
                        step="0.125"
                        value={useManualLoan ? (interestRate || '') : (effectiveRate || '')}
                        onChange={(e) => setInterestRate(Number(e.target.value))}
                        className="pl-9"
                        placeholder="7.0"
                        readOnly={!useManualLoan}
                        disabled={!useManualLoan}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="loan-term">Loan Term (months)</Label>
                    <Input
                      id="loan-term"
                      type="number"
                      value={useManualLoan ? (loanTermMonths || '') : (effectiveTerm || '')}
                      onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                      placeholder="360"
                      readOnly={!useManualLoan}
                      disabled={!useManualLoan}
                    />
                  </div>
                </div>

                {/* Refi Analysis */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center min-h-[80px]">
                    <p className="text-sm text-muted-foreground mb-1">Refi Loan Amount</p>
                    <p className="text-lg sm:text-xl font-bold font-mono truncate max-w-full">{formatCurrency(effectiveLoanAmount)}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-lg flex flex-col items-center justify-center min-h-[80px]",
                    refiCashOut >= 0 ? "bg-success/10" : "bg-warning/10"
                  )}>
                    <p className="text-sm text-muted-foreground mb-1">Cash Out at Refi</p>
                    <p className={cn(
                      "text-lg sm:text-xl font-bold font-mono truncate max-w-full",
                      refiCashOut >= 0 ? "text-success" : "text-warning"
                    )}>
                      {formatCurrency(refiCashOut)}
                    </p>
                    {refiCashOut < 0 && (
                      <p className="text-xs text-warning mt-1">money left in deal</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 flex flex-col items-center justify-center min-h-[80px]">
                    <p className="text-sm text-muted-foreground mb-1">Equity in Property</p>
                    <p className="text-lg sm:text-xl font-bold font-mono truncate max-w-full">{formatCurrency(equityInProperty)}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className={cn(
              "p-4 rounded-lg text-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
              monthlyCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10",
              expandedCard === 'monthly' && "ring-2 ring-primary/50"
            )}
            onClick={() => setExpandedCard(expandedCard === 'monthly' ? null : 'monthly')}
          >
            <p className="text-sm text-muted-foreground mb-1">Monthly Cash Flow</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
              monthlyCashFlow >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(monthlyCashFlow)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">click for breakdown</p>
          </div>
          <div
            className={cn(
              "p-4 rounded-lg text-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
              annualCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10",
              expandedCard === 'annual' && "ring-2 ring-primary/50"
            )}
            onClick={() => setExpandedCard(expandedCard === 'annual' ? null : 'annual')}
          >
            <p className="text-sm text-muted-foreground mb-1">Annual Cash Flow</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
              annualCashFlow >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(annualCashFlow)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">click for breakdown</p>
          </div>
          <div
            className={cn(
              "p-4 rounded-lg text-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/30",
              cashOnCashROI >= 0 ? "bg-primary/10" : "bg-destructive/10",
              expandedCard === 'roi' && "ring-2 ring-primary/50"
            )}
            onClick={() => setExpandedCard(expandedCard === 'roi' ? null : 'roi')}
          >
            <p className="text-sm text-muted-foreground mb-1">Cash-on-Cash ROI</p>
            <p className={cn(
              "text-2xl font-bold font-mono flex items-center justify-center gap-1",
              cashOnCashROI >= 0 ? "text-primary" : "text-destructive"
            )}>
              <TrendingUp className="h-5 w-5" />
              {cashOnCashROI.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">click for breakdown</p>
          </div>
        </div>

        {/* Breakdown Panel */}
        {expandedCard === 'monthly' && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-1 text-sm">
            <p className="font-semibold text-muted-foreground mb-2">MONTHLY CASH FLOW BREAKDOWN</p>
            <div className="flex justify-between"><span>Gross Rent</span><span className="font-mono">{formatCurrency(monthlyRent)}</span></div>
            <div className="flex justify-between text-destructive"><span>Vacancy ({vacancyRate}%)</span><span className="font-mono">-{formatCurrency(vacancyAllowance)}</span></div>
            <div className="flex justify-between font-medium border-t border-border pt-1 mt-1"><span>Effective Income</span><span className="font-mono">{formatCurrency(grossMonthlyIncome)}</span></div>
            <div className="flex justify-between text-destructive"><span>Mortgage P&I</span><span className="font-mono">-{formatCurrency(monthlyMortgage)}</span></div>
            <div className="flex justify-between text-destructive"><span>Property Taxes</span><span className="font-mono">-{formatCurrency(monthlyTaxes)}</span></div>
            <div className="flex justify-between text-destructive"><span>Insurance</span><span className="font-mono">-{formatCurrency(monthlyInsurance)}</span></div>
            <div className="flex justify-between text-destructive"><span>HOA</span><span className="font-mono">-{formatCurrency(monthlyHoa)}</span></div>
            <div className="flex justify-between text-destructive"><span>Maintenance</span><span className="font-mono">-{formatCurrency(monthlyMaintenance)}</span></div>
            <div className="flex justify-between text-destructive"><span>Management ({managementRate}%)</span><span className="font-mono">-{formatCurrency(managementFee)}</span></div>
            <div className={cn("flex justify-between font-bold border-t border-border pt-2 mt-2", monthlyCashFlow >= 0 ? "text-success" : "text-destructive")}>
              <span>Monthly Cash Flow</span><span className="font-mono">{formatCurrency(monthlyCashFlow)}</span>
            </div>
          </div>
        )}

        {expandedCard === 'annual' && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-1 text-sm">
            <p className="font-semibold text-muted-foreground mb-2">ANNUAL CASH FLOW BREAKDOWN</p>
            <div className="flex justify-between"><span>Gross Rent (x12)</span><span className="font-mono">{formatCurrency(monthlyRent * 12)}</span></div>
            <div className="flex justify-between text-destructive"><span>Vacancy ({vacancyRate}%)</span><span className="font-mono">-{formatCurrency(vacancyAllowance * 12)}</span></div>
            <div className="flex justify-between font-medium border-t border-border pt-1 mt-1"><span>Effective Income</span><span className="font-mono">{formatCurrency(grossMonthlyIncome * 12)}</span></div>
            <div className="flex justify-between text-destructive"><span>Mortgage P&I</span><span className="font-mono">-{formatCurrency(monthlyMortgage * 12)}</span></div>
            <div className="flex justify-between text-destructive"><span>Property Taxes</span><span className="font-mono">-{formatCurrency(annualPropertyTaxes)}</span></div>
            <div className="flex justify-between text-destructive"><span>Insurance</span><span className="font-mono">-{formatCurrency(annualInsurance)}</span></div>
            <div className="flex justify-between text-destructive"><span>HOA</span><span className="font-mono">-{formatCurrency(annualHoa)}</span></div>
            <div className="flex justify-between text-destructive"><span>Maintenance</span><span className="font-mono">-{formatCurrency(monthlyMaintenance * 12)}</span></div>
            <div className="flex justify-between text-destructive"><span>Management ({managementRate}%)</span><span className="font-mono">-{formatCurrency(managementFee * 12)}</span></div>
            <div className={cn("flex justify-between font-bold border-t border-border pt-2 mt-2", annualCashFlow >= 0 ? "text-success" : "text-destructive")}>
              <span>Annual Cash Flow</span><span className="font-mono">{formatCurrency(annualCashFlow)}</span>
            </div>
          </div>
        )}

        {expandedCard === 'roi' && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-1 text-sm">
            <p className="font-semibold text-muted-foreground mb-2">CASH-ON-CASH ROI BREAKDOWN</p>
            <div className="flex justify-between"><span>Annual Cash Flow</span><span className="font-mono">{formatCurrency(annualCashFlow)}</span></div>
            <div className="flex justify-between border-t border-border pt-1 mt-1"><span>Purchase Price</span><span className="font-mono">{formatCurrency(purchasePrice)}</span></div>
            <div className="flex justify-between"><span>Construction Budget</span><span className="font-mono">{formatCurrency(activeRehabBudget)}</span></div>
            <div className="flex justify-between font-medium"><span>Total Investment</span><span className="font-mono">{formatCurrency(totalInvestment)}</span></div>
            {effectiveLoanAmount > 0 ? (
              <div className="flex justify-between text-destructive"><span>Refi Loan Amount</span><span className="font-mono">-{formatCurrency(effectiveLoanAmount)}</span></div>
            ) : (
              <div className="flex justify-between text-muted-foreground"><span>No Loan (All Cash)</span><span className="font-mono">—</span></div>
            )}
            <div className="flex justify-between font-medium border-t border-border pt-1 mt-1"><span>Cash Left in Deal</span><span className="font-mono">{formatCurrency(Math.max(0, cashInvested))}</span></div>
            <div className={cn("flex justify-between font-bold border-t border-border pt-2 mt-2", cashOnCashROI >= 0 ? "text-primary" : "text-destructive")}>
              <span>Cash-on-Cash ROI</span><span className="font-mono">{cashOnCashROI.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Annual Cash Flow ÷ Cash Left in Deal = ROI</p>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Monthly P&I</p>
              <p className="font-mono font-medium">{formatCurrency(monthlyMortgage)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Monthly Expenses</p>
              <p className="font-mono font-medium">{formatCurrency(totalMonthlyExpenses)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Investment</p>
              <p className="font-mono font-medium">{formatCurrency(totalInvestment)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cash Left in Deal</p>
              <p className="font-mono font-medium">{formatCurrency(Math.max(0, cashInvested))}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
