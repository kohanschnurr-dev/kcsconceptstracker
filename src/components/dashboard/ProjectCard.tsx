import { MapPin, Calendar, Home, Hammer, Building2, Handshake, Star, HardHat } from 'lucide-react';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatDisplayDate } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  isStarred?: boolean;
  onToggleStar?: (projectId: string) => void;
}

export function ProjectCard({ project, onClick, isStarred, onToggleStar }: ProjectCardProps) {
  const totalSpent = project.categories.reduce((sum, cat) => sum + cat.actualSpent, 0);
  const isRental = project.projectType === 'rental';
  const isNewConstruction = project.projectType === 'new_construction';
  const isWholesaling = project.projectType === 'wholesaling';
  const isContractor = project.projectType === 'contractor';
  const showBudgetProgress = !isRental && !isContractor && project.totalBudget > 0;
  const percentSpent = showBudgetProgress ? (totalSpent / project.totalBudget) * 100 : 0;

  const contractValue = isContractor ? (project.purchasePrice || 0) : 0;
  const contractorCostBasis = isContractor
    ? (project.status === 'complete'
        ? totalSpent
        : (project.totalBudget > 0 ? Math.max(project.totalBudget, totalSpent) : totalSpent))
    : 0;
  const contractorGrossProfit = contractValue - contractorCostBasis;
  const contractorHasData = isContractor && contractValue > 0;
  const grossMarginPct = contractorHasData && contractorCostBasis > 0
    ? (contractorGrossProfit / contractValue) * 100
    : 0;

  const arv = project.arv || 0;
  const purchasePrice = project.purchasePrice || 0;
  const constructionSpent = project.constructionSpent || 0;
  const rehabBasis = project.status === 'complete'
    ? constructionSpent
    : Math.max(project.totalBudget, constructionSpent);

  // Transaction costs (closing costs)
  const closingMode = project.closingCostsMode || 'pct';
  const transactionCosts = closingMode === 'actual'
    ? (project.transactionCostActual || 0)
    : closingMode === 'flat'
      ? (project.closingCostsFlat ?? 0)
      : arv * ((project.closingCostsPct ?? 6) / 100);

  // Holding costs
  const holdingMode = project.holdingCostsMode || 'pct';
  const holdingCosts = holdingMode === 'actual'
    ? (project.holdingCostActual || 0)
    : holdingMode === 'flat'
      ? (project.holdingCostsFlat ?? 0)
      : purchasePrice * ((project.holdingCostsPct ?? 3) / 100);

  const profit = arv - purchasePrice - rehabBasis - transactionCosts - holdingCosts;
  const hasProfit = arv > 0;

  const getProgressColor = () => {
    if (percentSpent > 100) return 'bg-primary';
    if (percentSpent > 90) return 'bg-warning';
    return 'bg-success';
  };

  const getCoverPhotoUrl = () => {
    if (!project.coverPhotoPath) return null;
    const { data } = supabase.storage.from('project-photos').getPublicUrl(project.coverPhotoPath);
    return data.publicUrl;
  };

  const coverPhotoUrl = getCoverPhotoUrl();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date: string) => formatDisplayDate(date);

  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 animate-slide-up overflow-hidden",
        !coverPhotoUrl && "p-5"
      )}
    >
      {coverPhotoUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={coverPhotoUrl} 
            alt={project.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: project.coverPhotoPosition || '50% 50%' }}
          />
        </div>
      )}
      
      <div className={cn("space-y-4", coverPhotoUrl && "p-5")}>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {onToggleStar && (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleStar(project.id); }}
                  className="shrink-0 hover:scale-110 transition-transform"
                  aria-label={isStarred ? 'Unstar project' : 'Star project'}
                >
                  <Star className={cn('h-4 w-4', isStarred ? 'fill-warning text-warning' : 'text-muted-foreground')} />
                </button>
              )}
              {isNewConstruction ? (
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : isRental ? (
                <Home className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : isWholesaling ? (
                <Handshake className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : isContractor ? (
                <HardHat className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <Hammer className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <h3 className="font-semibold text-lg truncate">{project.name}</h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{project.address}</span>
            </div>
          </div>
          <Badge
            variant={project.status === 'complete' ? 'default' : 'secondary'}
            className={cn(
              'shrink-0',
              project.status === 'active' && 'bg-success/20 text-success border-success/30',
              project.status === 'complete' && 'bg-primary/20 text-primary border-primary/30',
              project.status === 'on-hold' && 'bg-warning/20 text-warning border-warning/30'
            )}
          >
            {project.status}
          </Badge>
        </div>

        {showBudgetProgress && (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Progress</span>
              <span className="font-mono font-medium">{percentSpent.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={cn('progress-fill', getProgressColor())}
                style={{ width: `${Math.min(percentSpent, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(totalSpent)} spent</span>
              <span>{formatCurrency(project.totalBudget)} total</span>
            </div>
          </div>
        )}

        {isRental && (() => {
          const rent = project.monthlyRent || 0;
          const vacancy = project.vacancyRate ?? 8;
          const grossIncome = rent - rent * (vacancy / 100);
          
          const loanAmt = project.loanAmount || 0;
          const rate = (project.interestRate || 0) / 100 / 12;
          const nPay = Math.round((project.loanTermYears ?? 30) * 12);
          let mortgage = 0;
          if (loanAmt > 0 && rate > 0 && nPay > 0) {
            mortgage = loanAmt * (rate * Math.pow(1 + rate, nPay)) / (Math.pow(1 + rate, nPay) - 1);
          }
          
          const monthlyTaxes = (project.annualPropertyTaxes || 0) / 12;
          const monthlyIns = (project.annualInsurance || 0) / 12;
          const monthlyHoa = (project.annualHoa || 0) / 12;
          const maint = project.monthlyMaintenance || 0;
          const mgmt = rent * ((project.managementRate ?? 10) / 100);
          const expenses = monthlyTaxes + monthlyIns + monthlyHoa + maint + mgmt;
          
          const monthlyCF = grossIncome - mortgage - expenses;
          const annualCashFlow = monthlyCF * 12;
          const hasData = rent > 0;
          
          return (
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Annual Cash Flow</p>
              <p className={cn('font-mono font-semibold text-lg', annualCashFlow < 0 ? 'text-destructive' : annualCashFlow > 0 ? 'text-success' : '')}>
                {hasData ? formatCurrency(annualCashFlow) : '—'}
              </p>
            </div>
          );
        })()}

        {isContractor && (
          <div className="space-y-3 mb-4">
            {/* Contract Value highlight */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Contract Value</p>
              <p className="font-mono font-semibold text-lg text-primary">
                {contractorHasData ? formatCurrency(contractValue) : '—'}
              </p>
            </div>

            {/* Gross Margin progress bar */}
            {contractorHasData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gross Margin</span>
                  <span className={cn('font-mono font-medium',
                    grossMarginPct >= 20 ? 'text-success' :
                    grossMarginPct >= 10 ? 'text-warning' : 'text-destructive'
                  )}>
                    {grossMarginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={cn('progress-fill',
                      grossMarginPct >= 20 ? 'bg-success' :
                      grossMarginPct >= 10 ? 'bg-warning' : 'bg-destructive'
                    )}
                    style={{ width: `${Math.min(Math.max(grossMarginPct, 0), 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(contractorGrossProfit)} gross profit</span>
                  <span>{formatCurrency(contractorCostBasis)} job cost</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">{isContractor ? 'Gross Profit' : isRental ? 'Equity Gain' : 'Profit'}</p>
            <p className={cn('font-mono font-semibold',
              isContractor
                ? (contractorHasData ? (contractorGrossProfit < 0 ? 'text-destructive' : 'text-success') : '')
                : (!hasProfit ? '' : profit < 0 ? 'text-destructive' : 'text-success')
            )}>
              {isContractor
                ? (contractorHasData ? formatCurrency(contractorGrossProfit) : '—')
                : (hasProfit ? formatCurrency(profit) : '—')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{project.completedDate ? 'Completed' : 'Start Date'}</p>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{project.completedDate ? formatDate(project.completedDate) : formatDate(project.startDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
