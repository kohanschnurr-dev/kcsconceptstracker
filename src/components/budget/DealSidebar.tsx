import { useState } from 'react';
import { DollarSign, ChevronLeft, ChevronRight, Calculator, Folder, Save, FolderOpen, Loader2, Ruler, Pencil, Check, Settings, ArrowUp, ArrowDown, HardHat, Wrench } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { arrayMove } from '@dnd-kit/sortable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ProjectAutocomplete } from '@/components/ProjectAutocomplete';
import { RentalFields, type RentalFieldValues } from '@/components/budget/RentalFields';

export type CalculatorType = 'fix_flip' | 'rental' | 'contractor';

const DEFAULT_CALC_TAB_ORDER: CalculatorType[] = ['fix_flip', 'rental', 'contractor'];
const CALC_TAB_LABELS: Record<CalculatorType, string> = {
  fix_flip: 'Sale',
  rental: 'Rental',
  contractor: 'Contractor',
};

type CostMode = 'pct' | 'flat';

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
  // Contractor-specific
  laborCost: string;
  onLaborCostChange: (value: string) => void;
  materialCost: string;
  onMaterialCostChange: (value: string) => void;
  overheadPct: string;
  onOverheadPctChange: (value: string) => void;
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
  calculatorType: CalculatorType;
  onCalculatorTypeChange: (type: CalculatorType) => void;
  rentalFields: RentalFieldValues;
  onRentalFieldChange: (field: keyof RentalFieldValues, value: string | boolean) => void;
  closingPct: string;
  onClosingPctChange: (value: string) => void;
  holdingPct: string;
  onHoldingPctChange: (value: string) => void;
  sellClosingPct: string;
  onSellClosingPctChange: (value: string) => void;
  closingMode: CostMode;
  holdingMode: CostMode;
  sellClosingMode: CostMode;
  onClosingModeChange: (mode: CostMode) => void;
  onHoldingModeChange: (mode: CostMode) => void;
  onSellClosingModeChange: (mode: CostMode) => void;
  closingFlat: string;
  holdingFlat: string;
  sellClosingFlat: string;
  onClosingFlatChange: (value: string) => void;
  onHoldingFlatChange: (value: string) => void;
  onSellClosingFlatChange: (value: string) => void;
}

function ModeToggle({ mode, onChange }: { mode: CostMode; onChange: (m: CostMode) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(mode === 'pct' ? 'flat' : 'pct')}
      className="ml-1 px-1 py-0.5 text-[10px] font-mono rounded border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors leading-none"
      title={mode === 'pct' ? 'Switch to flat dollar' : 'Switch to percentage'}
    >
      {mode === 'pct' ? '%' : '$'}
    </button>
  );
}

