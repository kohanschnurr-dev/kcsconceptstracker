import { useState } from 'react';
import { DollarSign, ChevronLeft, ChevronRight, Calculator, Folder, Save, FolderOpen, Loader2, Ruler } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface DealSidebarProps {
  purchasePrice: string;
  onPurchasePriceChange: (value: string) => void;
  arv: string;
  onArvChange: (value: string) => void;
  sqft: string;
  onSqftChange: (value: string) => void;
  budgetName: string;
  onBudgetNameChange: (value: string) => void;
  budgetDescription: string;
  onBudgetDescriptionChange: (value: string) => void;
  onSave: () => void;
  onApplyToProject: (projectId: string) => void;
  isSaving: boolean;
  projects: Project[];
  isLoadingProjects: boolean;
  includeSellClosingCosts: boolean;
  onSellClosingCostsChange: (value: boolean) => void;
}

export function DealSidebar({
  purchasePrice,
  onPurchasePriceChange,
  arv,
  onArvChange,
  sqft,
  onSqftChange,
  budgetName,
  onBudgetNameChange,
  budgetDescription,
  onBudgetDescriptionChange,
  onSave,
  onApplyToProject,
  isSaving,
  projects,
  isLoadingProjects,
  includeSellClosingCosts,
  onSellClosingCostsChange,
}: DealSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('save');

  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const arvNum = parseFloat(arv) || 0;

  // Quick calculations - buy closing always included, sell closing toggleable
  const closingCostsBuy = purchasePriceNum * 0.02;
  const closingCostsSell = includeSellClosingCosts ? arvNum * 0.06 : 0;
  const holdingCosts = purchasePriceNum * 0.03;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <span title="Deal Parameters"><Calculator className="h-5 w-5" /></span>
          <span title="Square Footage"><Ruler className="h-5 w-5" /></span>
          <span title="Saved Budgets"><Folder className="h-5 w-5" /></span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Deal Parameters</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Deal Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice" className="text-xs">Purchase Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="0"
                  className="pl-8 font-mono"
                  value={purchasePrice}
                  onChange={(e) => onPurchasePriceChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arv" className="text-xs">After Repair Value (ARV)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="arv"
                  type="number"
                  placeholder="0"
                  className="pl-8 font-mono"
                  value={arv}
                  onChange={(e) => onArvChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sqft" className="text-xs">Square Footage</Label>
              <Input
                id="sqft"
                type="number"
                placeholder="1500"
                className="font-mono"
                value={sqft}
                onChange={(e) => onSqftChange(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Estimates */}
          {(purchasePriceNum > 0 || arvNum > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Estimated Costs
                  </h4>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sell-closing-toggle" className="text-xs text-muted-foreground">
                      Include Exit Costs
                    </Label>
                    <Switch
                      id="sell-closing-toggle"
                      checked={includeSellClosingCosts}
                      onCheckedChange={onSellClosingCostsChange}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Closing (Buy, 2%)</span>
                    <span className="font-mono">{formatCurrency(closingCostsBuy)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Holding (3%)</span>
                    <span className="font-mono">{formatCurrency(holdingCosts)}</span>
                  </div>
                  {includeSellClosingCosts && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Closing (Sell, 6%)</span>
                      <span className="font-mono">{formatCurrency(closingCostsSell)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Save/Apply Actions */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetName" className="text-xs">Budget Name *</Label>
              <Input
                id="budgetName"
                placeholder="e.g., 123 Main St Budget"
                value={budgetName}
                onChange={(e) => onBudgetNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetDescription" className="text-xs">Description</Label>
              <Textarea
                id="budgetDescription"
                placeholder="Optional notes..."
                value={budgetDescription}
                onChange={(e) => onBudgetDescriptionChange(e.target.value)}
                className="h-16 resize-none"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="save" className="text-xs">
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </TabsTrigger>
                <TabsTrigger value="apply" className="text-xs">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  Apply
                </TabsTrigger>
              </TabsList>

              <TabsContent value="save" className="mt-3">
                <Button 
                  className="w-full" 
                  onClick={onSave}
                  disabled={isSaving || !budgetName.trim()}
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save to Folder
                </Button>
              </TabsContent>

              <TabsContent value="apply" className="mt-3 space-y-3">
                <ProjectAutocomplete
                  projects={projects}
                  value={selectedProject}
                  onSelect={setSelectedProject}
                  placeholder={isLoadingProjects ? "Loading..." : "Select project..."}
                />
                <Button 
                  className="w-full"
                  onClick={() => onApplyToProject(selectedProject)}
                  disabled={isSaving || !selectedProject}
                >
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply to Project
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
