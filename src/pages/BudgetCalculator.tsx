import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { CreateBudgetModal, BudgetTemplate } from '@/components/CreateBudgetModal';
import { SavedBudgetsPanel } from '@/components/SavedBudgetsPanel';

export default function BudgetCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [arv, setArv] = useState<string>('');
  const [rehabBudget, setRehabBudget] = useState<string>('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
  const [defaultTab, setDefaultTab] = useState<'save' | 'apply'>('save');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const arvNum = parseFloat(arv) || 0;
  const rehabBudgetNum = parseFloat(rehabBudget) || 0;

  // Calculations
  const closingCostsBuy = purchasePriceNum * 0.02;
  const closingCostsSell = arvNum * 0.06;
  const holdingCosts = purchasePriceNum * 0.03;
  
  const totalInvestment = purchasePriceNum + rehabBudgetNum + closingCostsBuy + holdingCosts;
  const totalCosts = totalInvestment + closingCostsSell;
  const grossProfit = arvNum - totalCosts;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  
  // 78% Rule
  const maxOffer = (arvNum * 0.78) - rehabBudgetNum;
  const meets78Rule = purchasePriceNum <= maxOffer && purchasePriceNum > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleClear = () => {
    setPurchasePrice('');
    setArv('');
    setRehabBudget('');
  };

  const handleEditBudget = (template: BudgetTemplate) => {
    setEditingTemplate(template);
    setDefaultTab('save');
    setShowBudgetModal(true);
  };

  const handleApplyToProject = (template: BudgetTemplate) => {
    setEditingTemplate(template);
    setDefaultTab('apply');
    setShowBudgetModal(true);
  };

  const handleNewBudget = () => {
    setEditingTemplate(null);
    setDefaultTab('save');
    setShowBudgetModal(true);
  };

  const handleBudgetCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingTemplate(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Budget Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze potential deals with profit projections and the 78% rule
          </p>
        </div>

        {/* Create Budget Button */}
        <Button 
          onClick={handleNewBudget}
          className="w-full sm:w-auto"
          size="lg"
        >
          <ClipboardList className="h-5 w-5 mr-2" />
          Create Category Budget
        </Button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Inputs + 70% Rule */}
          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Deal Inputs
                  </CardTitle>
                  <CardDescription>
                    Enter the property details to calculate potential returns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="purchasePrice"
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arv">After Repair Value (ARV)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="arv"
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        value={arv}
                        onChange={(e) => setArv(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rehabBudget">Rehab Budget</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rehabBudget"
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        value={rehabBudget}
                        onChange={(e) => setRehabBudget(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleClear} className="w-full">
                    Clear All
                  </Button>
                </CardContent>
              </Card>

              {/* 70% Rule Card */}
              <Card className={purchasePriceNum > 0 ? (meets78Rule ? 'border-green-500/50' : 'border-destructive/50') : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {purchasePriceNum > 0 ? (
                      meets78Rule ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      )
                    ) : (
                      <TrendingUp className="h-5 w-5" />
                    )}
                    78% Rule Analysis
                  </CardTitle>
                  <CardDescription>
                    Max Offer = (ARV × 78%) - Rehab Costs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Maximum Offer Price</p>
                    <p className="text-4xl font-bold text-primary">
                      {formatCurrency(Math.max(0, maxOffer))}
                    </p>
                  </div>

                  {purchasePriceNum > 0 && (
                    <div className={`p-4 rounded-lg ${meets78Rule ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                      <p className="text-sm font-medium">
                        {meets78Rule
                          ? `✓ Your offer of ${formatCurrency(purchasePriceNum)} is ${formatCurrency(maxOffer - purchasePriceNum)} under the max!`
                          : `✗ Your offer of ${formatCurrency(purchasePriceNum)} is ${formatCurrency(purchasePriceNum - maxOffer)} over the max!`}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ARV × 78%</span>
                      <span>{formatCurrency(arvNum * 0.78)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Less: Rehab Budget</span>
                      <span>-{formatCurrency(rehabBudgetNum)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Max Offer</span>
                      <span className="text-primary">{formatCurrency(Math.max(0, maxOffer))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profit Breakdown</CardTitle>
                <CardDescription>
                  Detailed cost analysis and projected returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Costs Column */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Acquisition</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Purchase Price</span>
                        <span>{formatCurrency(purchasePriceNum)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Closing Costs (2%)</span>
                        <span>{formatCurrency(closingCostsBuy)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rehab Column */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Rehab & Holding</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Rehab Budget</span>
                        <span>{formatCurrency(rehabBudgetNum)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Holding Costs (3%)</span>
                        <span>{formatCurrency(holdingCosts)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sale Column */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sale</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>ARV (Sale Price)</span>
                        <span>{formatCurrency(arvNum)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Selling Costs (6%)</span>
                        <span>-{formatCurrency(closingCostsSell)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profit Column */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Investment</span>
                        <span>{formatCurrency(totalInvestment)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Gross Profit</span>
                        <span className={grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}>
                          {formatCurrency(grossProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>ROI</span>
                        <span className={roi >= 0 ? 'text-green-600' : 'text-destructive'}>
                          {roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Total Investment</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalInvestment)}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${grossProfit >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                    <p className="text-sm text-muted-foreground">Projected Profit</p>
                    <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(grossProfit)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${roi >= 20 ? 'bg-green-500/10' : roi >= 0 ? 'bg-yellow-500/10' : 'bg-destructive/10'}`}>
                    <p className="text-sm text-muted-foreground">Return on Investment</p>
                    <p className={`text-2xl font-bold ${roi >= 20 ? 'text-green-600' : roi >= 0 ? 'text-yellow-600' : 'text-destructive'}`}>
                      {roi.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Saved Budgets */}
          <div>
            <SavedBudgetsPanel
              onEditBudget={handleEditBudget}
              onApplyToProject={handleApplyToProject}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>

      {/* Create Budget Modal */}
      <CreateBudgetModal
        open={showBudgetModal}
        onOpenChange={(open) => {
          setShowBudgetModal(open);
          if (!open) setEditingTemplate(null);
        }}
        initialTotalBudget={rehabBudgetNum}
        onBudgetCreated={handleBudgetCreated}
        editingTemplate={editingTemplate}
        defaultTab={defaultTab}
      />
    </MainLayout>
  );
}