export function DealSidebar({
  purchasePrice,
  onPurchasePriceChange,
  arv,
  onArvChange,
  sqft,
  onSqftChange,
  laborCost,
  onLaborCostChange,
  materialCost,
  onMaterialCostChange,
  overheadPct,
  onOverheadPctChange,
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
  calculatorType,
  onCalculatorTypeChange,
  rentalFields,
  onRentalFieldChange,
  closingPct,
  onClosingPctChange,
  holdingPct,
  onHoldingPctChange,
  sellClosingPct,
  onSellClosingPctChange,
  closingMode,
  holdingMode,
  sellClosingMode,
  onClosingModeChange,
  onHoldingModeChange,
  onSellClosingModeChange,
  closingFlat,
  holdingFlat,
  sellClosingFlat,
  onClosingFlatChange,
  onHoldingFlatChange,
  onSellClosingFlatChange,
}: DealSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingCosts, setIsEditingCosts] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('save');
  const [reorderOpen, setReorderOpen] = useState(false);
  const [calcTabOrder, setCalcTabOrder] = useState<CalculatorType[]>(() => {
    try {
      const saved = localStorage.getItem('budget-calculator-tab-order');
      if (saved) return JSON.parse(saved) as CalculatorType[];
    } catch {}
    return DEFAULT_CALC_TAB_ORDER;
  });

  const saveCalcTabOrder = (newOrder: CalculatorType[]) => {
    setCalcTabOrder(newOrder);
    localStorage.setItem('budget-calculator-tab-order', JSON.stringify(newOrder));
  };

  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const arvNum = parseFloat(arv) || 0;
  const laborCostNum = parseFloat(laborCost) || 0;
  const materialCostNum = parseFloat(materialCost) || 0;
  const overheadPctNum = parseFloat(overheadPct) || 0;
  const overheadAmount = arvNum * (overheadPctNum / 100);

  // Labor / material split
  const laborMaterialTotal = laborCostNum + materialCostNum;
  const laborPct = laborMaterialTotal > 0 ? (laborCostNum / laborMaterialTotal) * 100 : 50;

  // Compute costs respecting mode
  const closingCostsBuy = closingMode === 'pct'
    ? purchasePriceNum * ((parseFloat(closingPct) || 0) / 100)
    : (parseFloat(closingFlat) || 0);
  const closingCostsSell = includeSellClosingCosts
    ? (sellClosingMode === 'pct' ? arvNum * ((parseFloat(sellClosingPct) || 0) / 100) : (parseFloat(sellClosingFlat) || 0))
    : 0;
  const holdingCosts = holdingMode === 'pct'
    ? purchasePriceNum * ((parseFloat(holdingPct) || 0) / 100)
    : (parseFloat(holdingFlat) || 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const showEstimatedCosts = calculatorType === 'fix_flip';
  const isContractor = calculatorType === 'contractor';

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
          {!isContractor && <span title="Square Footage"><Ruler className="h-5 w-5" /></span>}
          <span title="Saved Budgets"><Folder className="h-5 w-5" /></span>
        </div>
      </div>
    );
  }

  const costLabel = (label: string, mode: CostMode, pct: string) => {
    if (mode === 'pct') return `${label} (${pct}%)`;
    return `${label} (flat)`;
  };

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
          {/* Type Selector */}
          <div className="flex items-center gap-1">
            <Tabs value={calculatorType} onValueChange={(v) => onCalculatorTypeChange(v as CalculatorType)} className="flex-1">
              <TabsList className="grid w-full h-9" style={{ gridTemplateColumns: `repeat(${calcTabOrder.length}, 1fr)` }}>
                {calcTabOrder.map((type) => (
                  <TabsTrigger key={type} value={type} className="text-xs px-1">
                    {CALC_TAB_LABELS[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Popover open={reorderOpen} onOpenChange={setReorderOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2" align="end">
                <p className="text-xs text-muted-foreground mb-2 px-1">Tab Order</p>
                {calcTabOrder.map((type, index) => (
                  <div key={type} className="flex items-center justify-between px-1 py-1 rounded hover:bg-muted">
                    <span className="text-sm">{CALC_TAB_LABELS[type]}</span>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => saveCalcTabOrder(arrayMove(calcTabOrder, index, index - 1))}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6"
                        disabled={index === calcTabOrder.length - 1}
                        onClick={() => saveCalcTabOrder(arrayMove(calcTabOrder, index, index + 1))}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Deal Inputs */}
          <div className="space-y-4">
            {/* Purchase Price — hidden in contractor mode */}
            {!isContractor && (
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
            )}

            <div className="space-y-2">
              <Label htmlFor="arv" className="text-xs">
                {isContractor ? 'Contract Value' : 'After Repair Value (ARV)'}
              </Label>
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

            {/* Square Footage — hidden in contractor mode */}
            {!isContractor && (
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
            )}
          </div>

          {/* Contractor-specific fields */}
          {isContractor && (
            <>
              <Separator />
              {/* Job Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Job Breakdown
                  </h4>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="laborCost" className="text-xs">Labor Cost</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="laborCost"
                        type="number"
                        placeholder="0"
                        className="pl-8 font-mono"
                        value={laborCost}
                        onChange={(e) => onLaborCostChange(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="materialCost" className="text-xs">Material Cost</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="materialCost"
                        type="number"
                        placeholder="0"
                        className="pl-8 font-mono"
                        value={materialCost}
                        onChange={(e) => onMaterialCostChange(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Labor / Material Split Bar */}
                  {laborMaterialTotal > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-sm bg-primary/70" />
                          Labor {laborPct.toFixed(0)}%
                        </span>
                        <span className="flex items-center gap-1">
                          Material {(100 - laborPct).toFixed(0)}%
                          <span className="inline-block w-2 h-2 rounded-sm bg-muted-foreground/40" />
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        <div
                          className="h-full bg-primary/70 transition-all duration-300"
                          style={{ width: `${laborPct}%` }}
                        />
                        <div className="h-full flex-1 bg-muted-foreground/20" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Overhead */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Overhead
                  </h4>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="overheadPct" className="text-xs">Overhead %</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="overheadPct"
                      type="number"
                      placeholder="10"
                      className="font-mono"
                      value={overheadPct}
                      onChange={(e) => onOverheadPctChange(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">%</span>
                  </div>
                  {arvNum > 0 && overheadPctNum > 0 && (
                    <p className="text-xs text-muted-foreground">
                      = <span className="font-mono font-medium text-foreground">{formatCurrency(overheadAmount)}</span> of contract
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Quick Estimates - Fix & Flip only */}
          {showEstimatedCosts && (purchasePriceNum > 0 || arvNum > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Estimated Costs
                    </h4>
                    {!isEditingCosts && (
                      <button
                        type="button"
                        onClick={() => setIsEditingCosts(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit cost percentages"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
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
                  {isEditingCosts ? (
                    <>
                      {/* Closing Buy */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs flex items-center">
                          Closing (Buy)
                          <ModeToggle mode={closingMode} onChange={onClosingModeChange} />
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={closingMode === 'pct' ? closingPct : closingFlat}
                            onChange={(e) => closingMode === 'pct' ? onClosingPctChange(e.target.value) : onClosingFlatChange(e.target.value)}
                            className="w-16 h-6 text-xs font-mono text-right rounded border border-input bg-background px-1.5"
                          />
                          <span className="text-xs text-muted-foreground w-3">{closingMode === 'pct' ? '%' : '$'}</span>
                        </div>
                      </div>
                      {/* Holding */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs flex items-center">
                          Holding
                          <ModeToggle mode={holdingMode} onChange={onHoldingModeChange} />
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={holdingMode === 'pct' ? holdingPct : holdingFlat}
                            onChange={(e) => holdingMode === 'pct' ? onHoldingPctChange(e.target.value) : onHoldingFlatChange(e.target.value)}
                            className="w-16 h-6 text-xs font-mono text-right rounded border border-input bg-background px-1.5"
                          />
                          <span className="text-xs text-muted-foreground w-3">{holdingMode === 'pct' ? '%' : '$'}</span>
                        </div>
                      </div>
                      {/* Closing Sell */}
                      {includeSellClosingCosts && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground text-xs flex items-center">
                            Closing (Sell)
                            <ModeToggle mode={sellClosingMode} onChange={onSellClosingModeChange} />
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={sellClosingMode === 'pct' ? sellClosingPct : sellClosingFlat}
                              onChange={(e) => sellClosingMode === 'pct' ? onSellClosingPctChange(e.target.value) : onSellClosingFlatChange(e.target.value)}
                              className="w-16 h-6 text-xs font-mono text-right rounded border border-input bg-background px-1.5"
                            />
                            <span className="text-xs text-muted-foreground w-3">{sellClosingMode === 'pct' ? '%' : '$'}</span>
                          </div>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="w-full h-6 text-xs mt-1" onClick={() => setIsEditingCosts(false)}>
                        <Check className="h-3 w-3 mr-1" /> Done
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{costLabel('Closing (Buy)', closingMode, closingPct)}</span>
                        <span className="font-mono">{formatCurrency(closingCostsBuy)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{costLabel('Holding', holdingMode, holdingPct)}</span>
                        <span className="font-mono">{formatCurrency(holdingCosts)}</span>
                      </div>
                    </>
                  )}
                  {includeSellClosingCosts && !isEditingCosts && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{costLabel('Closing (Sell)', sellClosingMode, sellClosingPct)}</span>
                      <span className="font-mono">{formatCurrency(closingCostsSell)}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Rental-specific fields */}
          {calculatorType === 'rental' && (
            <RentalFields values={rentalFields} onChange={onRentalFieldChange} arv={arvNum} purchasePrice={purchasePriceNum} />
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
