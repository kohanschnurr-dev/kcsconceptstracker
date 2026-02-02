import { useState, useEffect, useMemo } from 'react';
import { Landmark, DollarSign, Percent, Save, Loader2, TrendingUp, TrendingDown, Clock, Package, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LoanPreset {
  id?: string;
  name: string;
  interestRate: number;
  loanTermMonths: number;
  points: number;
  closingCostsPercent: number;
  interestOnly: boolean;
  isBuiltIn?: boolean;
}

const BUILT_IN_PRESETS: LoanPreset[] = [
  { name: 'Standard Hard Money', interestRate: 12, loanTermMonths: 6, points: 3, closingCostsPercent: 2, interestOnly: true, isBuiltIn: true },
  { name: 'Competitive Rate', interestRate: 10, loanTermMonths: 12, points: 2, closingCostsPercent: 2, interestOnly: true, isBuiltIn: true },
  { name: 'Extended Term', interestRate: 11, loanTermMonths: 18, points: 2.5, closingCostsPercent: 2, interestOnly: true, isBuiltIn: true },
  { name: 'Conventional 30yr', interestRate: 7, loanTermMonths: 360, points: 1, closingCostsPercent: 2, interestOnly: false, isBuiltIn: true },
];

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
  // Editable purchase price for testing scenarios
  const [editablePurchasePrice, setEditablePurchasePrice] = useState(purchasePrice);
  
  // Default loan amount to 75% of purchase price if not set
  const defaultLoanAmount = initialLoanAmount || (editablePurchasePrice * 0.75);
  const defaultClosingCosts = initialClosingCosts ?? (editablePurchasePrice * 0.02);
  
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount);
  const [interestRate, setInterestRate] = useState(initialInterestRate);
  const [loanTermMonths, setLoanTermMonths] = useState(initialLoanTermMonths);
  const [points, setPoints] = useState(initialPoints);
  const [closingCosts, setClosingCosts] = useState(defaultClosingCosts);
  const [interestOnly, setInterestOnly] = useState(initialInterestOnly);
  const [saving, setSaving] = useState(false);

  // Preset management
  const [userPresets, setUserPresets] = useState<LoanPreset[]>([]);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

  // Custom term popover
  const [customTermOpen, setCustomTermOpen] = useState(false);
  const [customTermInput, setCustomTermInput] = useState('');

  // Sync editable purchase price with prop
  useEffect(() => {
    setEditablePurchasePrice(purchasePrice);
  }, [purchasePrice]);

  useEffect(() => {
    setLoanAmount(initialLoanAmount || (editablePurchasePrice * 0.75));
    setInterestRate(initialInterestRate);
    setLoanTermMonths(initialLoanTermMonths);
    setPoints(initialPoints);
    setClosingCosts(initialClosingCosts ?? (editablePurchasePrice * 0.02));
    setInterestOnly(initialInterestOnly);
  }, [initialLoanAmount, initialInterestRate, initialLoanTermMonths, initialPoints, initialClosingCosts, initialInterestOnly, editablePurchasePrice]);

  // Fetch user presets
  useEffect(() => {
    const fetchPresets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('loan_presets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching presets:', error);
        return;
      }

      if (data) {
        setUserPresets(data.map(p => ({
          id: p.id,
          name: p.name,
          interestRate: Number(p.interest_rate),
          loanTermMonths: p.loan_term_months,
          points: Number(p.points),
          closingCostsPercent: Number(p.closing_costs_percent),
          interestOnly: p.interest_only,
        })));
      }
    };

    fetchPresets();
  }, []);

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

  const loadPreset = (preset: LoanPreset) => {
    setInterestRate(preset.interestRate);
    setLoanTermMonths(preset.loanTermMonths);
    setPoints(preset.points);
    setClosingCosts(editablePurchasePrice * (preset.closingCostsPercent / 100));
    setInterestOnly(preset.interestOnly);
    toast.success(`Loaded "${preset.name}" preset`);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    setSavingPreset(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please log in to save presets');
      setSavingPreset(false);
      return;
    }

    const closingCostsPercent = editablePurchasePrice > 0 
      ? (closingCosts / editablePurchasePrice) * 100 
      : 2;

    const { data, error } = await supabase
      .from('loan_presets')
      .insert({
        user_id: user.id,
        name: presetName.trim(),
        interest_rate: interestRate,
        loan_term_months: loanTermMonths,
        points: points,
        closing_costs_percent: closingCostsPercent,
        interest_only: interestOnly,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to save preset');
      console.error(error);
    } else if (data) {
      setUserPresets(prev => [...prev, {
        id: data.id,
        name: data.name,
        interestRate: Number(data.interest_rate),
        loanTermMonths: data.loan_term_months,
        points: Number(data.points),
        closingCostsPercent: Number(data.closing_costs_percent),
        interestOnly: data.interest_only,
      }]);
      toast.success(`Preset "${presetName}" saved`);
      setPresetName('');
      setSavePresetOpen(false);
    }
    setSavingPreset(false);
  };

  const allPresets = [...BUILT_IN_PRESETS, ...userPresets];

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
      const adjustedProfit = arv - editablePurchasePrice - totalBudget - adjustedInterest - pointsCost - closingCosts - sellingCosts;
      
      return { 
        rate: adjustedRate, 
        interest: adjustedInterest, 
        profit: adjustedProfit 
      };
    });
  }, [loanAmount, interestRate, loanTermMonths, points, closingCosts, arv, editablePurchasePrice, totalBudget]);

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const loanToValue = editablePurchasePrice > 0 ? ((loanAmount / editablePurchasePrice) * 100) : 0;

  const termOptions = [6, 12, 18, 360];

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            Loan Calculator
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => {
              const preset = allPresets.find(p => p.name === value);
              if (preset) loadPreset(preset);
            }}>
              <SelectTrigger className="w-[180px]">
                <Package className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Load Preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__header_builtin" disabled className="font-semibold text-muted-foreground">
                  Built-in Presets
                </SelectItem>
                {BUILT_IN_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
                {userPresets.length > 0 && (
                  <>
                    <SelectItem value="__header_custom" disabled className="font-semibold text-muted-foreground mt-2">
                      My Presets
                    </SelectItem>
                    {userPresets.map((preset) => (
                      <SelectItem key={preset.id || preset.name} value={preset.name}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setSavePresetOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Save Preset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
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

              {/* Interest Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="interest-rate">Annual Interest Rate</Label>
                  <span className="text-sm font-mono text-primary">{interestRate.toFixed(2)}%</span>
                </div>
                <Slider
                  value={[interestRate]}
                  onValueChange={([val]) => setInterestRate(val)}
                  min={2}
                  max={15}
                  step={0.01}
                />
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="interest-rate"
                    type="number"
                    value={interestRate || ''}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="rounded-sm"
                    step={0.01}
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
                      {term === 360 ? '30yr' : term}
                    </Button>
                  ))}
                  <Popover open={customTermOpen} onOpenChange={setCustomTermOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={!termOptions.includes(loanTermMonths) ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-sm"
                      >
                        {!termOptions.includes(loanTermMonths) ? loanTermMonths : 'Custom'}
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
                            placeholder="e.g. 9"
                            min={1}
                            max={360}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = Number(customTermInput);
                                if (val > 0 && val <= 360) {
                                  setLoanTermMonths(val);
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
                              const val = Number(customTermInput);
                              if (val > 0 && val <= 360) {
                                setLoanTermMonths(val);
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
                    {calculations.effectiveAPR.toFixed(2)}%
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

      {/* Save Preset Dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Loan Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., My Lender Standard Terms"
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Interest Rate:</strong> {interestRate}%</p>
              <p><strong>Term:</strong> {loanTermMonths} months</p>
              <p><strong>Points:</strong> {points}%</p>
              <p><strong>Type:</strong> {interestOnly ? 'Interest Only' : 'Amortizing'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePreset} disabled={savingPreset}>
              {savingPreset ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
