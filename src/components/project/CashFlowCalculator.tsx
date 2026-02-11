import { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, Save, Loader2, Home, Percent, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}: CashFlowCalculatorProps) {
  const [purchasePrice, setPurchasePrice] = useState(initialPurchasePrice);
  const [arv, setArv] = useState(initialArv);
  const [monthlyRent, setMonthlyRent] = useState(initialMonthlyRent);
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTermYears, setLoanTermYears] = useState(initialLoanTermYears);
  const [annualPropertyTaxes, setAnnualPropertyTaxes] = useState(initialAnnualPropertyTaxes);
  const [annualInsurance, setAnnualInsurance] = useState(initialAnnualInsurance);
  const [annualHoa, setAnnualHoa] = useState(initialAnnualHoa);
  const [vacancyRate, setVacancyRate] = useState(initialVacancyRate);
  const [monthlyMaintenance, setMonthlyMaintenance] = useState(initialMonthlyMaintenance);
  const [managementRate, setManagementRate] = useState(initialManagementRate);
  const [saving, setSaving] = useState(false);
  const [taxPeriod, setTaxPeriod] = useState<'month' | 'year'>('year');
  const [hoaPeriod, setHoaPeriod] = useState<'month' | 'year'>('year');

  useEffect(() => {
    setPurchasePrice(initialPurchasePrice);
    setArv(initialArv);
    setMonthlyRent(initialMonthlyRent);
    setLoanAmount(initialLoanAmount);
    setInterestRate(initialInterestRate);
    setLoanTermYears(initialLoanTermYears);
    setAnnualPropertyTaxes(initialAnnualPropertyTaxes);
    setAnnualInsurance(initialAnnualInsurance);
    setAnnualHoa(initialAnnualHoa);
    setVacancyRate(initialVacancyRate);
    setMonthlyMaintenance(initialMonthlyMaintenance);
    setManagementRate(initialManagementRate);
  }, [
    initialPurchasePrice, initialArv, initialMonthlyRent, initialLoanAmount,
    initialInterestRate, initialLoanTermYears, initialAnnualPropertyTaxes,
    initialAnnualInsurance, initialAnnualHoa, initialVacancyRate, initialMonthlyMaintenance,
    initialManagementRate
  ]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        purchase_price: purchasePrice,
        arv: arv,
        monthly_rent: monthlyRent,
        loan_amount: loanAmount,
        interest_rate: interestRate,
        loan_term_years: loanTermYears,
        annual_property_taxes: annualPropertyTaxes,
        annual_insurance: annualInsurance,
        annual_hoa: annualHoa,
        vacancy_rate: vacancyRate,
        monthly_maintenance: monthlyMaintenance,
        management_rate: managementRate,
      })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save');
      console.error(error);
    } else {
      toast.success('Saved');
    }
    setSaving(false);
  };

  // Auto-calculate loan amount as 75% of ARV if not set
  const suggestedLoanAmount = arv * 0.75;
  const effectiveLoanAmount = loanAmount > 0 ? loanAmount : suggestedLoanAmount;

  // Monthly mortgage payment (P&I) using amortization formula
  const monthlyInterestRate = (interestRate / 100) / 12;
  const numberOfPayments = loanTermYears * 12;
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

  // Cash invested = Purchase + Rehab - Loan Amount (money left in deal after refi)
  const totalInvestment = purchasePrice + totalSpent;
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

        {/* Refi Details */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            REFI DETAILS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="loan-amount">Loan Amount (75% ARV)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="loan-amount"
                  type="number"
                  value={loanAmount || ''}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="pl-9"
                  placeholder={suggestedLoanAmount.toFixed(0)}
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
                  value={interestRate || ''}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="pl-9"
                  placeholder="7.0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="loan-term">Loan Term (years)</Label>
              <Input
                id="loan-term"
                type="number"
                value={loanTermYears || ''}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            EXPENSES
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="annual-taxes" className="mb-0">Property Taxes</Label>
                <button
                  type="button"
                  onClick={() => setTaxPeriod(p => p === 'year' ? 'month' : 'year')}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {taxPeriod === 'year' ? '/yr' : '/mo'}
                </button>
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
              <Label htmlFor="annual-insurance">Insurance/yr</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="annual-insurance"
                  type="number"
                  value={annualInsurance || ''}
                  onChange={(e) => setAnnualInsurance(Number(e.target.value))}
                  className="pl-9"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Label htmlFor="annual-hoa" className="mb-0">HOA</Label>
                <button
                  type="button"
                  onClick={() => setHoaPeriod(p => p === 'year' ? 'month' : 'year')}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {hoaPeriod === 'year' ? '/yr' : '/mo'}
                </button>
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
              <Label htmlFor="vacancy-rate">Vacancy %</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vacancy-rate"
                  type="number"
                  step="1"
                  value={vacancyRate || ''}
                  onChange={(e) => setVacancyRate(Number(e.target.value))}
                  className="pl-9"
                  placeholder="8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="monthly-maintenance">Maintenance/mo</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="monthly-maintenance"
                  type="number"
                  value={monthlyMaintenance || ''}
                  onChange={(e) => setMonthlyMaintenance(Number(e.target.value))}
                  className="pl-9"
                  placeholder="0"
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
                  value={managementRate || ''}
                  onChange={(e) => setManagementRate(Number(e.target.value))}
                  className="pl-9"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-3 gap-4">
          <div className={cn(
            "p-4 rounded-lg text-center",
            monthlyCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            <p className="text-sm text-muted-foreground mb-1">Monthly Cash Flow</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
              monthlyCashFlow >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(monthlyCashFlow)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">after all expenses</p>
          </div>
          <div className={cn(
            "p-4 rounded-lg text-center",
            annualCashFlow >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            <p className="text-sm text-muted-foreground mb-1">Annual Cash Flow</p>
            <p className={cn(
              "text-2xl font-bold font-mono",
              annualCashFlow >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(annualCashFlow)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per year</p>
          </div>
          <div className={cn(
            "p-4 rounded-lg text-center",
            cashOnCashROI >= 0 ? "bg-primary/10" : "bg-destructive/10"
          )}>
            <p className="text-sm text-muted-foreground mb-1">Cash-on-Cash ROI</p>
            <p className={cn(
              "text-2xl font-bold font-mono flex items-center justify-center gap-1",
              cashOnCashROI >= 0 ? "text-primary" : "text-destructive"
            )}>
              <TrendingUp className="h-5 w-5" />
              {cashOnCashROI.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">return on cash invested</p>
          </div>
        </div>

        {/* Refi Analysis */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">REFI ANALYSIS</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Refi Loan Amount</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(effectiveLoanAmount)}</p>
            </div>
            <div className={cn(
              "p-4 rounded-lg text-center",
              refiCashOut >= 0 ? "bg-success/10" : "bg-warning/10"
            )}>
              <p className="text-sm text-muted-foreground mb-1">Cash Out at Refi</p>
              <p className={cn(
                "text-xl font-bold font-mono",
                refiCashOut >= 0 ? "text-success" : "text-warning"
              )}>
                {formatCurrency(refiCashOut)}
              </p>
              {refiCashOut < 0 && (
                <p className="text-xs text-warning mt-1">money left in deal</p>
              )}
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground mb-1">Equity in Property</p>
              <p className="text-xl font-bold font-mono">{formatCurrency(equityInProperty)}</p>
            </div>
          </div>
        </div>

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
