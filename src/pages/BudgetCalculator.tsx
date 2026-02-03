import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MAOGauge } from '@/components/budget/MAOGauge';
import { BudgetCanvas } from '@/components/budget/BudgetCanvas';
import { TemplatePicker } from '@/components/budget/TemplatePicker';
import { DealSidebar } from '@/components/budget/DealSidebar';
import { BUDGET_CATEGORIES } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  category_budgets: Record<string, number>;
  total_budget: number;
}

export default function BudgetCalculator() {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [arv, setArv] = useState<string>('');
  const [budgetName, setBudgetName] = useState<string>('');
  const [budgetDescription, setBudgetDescription] = useState<string>('');
  const [currentTemplateName, setCurrentTemplateName] = useState<string>('');
  const [profitBreakdownOpen, setProfitBreakdownOpen] = useState(false);
  const [maoPercentage, setMaoPercentage] = useState<number>(78);
  const [includeSellClosingCosts, setIncludeSellClosingCosts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [sqft, setSqft] = useState<string>('');
  
  // Category budgets state
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      initial[cat.value] = '';
    });
    return initial;
  });

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, address')
          .eq('status', 'active')
          .order('name');
        
        if (error) throw error;
        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Calculate totals
  const totalBudget = Object.values(categoryBudgets).reduce((sum, val) => {
    return sum + (parseFloat(val) || 0);
  }, 0);

  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const arvNum = parseFloat(arv) || 0;

  // Profit calculations
  // Buy closing costs - ALWAYS included
  const closingCostsBuy = purchasePriceNum * 0.02;
  // Sell closing costs - TOGGLE controlled
  const closingCostsSell = includeSellClosingCosts ? arvNum * 0.06 : 0;
  const holdingCosts = purchasePriceNum * 0.03;
  
  const totalInvestment = purchasePriceNum + totalBudget + closingCostsBuy + holdingCosts;
  const totalCosts = totalInvestment + closingCostsSell;
  const grossProfit = arvNum - totalCosts;
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  
  // Dynamic MAO Rule
  const maxOffer = (arvNum * (maoPercentage / 100)) - totalBudget;
  const meetsMaoRule = purchasePriceNum <= maxOffer && purchasePriceNum > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCategoryChange = (category: string, value: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleSelectTemplate = (template: BudgetTemplate | null) => {
    if (!template) {
      handleClearAll();
      return;
    }

    // Load template values
    setBudgetName(template.name);
    setBudgetDescription(template.description || '');
    setPurchasePrice(template.purchase_price?.toString() || '');
    setArv(template.arv?.toString() || '');
    setCurrentTemplateName(template.name);

    // Load category budgets
    const newBudgets: Record<string, string> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      newBudgets[cat.value] = template.category_budgets[cat.value]?.toString() || '';
    });
    setCategoryBudgets(newBudgets);

    toast.success(`Loaded "${template.name}" template`);
  };

  const handleClearAll = () => {
    setBudgetName('');
    setBudgetDescription('');
    setPurchasePrice('');
    setArv('');
    setCurrentTemplateName('');
    
    const cleared: Record<string, string> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      cleared[cat.value] = '';
    });
    setCategoryBudgets(cleared);
  };

  const getCategoryBudgetsObject = () => {
    const budgets: Record<string, number> = {};
    BUDGET_CATEGORIES.forEach(cat => {
      const val = parseFloat(categoryBudgets[cat.value]) || 0;
      if (val > 0) {
        budgets[cat.value] = val;
      }
    });
    return budgets;
  };

  const handleSave = async () => {
    if (!budgetName.trim()) {
      toast.error('Please enter a name for this budget');
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast.error('Please enter at least one category budget');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const templateData = {
        user_id: user.id,
        name: budgetName.trim(),
        description: budgetDescription.trim() || null,
        purchase_price: parseFloat(purchasePrice) || 0,
        arv: parseFloat(arv) || 0,
        category_budgets: getCategoryBudgetsObject(),
      };

      const { error } = await supabase
        .from('budget_templates')
        .insert(templateData);
      
      if (error) throw error;
      toast.success('Budget saved to folder');
      setCurrentTemplateName(budgetName);
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToProject = async (projectId: string) => {
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    const hasAnyBudget = Object.values(categoryBudgets).some(val => parseFloat(val) > 0);
    if (!hasAnyBudget) {
      toast.error('Please enter at least one category budget');
      return;
    }

    setIsSaving(true);

    try {
      // First, get existing categories for this project
      const { data: existingCategories, error: fetchError } = await supabase
        .from('project_categories')
        .select('id, category')
        .eq('project_id', projectId);

      if (fetchError) throw fetchError;

      const existingCategoryMap = new Map(
        existingCategories?.map(c => [c.category, c.id]) || []
      );

      // Prepare category data
      const categoriesToUpdate = [];
      const categoriesToInsert = [];

      for (const cat of BUDGET_CATEGORIES) {
        const budgetValue = parseFloat(categoryBudgets[cat.value]) || 0;
        if (budgetValue > 0) {
          const existingId = existingCategoryMap.get(cat.value);
          if (existingId) {
            categoriesToUpdate.push({
              id: existingId,
              estimated_budget: budgetValue,
            });
          } else {
            categoriesToInsert.push({
              project_id: projectId,
              category: cat.value,
              estimated_budget: budgetValue,
            });
          }
        }
      }

      // Update existing categories
      for (const cat of categoriesToUpdate) {
        const { error } = await supabase
          .from('project_categories')
          .update({ estimated_budget: cat.estimated_budget })
          .eq('id', cat.id);
        if (error) throw error;
      }

      // Insert new categories
      if (categoriesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('project_categories')
          .insert(categoriesToInsert);
        if (insertError) throw insertError;
      }

      // Update project total budget
      const { error: updateError } = await supabase
        .from('projects')
        .update({ total_budget: totalBudget })
        .eq('id', projectId);

      if (updateError) throw updateError;

      toast.success(`Budget of ${formatCurrency(totalBudget)} applied to project`);
    } catch (error: any) {
      console.error('Error applying budget:', error);
      toast.error(error.message || 'Failed to apply budget');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Budget Calculator</h1>
            <p className="text-muted-foreground text-sm">
              Build and manage rehab budgets with real-time MAO tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TemplatePicker
              onSelectTemplate={handleSelectTemplate}
              onCreateNew={handleClearAll}
              currentTemplateName={currentTemplateName}
              sqft={sqft}
              onSqftChange={setSqft}
            />
            <Button variant="outline" size="icon" onClick={handleClearAll} title="Clear all">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* MAO Gauge - Sticky */}
        <div className="px-6 py-3 border-b bg-muted/30">
          <MAOGauge
            arv={arvNum}
            currentBudget={totalBudget}
            purchasePrice={purchasePriceNum}
            maoPercentage={maoPercentage}
            onPercentageChange={setMaoPercentage}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Deal Sidebar - Left Panel */}
          <DealSidebar
            purchasePrice={purchasePrice}
            onPurchasePriceChange={setPurchasePrice}
            arv={arv}
            onArvChange={setArv}
            sqft={sqft}
            onSqftChange={setSqft}
            budgetName={budgetName}
            onBudgetNameChange={setBudgetName}
            budgetDescription={budgetDescription}
            onBudgetDescriptionChange={setBudgetDescription}
            onSave={handleSave}
            onApplyToProject={handleApplyToProject}
            isSaving={isSaving}
            projects={projects}
            isLoadingProjects={isLoadingProjects}
            includeSellClosingCosts={includeSellClosingCosts}
            onSellClosingCostsChange={setIncludeSellClosingCosts}
          />
          
          {/* Budget Canvas - Primary Workspace */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Category Cards Grid */}
                <BudgetCanvas
                  categoryBudgets={categoryBudgets}
                  onCategoryChange={handleCategoryChange}
                  sqft={sqft}
                />

                {/* Profit Breakdown - Collapsible */}
                <div className="mt-8">
                  <Collapsible open={profitBreakdownOpen} onOpenChange={setProfitBreakdownOpen}>
                    <div className="flex items-center gap-3">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                          <ChevronDown className={`h-4 w-4 transition-transform ${profitBreakdownOpen ? '' : '-rotate-90'}`} />
                          <Calculator className="h-4 w-4" />
                          <span className="font-medium">Profit Breakdown</span>
                        </Button>
                      </CollapsibleTrigger>
                      <Separator className="flex-1" />
                    </div>

                    <CollapsibleContent className="pt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Profit Analysis</CardTitle>
                          <CardDescription>
                            Detailed cost analysis based on current budget and deal parameters
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
                                  <span className="font-mono">{formatCurrency(purchasePriceNum)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Closing Costs (2%)</span>
                                  <span className="font-mono">{formatCurrency(closingCostsBuy)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Rehab Column */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Rehab & Holding</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Rehab Budget</span>
                                  <span className="font-mono">{formatCurrency(totalBudget)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Holding Costs (3%)</span>
                                  <span className="font-mono">{formatCurrency(holdingCosts)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Sale Column */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sale</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>ARV (Sale Price)</span>
                                  <span className="font-mono">{formatCurrency(arvNum)}</span>
                                </div>
                                {includeSellClosingCosts && (
                                  <div className="flex justify-between text-sm">
                                    <span>Selling Costs (6%)</span>
                                    <span className="font-mono">-{formatCurrency(closingCostsSell)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Profit Column */}
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Total Investment</span>
                                  <span className="font-mono">{formatCurrency(totalInvestment)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                  <span>Gross Profit</span>
                                  <span className={`font-mono ${grossProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                    {formatCurrency(grossProfit)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                  <span>ROI</span>
                                  <span className={`font-mono ${roi >= 0 ? 'text-green-500' : 'text-destructive'}`}>
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
                              <p className="text-2xl font-bold font-mono">{formatCurrency(totalInvestment)}</p>
                            </div>
                            <div className={`p-4 rounded-lg text-center ${grossProfit >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                              <p className="text-sm text-muted-foreground">Projected Profit</p>
                              <p className={`text-2xl font-bold font-mono ${grossProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                                {formatCurrency(grossProfit)}
                              </p>
                            </div>
                            <div className={`p-4 rounded-lg text-center ${roi >= 20 ? 'bg-green-500/10' : roi >= 0 ? 'bg-amber-500/10' : 'bg-destructive/10'}`}>
                              <p className="text-sm text-muted-foreground">Return on Investment</p>
                              <p className={`text-2xl font-bold font-mono ${roi >= 20 ? 'text-green-500' : roi >= 0 ? 'text-amber-500' : 'text-destructive'}`}>
                                {roi.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          {/* MAO Rule Check */}
                          {purchasePriceNum > 0 && arvNum > 0 && (
                            <div className={`mt-6 p-4 rounded-lg ${meetsMaoRule ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                              <div className="flex items-center gap-2">
                                {meetsMaoRule ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                )}
                                <span className={`font-medium ${meetsMaoRule ? 'text-green-500' : 'text-destructive'}`}>
                                  {meetsMaoRule
                                    ? `✓ Meets ${maoPercentage}% Rule - Your offer is ${formatCurrency(maxOffer - purchasePriceNum)} under the max!`
                                    : `✗ Over ${maoPercentage}% Rule - Your offer is ${formatCurrency(purchasePriceNum - maxOffer)} over the max!`}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </ScrollArea>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
