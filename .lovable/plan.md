

## Plan: Add Category Presets with $/sqft Calculator

### Overview

Add a "Presets" button next to "Expand All/Collapse All" that allows users to define custom $/sqft rates for specific categories (like Painting, Flooring, Tile). When the user enters a square footage value, clicking a preset automatically calculates and inserts the budget value for that category.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/budget/BudgetCanvas.tsx` | Add Presets button, dialog, sqft input, and auto-fill logic |

---

### UI Design

**Header Controls (Updated):**
```text
┌────────────────────────────────────────────────────────┐
│ ⇅ Expand All     📐 Presets ⚙️     Sqft: [___1500___] │
└────────────────────────────────────────────────────────┘
```

**Presets Popover/Dialog (click "Presets" to open):**
```text
┌───────────────────────────────────────────┐
│ Category Presets                        X │
├───────────────────────────────────────────┤
│ Set $/sqft rates for quick calculations  │
│                                           │
│  Category          $/sqft    [Apply]      │
│ ┌──────────────┐  ┌───────┐              │
│ │ Painting     │  │ 3.50  │   [Apply]    │
│ └──────────────┘  └───────┘              │
│ ┌──────────────┐  ┌───────┐              │
│ │ Flooring     │  │ 8.00  │   [Apply]    │
│ └──────────────┘  └───────┘              │
│ ┌──────────────┐  ┌───────┐              │
│ │ Tile         │  │ 12.00 │   [Apply]    │
│ └──────────────┘  └───────┘              │
│ ┌──────────────┐  ┌───────┐              │
│ │ Drywall      │  │ 2.50  │   [Apply]    │
│ └──────────────┘  └───────┘              │
│                                           │
│              [Reset]    [Apply All]       │
└───────────────────────────────────────────┘
```

---

### Default Preset Categories

| Category | Default $/sqft |
|----------|---------------|
| Painting | $3.50 |
| Flooring | $8.00 |
| Tile | $12.00 |
| Drywall | $2.50 |
| Roofing | $5.00 |

---

### Technical Details

**File: `src/components/budget/BudgetCanvas.tsx`**

#### 1. Add imports

```typescript
import { Ruler, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
```

#### 2. Update props interface

```typescript
interface BudgetCanvasProps {
  categoryBudgets: Record<string, string>;
  onCategoryChange: (category: string, value: string) => void;
  sqft?: string;  // Optional: passed from parent if available
  onSqftChange?: (value: string) => void;
}
```

#### 3. Define preset types and defaults

```typescript
interface CategoryPreset {
  category: string;
  label: string;
  pricePerSqft: number;
}

const DEFAULT_CATEGORY_PRESETS: CategoryPreset[] = [
  { category: 'painting', label: 'Painting', pricePerSqft: 3.50 },
  { category: 'flooring', label: 'Flooring', pricePerSqft: 8.00 },
  { category: 'tile', label: 'Tile', pricePerSqft: 12.00 },
  { category: 'drywall', label: 'Drywall', pricePerSqft: 2.50 },
  { category: 'roofing', label: 'Roofing', pricePerSqft: 5.00 },
];

const PRESETS_STORAGE_KEY = 'budget-category-presets';
```

#### 4. Add state for presets and sqft

```typescript
const [sqft, setSqft] = useState<string>('');
const [presets, setPresets] = useState<CategoryPreset[]>(DEFAULT_CATEGORY_PRESETS);
const [editingPresets, setEditingPresets] = useState<CategoryPreset[]>([]);
const [isPresetsOpen, setIsPresetsOpen] = useState(false);
```

#### 5. Load presets from localStorage on mount

```typescript
useEffect(() => {
  const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setPresets(parsed);
      }
    } catch (e) {
      console.error('Failed to parse stored presets:', e);
    }
  }
}, []);
```

#### 6. Handle applying a single preset

```typescript
const handleApplyPreset = (preset: CategoryPreset) => {
  const sqftNum = parseFloat(sqft) || 0;
  if (sqftNum <= 0) {
    toast.error('Please enter square footage first');
    return;
  }
  const calculated = sqftNum * preset.pricePerSqft;
  onCategoryChange(preset.category, calculated.toFixed(2));
};
```

#### 7. Handle applying all presets at once

```typescript
const handleApplyAll = () => {
  const sqftNum = parseFloat(sqft) || 0;
  if (sqftNum <= 0) {
    toast.error('Please enter square footage first');
    return;
  }
  presets.forEach(preset => {
    const calculated = sqftNum * preset.pricePerSqft;
    onCategoryChange(preset.category, calculated.toFixed(2));
  });
  setIsPresetsOpen(false);
};
```

#### 8. Handle saving edited presets

```typescript
const handleSavePresets = () => {
  setPresets(editingPresets);
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(editingPresets));
};

