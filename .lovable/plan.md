

## Plan: Swap Deal Parameters to Left + Add Unified Sqft Field

### Overview

Move the "Deal Parameters" sidebar from the right side to the left side of the Budget Calculator layout, as this is where users naturally enter data first (Purchase Price, ARV, Sqft). Add a centralized "Sqft" field in the Deal Parameters that becomes the single source of truth for both the BudgetCanvas presets and TemplatePicker baselines.

---

### Current vs New Layout

```text
CURRENT:
┌──────────────────────────────────────────────────────┐
│ Header + MAO Gauge                                   │
├─────────────────────────────────┬────────────────────┤
│                                 │  Deal Parameters   │
│       Budget Canvas             │  (right sidebar)   │
│  (categories, profit breakdown) │                    │
└─────────────────────────────────┴────────────────────┘

NEW:
┌──────────────────────────────────────────────────────┐
│ Header + MAO Gauge                                   │
├────────────────────┬─────────────────────────────────┤
│  Deal Parameters   │                                 │
│  (left sidebar)    │       Budget Canvas             │
│                    │  (categories, profit breakdown) │
│  + Sqft field      │                                 │
└────────────────────┴─────────────────────────────────┘
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/pages/BudgetCalculator.tsx` | Add `sqft` state, pass to children, swap sidebar position |
| `src/components/budget/DealSidebar.tsx` | Add Sqft input field below ARV, accept sqft props |
| `src/components/budget/BudgetCanvas.tsx` | Accept sqft as prop (remove internal state) |
| `src/components/budget/TemplatePicker.tsx` | Accept sqft as prop (remove internal state) |

---

### Technical Details

#### 1. BudgetCalculator.tsx - Add Sqft State + Swap Layout

Add new state and pass to children:

```typescript
const [sqft, setSqft] = useState<string>('');
```

Update the layout to swap sidebar position (move DealSidebar before BudgetCanvas):

```tsx
{/* Main Content Area */}
<div className="flex flex-1 overflow-hidden">
  {/* Deal Sidebar - NOW ON LEFT */}
  <DealSidebar
    sqft={sqft}
    onSqftChange={setSqft}
    purchasePrice={purchasePrice}
    // ... other props
  />
  
  {/* Budget Canvas - Primary Workspace */}
  <div className="flex-1 overflow-hidden flex flex-col">
    <BudgetCanvas
      categoryBudgets={categoryBudgets}
      onCategoryChange={handleCategoryChange}
      sqft={sqft}
    />
    {/* ... profit breakdown */}
  </div>
</div>
```

Update TemplatePicker in the header to receive sqft:

```tsx
<TemplatePicker
  onSelectTemplate={handleSelectTemplate}
  onCreateNew={handleClearAll}
  currentTemplateName={currentTemplateName}
  sqft={sqft}
  onSqftChange={setSqft}
/>
```

---

#### 2. DealSidebar.tsx - Add Sqft Field

Add sqft props to interface:

```typescript
interface DealSidebarProps {
  sqft: string;
  onSqftChange: (value: string) => void;
  // ... existing props
}
```

Add Sqft input field after ARV:

```tsx
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
```

Update collapsed state icons to include a ruler for sqft visibility.

---

#### 3. BudgetCanvas.tsx - Use Sqft Prop

Update props interface to receive sqft from parent:

```typescript
interface BudgetCanvasProps {
  categoryBudgets: Record<string, string>;
  onCategoryChange: (category: string, value: string) => void;
  sqft: string;  // Now from parent
}
```

Remove internal sqft state and the Sqft input from the header. The Presets popover will use the sqft prop directly.

---

#### 4. TemplatePicker.tsx - Use Sqft Prop

Update props interface:

```typescript
interface TemplatePickerProps {
  onSelectTemplate: (template: BudgetTemplate | null) => void;
  onCreateNew: () => void;
  currentTemplateName?: string;
  sqft: string;
  onSqftChange: (value: string) => void;
}
```

Remove internal sqft state. Remove the sqft input from the dropdown (since it's now in DealSidebar). The baselines will read from the sqft prop.

---

### Deal Parameters Sidebar (Updated Layout)

```text
┌─────────────────────────────┐
│ Deal Parameters          ◀ │
├─────────────────────────────┤
│ Purchase Price              │
│ [$ _______________]         │
│                             │
│ After Repair Value (ARV)    │
│ [$ _______________]         │
│                             │
│ Square Footage              │
│ [________________]          │
├─────────────────────────────┤
│ ESTIMATED COSTS             │
│ Closing (Buy, 2%)    $X,XXX │
│ Holding (3%)         $X,XXX │
│ Closing (Sell, 6%)   $X,XXX │
├─────────────────────────────┤
│ Budget Name *               │
│ [________________]          │
│                             │
│ [Save] [Apply]              │
└─────────────────────────────┘
```

---

### User Flow

1. User opens Budget Calculator
2. Sees Deal Parameters on the LEFT (natural first step)
3. Enters Purchase Price, ARV, and **Square Footage**
4. The Sqft value automatically populates:
   - Baselines in TemplatePicker dropdown (header)
   - Category Presets in BudgetCanvas (Presets popover)
5. User can click a Baseline or Preset and it uses the same sqft value
6. Single source of truth - no duplicate sqft inputs

---

### Files to Modify

| File | Key Changes |
|------|-------------|
| `src/pages/BudgetCalculator.tsx` | Add sqft state, swap DealSidebar to left, pass sqft to children |
| `src/components/budget/DealSidebar.tsx` | Add sqft/onSqftChange props, add Sqft input field after ARV, change border from `border-l` to `border-r` |
| `src/components/budget/BudgetCanvas.tsx` | Accept sqft prop, remove internal sqft state and sqft input from header |
| `src/components/budget/TemplatePicker.tsx` | Accept sqft/onSqftChange props, remove internal sqft state and sqft input from dropdown |

