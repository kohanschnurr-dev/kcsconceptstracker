import { useState } from 'react';
import { DollarSign, ChevronLeft, ChevronRight, ChevronDown, Calculator, Folder, Save, FolderOpen, Loader2, Ruler, Pencil, Check, Settings, ArrowUp, ArrowDown } from 'lucide-react';
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

export type CalculatorType = 'fix_flip' | 'rental' | 'new_construction';

const DEFAULT_CALC_TAB_ORDER: CalculatorType[] = ['fix_flip', 'new_construction', 'rental'];
const CALC_TAB_LABELS: Record<CalculatorType, string> = {
  fix_flip: 'Sale',
  new_construction: 'New Build',
  rental: 'Rental',
};

type CostMode = 'pct' | 'flat';

interface Project {
  id: string;
  name: string;
  address: string;
}

interface DealSidebarProps {
  isMobile?: boolean;
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
  isMobile = false,
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
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [isEditingCosts, setIsEditingCosts] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('save');
  const [reorderOpen, setReorderOpen] = useState(false);
  const [calcTabOrder, setCalcTabOrder] = useState<CalculatorType[]>(() => {
    try {
      const saved = localStorage.getItem('budget-calculator-tab-order');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Filter out removed types
        const valid = parsed.filter(t => t === 'fix_flip' || t === 'rental' || t === 'new_construction') as CalculatorType[];
        if (valid.length > 0) return valid;
      }
    } catch {}
    return DEFAULT_CALC_TAB_ORDER;
  });

  const saveCalcTabOrder = (newOrder: CalculatorType[]) => {
    setCalcTabOrder(newOrder);
    localStorage.setItem('budget-calculator-tab-order', JSON.stringify(newOrder));
  };

  const purchasePriceNum = parseFloat(purchasePrice) || 0;
  const arvNum = parseFloat(arv) || 0;

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

  const showEstimatedCosts = calculatorType === 'fix_flip' || calculatorType === 'new_construction';

  if (isCollapsed) {
    if (isMobile) {
      return (
        <div className="border-b bg-muted/30">
          <button
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold"
            onClick={() => setIsCollapsed(false)}
          >
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              Deal Parameters
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      );
    }
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

  const costLabel = (label: string, mode: CostMode, pct: string) => {
    if (mode === 'pct') return `${label} (${pct}%)`;
    return `${label} (flat)`;
  };

  return (
    <div className={isMobile ? "w-full border-b bg-muted/30 flex flex-col max-h-[60vh]" : "w-80 border-r bg-muted/30 flex flex-col"}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm">Deal Parameters</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-8 w-8"
        >
          {isMobile ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronLeft className="h-4 w-4" />}
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

          {/* Quick Estimates - Fix & Flip only */}
          {showEstimatedCosts && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    Estimated Costs
                  </h4>
                  <button
                    onClick={() => setIsEditingCosts(!isEditingCosts)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isEditingCosts ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {isEditingCosts ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Buy Closing Costs</Label>
                        <ModeToggle mode={closingMode} onChange={onClosingModeChange} />
                      </div>
                      <Input
                        type="number"
                        className="font-mono h-8"
                        value={closingMode === 'pct' ? closingPct : closingFlat}
                        onChange={(e) => closingMode === 'pct' ? onClosingPctChange(e.target.value) : onClosingFlatChange(e.target.value)}
                        placeholder={closingMode === 'pct' ? '2' : '0'}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">Holding Costs</Label>
                        <ModeToggle mode={holdingMode} onChange={onHoldingModeChange} />
                      </div>
                      <Input
                        type="number"
                        className="font-mono h-8"
                        value={holdingMode === 'pct' ? holdingPct : holdingFlat}
                        onChange={(e) => holdingMode === 'pct' ? onHoldingPctChange(e.target.value) : onHoldingFlatChange(e.target.value)}
                        placeholder={holdingMode === 'pct' ? '3' : '0'}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs">Sell Closing Costs</Label>
                          <ModeToggle mode={sellClosingMode} onChange={onSellClosingModeChange} />
                        </div>
                        <Switch
                          checked={includeSellClosingCosts}
                          onCheckedChange={onSellClosingCostsChange}
                        />
                      </div>
                      {includeSellClosingCosts && (
                        <Input
                          type="number"
                          className="font-mono h-8"
                          value={sellClosingMode === 'pct' ? sellClosingPct : sellClosingFlat}
                          onChange={(e) => sellClosingMode === 'pct' ? onSellClosingPctChange(e.target.value) : onSellClosingFlatChange(e.target.value)}
                          placeholder={sellClosingMode === 'pct' ? '6' : '0'}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{costLabel('Buy Closing', closingMode, closingPct)}</span>
                      <span className="font-mono">{formatCurrency(closingCostsBuy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{costLabel('Holding', holdingMode, holdingPct)}</span>
                      <span className="font-mono">{formatCurrency(holdingCosts)}</span>
                    </div>
                    {includeSellClosingCosts && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{costLabel('Sell Closing', sellClosingMode, sellClosingPct)}</span>
                        <span className="font-mono">{formatCurrency(closingCostsSell)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Rental Fields */}
          {calculatorType === 'rental' && (
            <>
              <Separator />
              <RentalFields
                values={rentalFields}
                onChange={onRentalFieldChange}
                arv={arvNum}
                purchasePrice={purchasePriceNum}
              />
            </>
          )}

          <Separator />

          {/* Save / Apply */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="save" className="text-xs gap-1">
                <Save className="h-3 w-3" />
                Save
              </TabsTrigger>
              <TabsTrigger value="apply" className="text-xs gap-1">
                <FolderOpen className="h-3 w-3" />
                Apply
              </TabsTrigger>
            </TabsList>

            <TabsContent value="save" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label htmlFor="budgetName" className="text-xs">Budget Name</Label>
                <Input
                  id="budgetName"
                  placeholder="e.g. Standard 3/2 Flip"
                  value={budgetName}
                  onChange={(e) => onBudgetNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetDesc" className="text-xs">Description (optional)</Label>
                <Textarea
                  id="budgetDesc"
                  placeholder="Notes about this budget..."
                  className="min-h-[60px] resize-none"
                  value={budgetDescription}
                  onChange={(e) => onBudgetDescriptionChange(e.target.value)}
                />
              </div>

              <Button
                onClick={onSave}
                className="w-full gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Budget
              </Button>
            </TabsContent>

            <TabsContent value="apply" className="space-y-3 mt-3">
              <div className="space-y-2">
                <Label className="text-xs">Select Project</Label>
                <ProjectAutocomplete
                  projects={projects}
                  value={selectedProject}
                  onSelect={setSelectedProject}
                />
              </div>

              <Button
                onClick={() => onApplyToProject(selectedProject)}
                className="w-full gap-2"
                disabled={!selectedProject || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                Apply to Project
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