const updatePresetRate = (index: number, value: number) => {
  setEditingPresets(prev => prev.map((p, i) => 
    i === index ? { ...p, pricePerSqft: value } : p
  ));
};
```

#### 9. Update the header controls UI

```tsx
<div className="flex items-center justify-between mb-2 gap-4">
  <div className="flex items-center gap-2">
    <button
      onClick={toggleAll}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {allExpanded ? (
        <>
          <ChevronsDownUp className="h-3.5 w-3.5" />
          Collapse All
        </>
      ) : (
        <>
          <ChevronsUpDown className="h-3.5 w-3.5" />
          Expand All
        </>
      )}
    </button>

    <Popover open={isPresetsOpen} onOpenChange={setIsPresetsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-4">
          <Ruler className="h-3.5 w-3.5" />
          Presets
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        {/* Presets content here */}
      </PopoverContent>
    </Popover>
  </div>

  <div className="flex items-center gap-2">
    <span className="text-xs text-muted-foreground">Sqft:</span>
    <Input
      type="number"
      value={sqft}
      onChange={(e) => setSqft(e.target.value)}
      placeholder="1500"
      className="h-7 w-24 text-sm"
    />
  </div>
</div>
```

#### 10. Popover content for presets

```tsx
<PopoverContent className="w-80" align="start">
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-medium text-sm">Category Presets</h4>
      <button
        onClick={() => setEditingPresets([...presets])}
        className="p-1 hover:bg-accent rounded-sm"
      >
        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
    <p className="text-xs text-muted-foreground">
      Calculate category budgets from $/sqft rates
    </p>
    
    <div className="space-y-2">
      {presets.map((preset, index) => {
        const sqftNum = parseFloat(sqft) || 0;
        const calculated = sqftNum * preset.pricePerSqft;
        return (
          <div key={preset.category} className="flex items-center justify-between gap-2">
            <span className="text-sm flex-1">{preset.label}</span>
            <span className="text-xs text-muted-foreground w-16">
              ${preset.pricePerSqft}/sqft
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyPreset(preset)}
              disabled={sqftNum <= 0}
              className="h-6 text-xs"
            >
              {sqftNum > 0 ? `$${calculated.toLocaleString()}` : 'Apply'}
            </Button>
          </div>
        );
      })}
    </div>
    
    <div className="flex justify-end pt-2 border-t">
      <Button
        size="sm"
        onClick={handleApplyAll}
        disabled={parseFloat(sqft) <= 0}
      >
        Apply All
      </Button>
    </div>
  </div>
</PopoverContent>
```

---

### User Flow

1. User enters square footage in the "Sqft" input (e.g., 1500)
2. User clicks "Presets" to open the popover
3. Each preset row shows: category name, $/sqft rate, and calculated total
4. Click "Apply" next to a category to auto-fill that budget field
5. Or click "Apply All" to fill all preset categories at once
6. Click the settings icon to edit $/sqft rates (persisted to localStorage)

---

### Storage

Custom presets are stored in localStorage under `budget-category-presets`:

```json
[
  {"category": "painting", "label": "Painting", "pricePerSqft": 3.50},
  {"category": "flooring", "label": "Flooring", "pricePerSqft": 9.00},
  {"category": "tile", "label": "Tile", "pricePerSqft": 14.00},
  {"category": "drywall", "label": "Drywall", "pricePerSqft": 2.75},
  {"category": "roofing", "label": "Roofing", "pricePerSqft": 5.50}
]
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/budget/BudgetCanvas.tsx` | Add Presets popover, sqft input, preset state management, apply logic, localStorage persistence |

