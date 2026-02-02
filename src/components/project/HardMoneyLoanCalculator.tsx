import { useState, useEffect, useMemo } from 'react';
import { Landmark, DollarSign, Percent, Save, Loader2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HardMoneyLoanCalculatorProps {
  projectId: string;
  purchasePrice: number;
  totalBudget: number;
  arv: number;
  initialLoanAmount?: number;
  initialInterestRate?: number;
  initialLoanTermMonths?: number;
  initialPoints?: number;
  initialClosingCosts?: number;
  initialInterestOnly?: boolean;
}

export function HardMoneyLoanCalculator({
  projectId,
  purchasePrice,
  totalBudget,
  arv,
  initialLoanAmount,
  initialInterestRate = 12,
  initialLoanTermMonths = 6,
  initialPoints = 3,
  initialClosingCosts = 0,
  initialInterestOnly = true,
}: HardMoneyLoanCalculatorProps) {
  // Default loan amount to 75% of purchase price if not set
  const defaultLoanAmount = initialLoanAmount || (purchasePrice * 0.75);
  
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTermMonths, setLoanTermMonths] = useState(initialLoanTermMonths);
  const [points, setPoints] = useState(initialPoints);
  const [closingCosts, setClosingCosts] = useState(initialClosingCosts);
  const [interestOnly, setInterestOnly] = useState(initialInterestOnly);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoanAmount(initialLoanAmount || (purchasePrice * 0.75));
    setInterestRate(initialInterestRate);
    setLoanTermMonths(initialLoanTermMonths);
    setPoints(initialPoints);
    setClosingCosts(initialClosingCosts);
    setInterestOnly(initialInterestOnly);
  }, [initialLoanAmount, initialInterestRate, initialLoanTermMonths, initialPoints, initialClosingCosts, initialInterestOnly, purchasePrice]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({
        hm_loan_amount: loanAmount,
        hm_interest_rate: interestRate,
        hm_loan_term_months: loanTermMonths,
        hm_points: points,
        hm_closing_costs: closingCosts,
        hm_interest_only: interestOnly,
      })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to save loan details');
      console.error(error);
    } else {
      toast.success('Loan details saved');
    }
    setSaving(false);
  };

  // Calculations
  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    
    // Monthly Payment
    let monthlyPayment: number;
    let totalInterest: number;
    
    if (interestOnly) {
      monthlyPayment = (loanAmount * (interestRate / 100)) / 12;
      totalInterest = monthlyPayment * loanTermMonths;
    } else {
      // Amortizing payment formula
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
    
    // Points cost
    const pointsCost = loanAmount * (points / 100);
    
    // Total loan cost
    const totalLoanCost = totalInterest + pointsCost + closingCosts;
    
    // Effective APR (annualized cost including all fees)
    const termYears = loanTermMonths / 12;
    const effectiveAPR = termYears > 0 ? ((totalLoanCost / loanAmount) / termYears) * 100 : 0;
    
    return {
      monthlyPayment,
      totalInterest,
      pointsCost,
      totalLoanCost,
      effectiveAPR,
    };
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, interestOnly]);

  // Rate sensitivity analysis
  const rateSensitivity = useMemo(() => {
    const sellingCosts = arv * 0.06; // 6% selling costs
    
    return [0, 1, 2].map(bump => {
      const adjustedRate = interestRate + bump;
      const monthlyInt = (loanAmount * (adjustedRate / 100)) / 12;
      const adjustedInterest = monthlyInt * loanTermMonths;
      const pointsCost = loanAmount * (points / 100);
      const adjustedProfit = arv - purchasePrice - totalBudget - adjustedInterest - pointsCost - closingCosts - sellingCosts;
      
      return { 
        rate: adjustedRate, 
        interest: adjustedInterest, 
        profit: adjustedProfit 
      };
    });
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, arv, purchasePrice, totalBudget]);

  // Payoff timeline comparison
  const payoffComparison = useMemo(() => {
    const monthlyInt = (loanAmount * (interestRate / 100)) / 12;
    const baseMonths = [4, 6];
    if (!baseMonths.includes(loanTermMonths)) {
      baseMonths.push(loanTermMonths);
    }
    baseMonths.sort((a, b) => a - b);
    
    return baseMonths.map(months => ({
      months,
      interest: monthlyInt * months,
      savings: months < loanTermMonths ? (loanTermMonths - months) * monthlyInt : 0,
    }));
  }, [loanAmount, interestRate, loanTermMonths]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const loanToValue = purchasePrice > 0 ? ((loanAmount / purchasePrice) * 100) : 0;

  const termOptions = [6, 12, 18];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          Hard Money Loan Calculator
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
                max={purchasePrice > 0 ? purchasePrice : 500000}
                step={1000}
                className="mt-2"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="interest-rate">Annual Interest Rate</Label>
                <span className="text-sm font-mono text-primary">{interestRate.toFixed(1)}%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={([val]) => setInterestRate(val)}
                min={2}
                max={15}
                step={0.25}
              />
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="interest-rate"
                  type="number"
                  value={interestRate || ''}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="rounded-sm"
                  step={0.25}
                  min={0}
                  max={30}
                />
              </div>
            </div>

            {/* Loan Term */}
            <div className="space-y-2">
              <Label>Loan Term (Months)</Label>
              <div className="flex gap-2">
                {termOptions.map((term) => (
                  <Button
                    key={term}
                    type="button"
                    variant={loanTermMonths === term ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoanTermMonths(term)}
                    className="flex-1 rounded-sm"
                  >
                    {term}
                  </Button>
                ))}
                <Input
                  type="number"
                  value={loanTermMonths}
                  onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                  className="w-20 rounded-sm"
                  min={1}
                  max={36}
                />
              </div>
            </div>

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
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-sm bg-primary/10 border border-primary/30 text-center">
                <p className="text-xs text-muted-foreground mb-1">Monthly Payment</p>
                <p className="text-lg font-bold font-mono text-primary">
                  {formatCurrency(calculations.monthlyPayment)}
                </p>
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
                  {calculations.effectiveAPR.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Total Loan Cost Breakdown */}
            <div className="p-4 rounded-sm bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Total Loan Cost</span>
                <span className="text-xl font-bold font-mono text-foreground">
                  {formatCurrency(calculations.totalLoanCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                      row.months === loanTermMonths 
                        ? "bg-muted/50 border-border" 
                        : "bg-success/5 border-success/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        If sold at <span className="font-mono font-medium">{row.months} mo</span>:
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono">{formatCurrency(row.interest)} int</span>
                      {row.savings > 0 && (
                        <span className="text-success font-mono flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          Save {formatCurrency(row.savings)}
                        </span>
                      )}
                    </div>
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
