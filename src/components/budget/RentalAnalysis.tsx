import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RentalFieldValues } from '@/components/budget/RentalFields';

interface RentalAnalysisProps {
  purchasePrice: number;
  arv: number;
  totalBudget: number;
  rentalFields: RentalFieldValues;
  formatCurrency: (value: number) => string;
  closingCostsBuy: number;
  holdingCosts: number;
  closingCostsSell: number;
}

export function RentalAnalysis({ purchasePrice, arv, totalBudget, rentalFields, formatCurrency, closingCostsBuy, holdingCosts, closingCostsSell }: RentalAnalysisProps) {
  const monthlyRent = parseFloat(rentalFields.monthlyRent) || 0;
  const vacancyRate = (parseFloat(rentalFields.vacancyRate) || 5) / 100;
  const annualTaxes = parseFloat(rentalFields.annualTaxes) || 0;
  const annualInsurance = parseFloat(rentalFields.annualInsurance) || 0;
  const annualHoa = parseFloat(rentalFields.annualHoa) || 0;
  const monthlyMaintenance = parseFloat(rentalFields.monthlyMaintenance) || 0;
  const managementRate = (parseFloat(rentalFields.managementRate) || 0) / 100;

  const refiLoanAmount = rentalFields.refiEnabled ? (parseFloat(rentalFields.refiLoanAmount) || 0) : 0;
  const refiRate = (parseFloat(rentalFields.refiRate) || 7) / 100;
  const refiTerm = (parseFloat(rentalFields.refiTerm) || 30) * 12; // months

  // Calculations
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate);
  const grossAnnualIncome = effectiveMonthlyRent * 12;

  const managementFeeMonthly = effectiveMonthlyRent * managementRate;
  const monthlyOpex = (annualTaxes + annualInsurance + annualHoa) / 12 + monthlyMaintenance + managementFeeMonthly;
  const annualOpex = monthlyOpex * 12;
  const noi = grossAnnualIncome - annualOpex;

  const totalCostBasis = purchasePrice + totalBudget;
  const capRate = totalCostBasis > 0 ? (noi / totalCostBasis) * 100 : 0;

  // Mortgage P&I (amortizing)
  const monthlyRate = refiRate / 12;
  let monthlyPI = 0;
  if (refiLoanAmount > 0 && monthlyRate > 0 && refiTerm > 0) {
    monthlyPI = refiLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, refiTerm)) / (Math.pow(1 + monthlyRate, refiTerm) - 1);
  }

  const monthlyCashFlow = effectiveMonthlyRent - monthlyOpex - monthlyPI;
  const annualCashFlow = monthlyCashFlow * 12;

  // Points cost
  const refiPointsVal = parseFloat(rentalFields.refiPoints) || 0;
  const refiPointsCost = rentalFields.refiPointsMode === 'pct'
    ? Math.round(refiLoanAmount * (refiPointsVal / 100))
    : refiPointsVal;

  const totalCashInvested = rentalFields.refiEnabled
    ? Math.max(0, totalCostBasis + refiPointsCost - refiLoanAmount)
    : totalCostBasis;
  const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

  // Equity Gain (mirrors Fix & Flip profit formula)
  const equityGain = arv - purchasePrice - totalBudget - closingCostsBuy - holdingCosts - closingCostsSell;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Analysis</CardTitle>
        <CardDescription>Rental income projections based on deal parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Income */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Income</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Gross Monthly Rent</span>
                <span className="font-mono">{formatCurrency(monthlyRent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Vacancy ({(vacancyRate * 100).toFixed(0)}%)</span>
                <span className="font-mono text-destructive">-{formatCurrency(monthlyRent * vacancyRate)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Effective Rent</span>
                <span className="font-mono">{formatCurrency(effectiveMonthlyRent)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Monthly Expenses</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Operating Expenses</span>
                <span className="font-mono">{formatCurrency(monthlyOpex)}</span>
              </div>
              {refiLoanAmount > 0 && (
                <div className="flex justify-between">
                  <span>Mortgage P&I</span>
                  <span className="font-mono">{formatCurrency(monthlyPI)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Cash Flow</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monthly</span>
                <span className={`font-mono font-medium ${monthlyCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(monthlyCashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Annual</span>
                <span className={`font-mono font-medium ${annualCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(annualCashFlow)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>NOI</span>
                <span className="font-mono">{formatCurrency(noi)}</span>
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cap Rate</span>
                <span className={`font-mono font-medium ${capRate >= 6 ? 'text-green-500' : capRate >= 4 ? 'text-amber-500' : 'text-destructive'}`}>
                  {capRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash-on-Cash</span>
                <span className={`font-mono font-medium ${cashOnCash >= 8 ? 'text-green-500' : cashOnCash >= 4 ? 'text-amber-500' : 'text-destructive'}`}>
                  {cashOnCash.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash Invested</span>
                <span className="font-mono">{formatCurrency(totalCashInvested)}</span>
              </div>
              <div className="flex justify-between">
                <span>Equity Gain</span>
                <span className={`font-mono font-medium ${equityGain >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(equityGain)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className={`p-4 rounded-lg text-center ${monthlyCashFlow >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
            <p className="text-sm text-muted-foreground">Monthly Cash Flow</p>
            <p className={`text-2xl font-bold font-mono ${monthlyCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {formatCurrency(monthlyCashFlow)}
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center ${capRate >= 6 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
            <p className="text-sm text-muted-foreground">Cap Rate</p>
            <p className={`text-2xl font-bold font-mono ${capRate >= 6 ? 'text-green-500' : 'text-amber-500'}`}>
              {capRate.toFixed(1)}%
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center ${cashOnCash >= 8 ? 'bg-green-500/10' : cashOnCash >= 4 ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
            <p className="text-sm text-muted-foreground">Cash-on-Cash Return</p>
            <p className={`text-2xl font-bold font-mono ${cashOnCash >= 8 ? 'text-green-500' : cashOnCash >= 4 ? 'text-amber-500' : 'text-destructive'}`}>
              {cashOnCash.toFixed(1)}%
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center ${equityGain >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
            <p className="text-sm text-muted-foreground">Equity Gain</p>
            <p className={`text-2xl font-bold font-mono ${equityGain >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {formatCurrency(equityGain)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
