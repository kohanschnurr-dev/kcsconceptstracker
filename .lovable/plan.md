
## Add "Contractor" Mode to the Budget Calculator Sidebar

### What the User Wants

Add a **Contractor** option to the Sale/Rental toggle in the Deal Parameters sidebar of the Budget Calculator. The contractor mode should:
1. Show as a 3-option switch (Sale | Rental | Contractor) — or a reorderable set where a gear icon lets users set which type appears first
2. Build out the Contractor view similar to Sale mode (same core fields: Purchase Price / Contract Value, Square Footage, Budget Name, etc.) — the user said they'll give specific field differences after it's built
3. Persist the preferred default tab order (so a contractor can put "Contractor" first and it stays there)

---

### Architecture Overview

The calculator type is stored as `CalculatorType = 'fix_flip' | 'rental'` in `DealSidebar.tsx` and propagated up to `BudgetCalculator.tsx`. The sidebar renders `Sale` and `Rental` tabs using a 2-column `TabsList`.

Changes needed across 3 files:

```
DealSidebar.tsx         — Add 'contractor' to CalculatorType, add gear+reorder UI, render Contractor fields
BudgetCalculator.tsx    — Add 'contractor' branch to analysis section, update analysisTitle/subtitleText
```

The gear icon reorder preference will be stored in `localStorage` under `'budget-calculator-tab-order'` (same pattern as similar local preferences in the app). No DB schema changes needed since this is calculator-level UI preference, not tied to project profiles.

---

### File 1: `src/components/budget/DealSidebar.tsx`

#### A. Update `CalculatorType`
```ts
export type CalculatorType = 'fix_flip' | 'rental' | 'contractor';
```

#### B. Add tab order state with localStorage persistence
```tsx
const DEFAULT_CALC_TAB_ORDER: CalculatorType[] = ['fix_flip', 'rental', 'contractor'];
const CALC_TAB_LABELS: Record<CalculatorType, string> = {
  fix_flip: 'Sale',
  rental: 'Rental',
  contractor: 'Contractor',
};

// Inside component:
const [calcTabOrder, setCalcTabOrder] = useState<CalculatorType[]>(() => {
  try {
    const saved = localStorage.getItem('budget-calculator-tab-order');
    if (saved) return JSON.parse(saved) as CalculatorType[];
  } catch {}
  return DEFAULT_CALC_TAB_ORDER;
});
const [reorderOpen, setReorderOpen] = useState(false);

const saveCalcTabOrder = (newOrder: CalculatorType[]) => {
  setCalcTabOrder(newOrder);
  localStorage.setItem('budget-calculator-tab-order', JSON.stringify(newOrder));
};
```

#### C. Replace the 2-column TabsList with dynamic 3-tab list + gear icon

The existing `<Tabs>` for type selector becomes:

```tsx
<div className="flex items-center gap-1">
  <Tabs value={calculatorType} onValueChange={(v) => onCalculatorTypeChange(v as CalculatorType)} className="flex-1">
    <TabsList className={`grid w-full h-9`} style={{ gridTemplateColumns: `repeat(${calcTabOrder.length}, 1fr)` }}>
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
```

#### D. Add Contractor-specific fields section

After the existing ARV field block, add a conditional section for contractor mode. Similar structure to Sale mode's fields. The user said they'll specify field differences later, so this initial build mirrors Sale — with "Contract Value" replacing "ARV" label:

```tsx
{/* When contractor: relabel ARV as Contract Value, hide ARV-specific label, keep same input */}
```

Since the user said "have it build out similar to Sale" and they'll give specific changes after — the initial Contractor view will use the same Purchase Price + ARV (relabeled "Contract Value") + Square Footage inputs. The "Estimated Costs" section is hidden for contractor (like it is for rental). No rental-specific fields shown.

Contractor condition: `calculatorType === 'contractor'` → hide `showEstimatedCosts` section, hide rental fields. The ARV label switches to "Contract Value" when in contractor mode.

#### E. Update `showEstimatedCosts`
```tsx
const showEstimatedCosts = calculatorType === 'fix_flip';
// (unchanged — contractor follows same hide-estimated-costs rule as rental)
```

#### F. New imports needed
```tsx
import { Settings, ArrowUp, ArrowDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { arrayMove } from '@dnd-kit/sortable';
```

---

### File 2: `src/pages/BudgetCalculator.tsx`

#### A. Update `analysisTitle` and `subtitleText` for contractor
The page uses computed strings for the header. Add a contractor branch:

```tsx
const analysisTitle = calculatorType === 'rental' 
  ? 'Rental Analysis' 
  : calculatorType === 'contractor'
  ? 'Job P&L Analysis'
  : 'Profit Analysis';

const subtitleText = calculatorType === 'rental'
  ? 'Rental property investment analysis'
  : calculatorType === 'contractor'
  ? 'Contractor job budget and profit analysis'
  : 'Fix & flip deal analysis';
```

#### B. Add contractor analysis block in the Collapsible section

After the `calculatorType === 'rental'` block (line ~715), add:

```tsx
{calculatorType === 'contractor' && (
  <Card>
    <CardHeader>
      <CardTitle>Job P&L Analysis</CardTitle>
      <CardDescription>
        Contractor job budget and gross profit breakdown
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contract Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contract</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Contract Value</span>
              <span className="font-mono">{formatCurrency(arvNum)}</span>
            </div>
          </div>
        </div>
        {/* Job Cost Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Job Cost</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Construction Budget</span>
              <span className="font-mono">{formatCurrency(totalBudget)}</span>
            </div>
          </div>
        </div>
        {/* Returns Column */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Returns</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Gross Profit</span>
              <span className={`font-mono ${(arvNum - totalBudget) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                {formatCurrency(arvNum - totalBudget)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Margin</span>
              <span className={`font-mono ${arvNum > 0 && (arvNum - totalBudget) / arvNum * 100 >= 20 ? 'text-green-500' : 'text-amber-500'}`}>
                {arvNum > 0 ? (((arvNum - totalBudget) / arvNum) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">Contract Value</p>
          <p className="text-2xl font-bold font-mono">{formatCurrency(arvNum)}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">Job Budget</p>
          <p className="text-2xl font-bold font-mono">{formatCurrency(totalBudget)}</p>
        </div>
        <div className={`p-4 rounded-lg text-center ${(arvNum - totalBudget) >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
          <p className="text-sm text-muted-foreground">Gross Profit</p>
          <p className={`text-2xl font-bold font-mono ${(arvNum - totalBudget) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {formatCurrency(arvNum - totalBudget)}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

#### C. MAO Gauge visibility
The MAO gauge in the sticky header is Sale-specific. Hide it for contractor mode (same as it currently works for rental — it still shows but isn't meaningful). We can conditionally hide it or keep it visible — user will likely specify this. For now, keep it visible so the header remains consistent.

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/budget/DealSidebar.tsx` | Add `'contractor'` to `CalculatorType`, dynamic 3-tab list with gear + up/down reorder popover persisted to localStorage, relabel ARV as "Contract Value" for contractor, hide estimated costs section for contractor |
| `src/pages/BudgetCalculator.tsx` | Add contractor branch to `analysisTitle`/`subtitleText`, add Contractor Job P&L analysis card in the collapsible analysis section |

No database changes. No new files. The user said they'll give specific field differences once the foundation is built.
