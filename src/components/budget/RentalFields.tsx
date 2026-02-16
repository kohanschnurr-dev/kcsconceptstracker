import { DollarSign, Percent } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

export interface RentalFieldValues {
  monthlyRent: string;
  vacancyRate: string;
  annualTaxes: string;
  annualInsurance: string;
  annualHoa: string;
  monthlyMaintenance: string;
  managementRate: string;
  refiEnabled: boolean;
  refiLtv: string;
  refiLoanAmount: string;
  refiRate: string;
  refiTerm: string;
  refiPoints: string;
  refiPointsMode: 'pct' | 'flat';
}

interface RentalFieldsProps {
  values: RentalFieldValues;
  onChange: (field: keyof RentalFieldValues, value: string | boolean) => void;
  arv: number;
}

export function RentalFields({ values, onChange, arv }: RentalFieldsProps) {
  const ltvPercent = parseFloat(values.refiLtv) || 75;
  const computedLoanAmount = Math.round(arv * (ltvPercent / 100));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  return (
    <div className="space-y-4">
      <Separator />
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Rental Income
      </h4>

      <div className="space-y-2">
        <Label htmlFor="monthlyRent" className="text-xs">Monthly Rent</Label>
        <div className="relative">
          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="monthlyRent"
            type="number"
            placeholder="0"
            className="pl-8 font-mono"
            value={values.monthlyRent}
            onChange={(e) => onChange('monthlyRent', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vacancyRate" className="text-xs">Vacancy Rate (%)</Label>
        <div className="relative">
          <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="vacancyRate"
            type="number"
            placeholder="5"
            className="pl-8 font-mono"
            value={values.vacancyRate}
            onChange={(e) => onChange('vacancyRate', e.target.value)}
          />
        </div>
      </div>

      <Separator />
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Operating Expenses
      </h4>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="annualTaxes" className="text-xs">Annual Taxes</Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="annualTaxes"
              type="number"
              placeholder="0"
              className="pl-7 font-mono text-xs h-9"
              value={values.annualTaxes}
              onChange={(e) => onChange('annualTaxes', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="annualInsurance" className="text-xs">Annual Insurance</Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="annualInsurance"
              type="number"
              placeholder="0"
              className="pl-7 font-mono text-xs h-9"
              value={values.annualInsurance}
              onChange={(e) => onChange('annualInsurance', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="annualHoa" className="text-xs">Annual HOA</Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="annualHoa"
              type="number"
              placeholder="0"
              className="pl-7 font-mono text-xs h-9"
              value={values.annualHoa}
              onChange={(e) => onChange('annualHoa', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="monthlyMaintenance" className="text-xs">Monthly Maint.</Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="monthlyMaintenance"
              type="number"
              placeholder="0"
              className="pl-7 font-mono text-xs h-9"
              value={values.monthlyMaintenance}
              onChange={(e) => onChange('monthlyMaintenance', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="managementRate" className="text-xs">Management Fee (%)</Label>
        <div className="relative">
          <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="managementRate"
            type="number"
            placeholder="10"
            className="pl-8 font-mono"
            value={values.managementRate}
            onChange={(e) => onChange('managementRate', e.target.value)}
          />
        </div>
      </div>

      {/* Refinance Section */}
      <Separator />
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Refinance
      </h4>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Loan-to-Value</Label>
            <span className="text-xs font-mono font-medium">{ltvPercent}%</span>
          </div>
          <Slider
            value={[ltvPercent]}
            onValueChange={([v]) => {
              onChange('refiLtv', String(v));
              onChange('refiLoanAmount', String(Math.round(arv * (v / 100))));
            }}
            min={0}
            max={100}
            step={1}
            className="py-1"
          />
          <p className="text-xs text-muted-foreground font-mono">
            Loan: {formatCurrency(computedLoanAmount)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="refiRate" className="text-xs">Rate (%)</Label>
            <Input
              id="refiRate"
              type="number"
              placeholder="7"
              className="font-mono text-xs h-9"
              value={values.refiRate}
              onChange={(e) => onChange('refiRate', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="refiTerm" className="text-xs">Term (yrs)</Label>
            <Input
              id="refiTerm"
              type="number"
              placeholder="30"
              className="font-mono text-xs h-9"
              value={values.refiTerm}
              onChange={(e) => onChange('refiTerm', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label htmlFor="refiPoints" className="text-xs">Points</Label>
              <button
                type="button"
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border border-input bg-muted hover:bg-accent transition-colors"
                onClick={() => onChange('refiPointsMode', values.refiPointsMode === 'pct' ? 'flat' : 'pct')}
              >
                {values.refiPointsMode === 'pct' ? '%' : '$'}
              </button>
            </div>
            <Input
              id="refiPoints"
              type="number"
              placeholder="0"
              className="font-mono text-xs h-9"
              value={values.refiPoints}
              onChange={(e) => onChange('refiPoints', e.target.value)}
            />
            {values.refiPointsMode === 'pct' && parseFloat(values.refiPoints) > 0 && (
              <p className="text-[10px] text-muted-foreground font-mono">
                = {formatCurrency(Math.round(computedLoanAmount * (parseFloat(values.refiPoints) / 100)))}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
