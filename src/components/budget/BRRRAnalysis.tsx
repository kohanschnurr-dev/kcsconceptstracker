import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RentalFieldValues } from '@/components/budget/RentalFields';

interface BRRRAnalysisProps {
  purchasePrice: number;
  arv: number;
  totalBudget: number;
  closingCostsBuy: number;
  holdingCosts: number;
  rentalFields: RentalFieldValues;
  formatCurrency: (value: number) => string;
}

export function BRRRAnalysis({ purchasePrice, arv, totalBudget, closingCostsBuy, holdingCosts, rentalFields, formatCurrency }: BRRRAnalysisProps) {
  const monthlyRent = parseFloat(rentalFields.monthlyRent) || 0;
  const vacancyRate = (parseFloat(rentalFields.vacancyRate) || 5) / 100;
  const annualTaxes = parseFloat(rentalFields.annualTaxes) || 0;
  const annualInsurance = parseFloat(rentalFields.annualInsurance) || 0;
  const annualHoa = parseFloat(rentalFields.annualHoa) || 0;
  const monthlyMaintenance = parseFloat(rentalFields.monthlyMaintenance) || 0;
  const managementRate = (parseFloat(rentalFields.managementRate) || 0) / 100;

  const refiLoanAmount = rentalFields.refiEnabled ? (parseFloat(rentalFields.refiLoanAmount) || 0) : 0;
  const refiRate = (parseFloat(rentalFields.refiRate) || 7) / 100;
  const refiTerm = (parseFloat(rentalFields.refiTerm) || 30) * 12;

  // Points cost
  const refiPointsVal = parseFloat(rentalFields.refiPoints) || 0;
  const refiPointsCost = rentalFields.refiPointsMode === 'pct'
    ? Math.round(refiLoanAmount * (refiPointsVal / 100))
    : refiPointsVal;

  // BRRR-specific
  const totalAcquisitionCost = purchasePrice + totalBudget + closingCostsBuy + holdingCosts + refiPointsCost;
  const equityCaptured = arv - refiLoanAmount;
  const moneyLeftInDeal = Math.max(0, totalAcquisitionCost - refiLoanAmount);

  // Cash flow
  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate);
  const managementFeeMonthly = effectiveMonthlyRent * managementRate;
  const monthlyOpex = (annualTaxes + annualInsurance + annualHoa) / 12 + monthlyMaintenance + managementFeeMonthly;

  const monthlyRate = refiRate / 12;
  let monthlyPI = 0;
  if (refiLoanAmount > 0 && monthlyRate > 0 && refiTerm > 0) {
    monthlyPI = refiLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, refiTerm)) / (Math.pow(1 + monthlyRate, refiTerm) - 1);
  }

  const monthlyCashFlow = effectiveMonthlyRent - monthlyOpex - monthlyPI;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashOnCash = moneyLeftInDeal > 0 ? (annualCashFlow / moneyLeftInDeal) * 100 : 0;

  const annualOpex = monthlyOpex * 12;
  const grossAnnualIncome = effectiveMonthlyRent * 12;
  const noi = grossAnnualIncome - annualOpex;
  const capRate = totalAcquisitionCost > 0 ? (noi / totalAcquisitionCost) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>BRRR Analysis</CardTitle>
        <CardDescription>Rehab equity capture + post-refinance cash flow projections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Acquisition */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Acquisition</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Purchase</span>
                <span className="font-mono">{formatCurrency(purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Rehab</span>
                <span className="font-mono">{formatCurrency(totalBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span>Closing + Holding</span>
                <span className="font-mono">{formatCurrency(closingCostsBuy + holdingCosts)}</span>
              </div>
              {refiPointsCost > 0 && (
                <div className="flex justify-between">
                  <span>Points</span>
                  <span className="font-mono">{formatCurrency(refiPointsCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Total All-In</span>
                <span className="font-mono">{formatCurrency(totalAcquisitionCost)}</span>
              </div>
            </div>
          </div>

          {/* Refinance */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Refinance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ARV</span>
                <span className="font-mono">{formatCurrency(arv)}</span>
              </div>
              <div className="flex justify-between">
                <span>Refi Loan</span>
                <span className="font-mono">{formatCurrency(refiLoanAmount)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Equity Captured</span>
                <span className={`font-mono ${equityCaptured >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(equityCaptured)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Money Left In</span>
                <span className={`font-mono ${moneyLeftInDeal <= 0 ? 'text-green-500' : 'text-amber-500'}`}>
                  {formatCurrency(moneyLeftInDeal)}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Cash Flow</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Eff. Rent/mo</span>
                <span className="font-mono">{formatCurrency(effectiveMonthlyRent)}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses/mo</span>
                <span className="font-mono">-{formatCurrency(monthlyOpex)}</span>
              </div>
              {monthlyPI > 0 && (
                <div className="flex justify-between">
                  <span>Mortgage P&I</span>
                  <span className="font-mono">-{formatCurrency(monthlyPI)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Monthly CF</span>
                <span className={`font-mono ${monthlyCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(monthlyCashFlow)}
                </span>
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cap Rate</span>
                <span className={`font-mono font-medium ${capRate >= 6 ? 'text-green-500' : 'text-amber-500'}`}>
                  {capRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cash-on-Cash</span>
                <span className={`font-mono font-medium ${cashOnCash >= 8 ? 'text-green-500' : cashOnCash >= 4 ? 'text-amber-500' : 'text-destructive'}`}>
                  {moneyLeftInDeal <= 0 ? '∞' : `${cashOnCash.toFixed(1)}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Annual CF</span>
                <span className={`font-mono font-medium ${annualCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                  {formatCurrency(annualCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className={`p-4 rounded-lg text-center ${moneyLeftInDeal <= 0 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
            <p className="text-sm text-muted-foreground">Money Left In</p>
            <p className={`text-xl font-bold font-mono ${moneyLeftInDeal <= 0 ? 'text-green-500' : 'text-amber-500'}`}>
              {formatCurrency(moneyLeftInDeal)}
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center ${monthlyCashFlow >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
            <p className="text-sm text-muted-foreground">Monthly Cash Flow</p>
            <p className={`text-xl font-bold font-mono ${monthlyCashFlow >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              {formatCurrency(monthlyCashFlow)}
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center ${capRate >= 6 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
            <p className="text-sm text-muted-foreground">Cap Rate</p>
            <p className={`text-xl font-bold font-mono ${capRate >= 6 ? 'text-green-500' : 'text-amber-500'}`}>
              {capRate.toFixed(1)}%
            </p>
          </div>
          <div className={`p-4 rounded-lg text-center ${cashOnCash >= 8 ? 'bg-green-500/10' : cashOnCash >= 4 ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
            <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
            <p className={`text-xl font-bold font-mono ${cashOnCash >= 8 ? 'text-green-500' : cashOnCash >= 4 ? 'text-amber-500' : 'text-destructive'}`}>
              {moneyLeftInDeal <= 0 ? '∞' : `${cashOnCash.toFixed(1)}%`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
