

## Plan: Editable Baseline Tiers

### Overview

Add a settings icon next to the "Baselines" label that opens a dialog where users can edit baseline tier names and $/sqft values. Custom baselines persist via localStorage.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/budget/TemplatePicker.tsx` | Add settings icon, edit dialog, and localStorage persistence |

---

### UI Design

**Dropdown with Settings Icon:**
```text
┌──────────────────────────────────┐
│ + Start Blank                    │
├──────────────────────────────────┤
│ 📐 Baselines              ⚙️     │
│ ┌──────────────────────────────┐ │
│ │ Sqft: [___1500___]           │ │
│ └──────────────────────────────┘ │
│ ▪ Cosmetic      $35/sqft  $52,500│
│ ...                              │
└──────────────────────────────────┘
```

**Edit Baselines Dialog:**
```text
┌─────────────────────────────────────────┐
│ Edit Baseline Tiers                   X │
├─────────────────────────────────────────┤
│                                         │
│  Name                    $/sqft         │
│ ┌─────────────────────┐ ┌─────────────┐ │
│ │ Cosmetic            │ │ 35          │ │
│ └─────────────────────┘ └─────────────┘ │
│ ┌─────────────────────┐ ┌─────────────┐ │
│ │ Standard            │ │ 45          │ │
│ └─────────────────────┘ └─────────────┘ │
│ ┌─────────────────────┐ ┌─────────────┐ │
│ │ High Level          │ │ 55          │ │
│ └─────────────────────┘ └─────────────┘ │
│ ┌─────────────────────┐ ┌─────────────┐ │
│ │ Overhaul            │ │ 65          │ │
│ └─────────────────────┘ └─────────────┘ │
│                                         │
│              [Reset to Defaults]  [Save]│
└─────────────────────────────────────────┘
```

---

### Technical Details

**File: `src/components/budget/TemplatePicker.tsx`**

#### 1. Add imports

```typescript
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
```

#### 2. Define types and constants

```typescript
interface BaselineTier {
  name: string;
  pricePerSqft: number;
  description: string;
}

const DEFAULT_BASELINE_TIERS: BaselineTier[] = [
  { name: 'Cosmetic', pricePerSqft: 35, description: 'Light refresh - paint, fixtures' },
  { name: 'Standard', pricePerSqft: 45, description: 'Typical rental-ready updates' },
  { name: 'High Level', pricePerSqft: 55, description: 'Quality finishes and systems' },
  { name: 'Overhaul', pricePerSqft: 65, description: 'Major renovation work' },
];

const BASELINES_STORAGE_KEY = 'budget-baseline-tiers';
```

#### 3. Add state for baselines and edit dialog

```typescript
const [baselineTiers, setBaselineTiers] = useState<BaselineTier[]>(DEFAULT_BASELINE_TIERS);
const [isEditOpen, setIsEditOpen] = useState(false);
const [editingTiers, setEditingTiers] = useState<BaselineTier[]>([]);
```

#### 4. Load baselines from localStorage on mount

```typescript
useEffect(() => {
  const stored = localStorage.getItem(BASELINES_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 4) {
        setBaselineTiers(parsed);
      }
    } catch (e) {
      console.error('Failed to parse stored baselines:', e);
    }
  }
}, []);
```

#### 5. Handle opening the edit dialog

```typescript
const handleOpenEdit = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  setEditingTiers([...baselineTiers]);
  setIsEditOpen(true);
};
```

#### 6. Handle saving changes

```typescript
const handleSaveBaselines = () => {
  setBaselineTiers(editingTiers);
  localStorage.setItem(BASELINES_STORAGE_KEY, JSON.stringify(editingTiers));
  setIsEditOpen(false);
};

const handleResetDefaults = () => {
  setEditingTiers([...DEFAULT_BASELINE_TIERS]);
};

const updateEditingTier = (index: number, field: 'name' | 'pricePerSqft', value: string | number) => {
  setEditingTiers(prev => prev.map((tier, i) => 
    i === index ? { ...tier, [field]: value } : tier
  ));
};
```

#### 7. Update UI - Add settings icon button

In the DropdownMenuLabel for "Baselines", add a settings icon:

```tsx
<DropdownMenuLabel className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Ruler className="h-3 w-3" />
    Baselines
  </div>
  <button
    onClick={handleOpenEdit}
    className="p-1 hover:bg-accent rounded-sm transition-colors"
  >
    <Settings className="h-3 w-3 text-muted-foreground hover:text-foreground" />
  </button>
</DropdownMenuLabel>
```

#### 8. Add Edit Dialog

```tsx
<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Edit Baseline Tiers</DialogTitle>
      <DialogDescription>
        Customize your $/sqft rates for quick budget estimates
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-[1fr,100px] gap-2 text-sm font-medium text-muted-foreground">
        <span>Name</span>
        <span>$/sqft</span>
      </div>
      
      {editingTiers.map((tier, index) => (
        <div key={index} className="grid grid-cols-[1fr,100px] gap-2">
          <Input
            value={tier.name}
            onChange={(e) => updateEditingTier(index, 'name', e.target.value)}
            placeholder="Tier name"
          />
          <Input
            type="number"
            value={tier.pricePerSqft}
            onChange={(e) => updateEditingTier(index, 'pricePerSqft', parseInt(e.target.value) || 0)}
            placeholder="$/sqft"
          />
        </div>
      ))}
    </div>
    
    <DialogFooter className="flex justify-between sm:justify-between">
      <Button variant="ghost" onClick={handleResetDefaults}>
        Reset to Defaults
      </Button>
      <Button onClick={handleSaveBaselines}>
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 9. Update baseline rendering

Replace the hardcoded `BASELINE_TIERS` with the dynamic `baselineTiers` state:

```tsx
{baselineTiers.map((tier, index) => {
  const calculatedTotal = sqftNum * tier.pricePerSqft;
  return (
    <DropdownMenuItem 
      key={`${tier.name}-${index}`}
      onClick={() => handleBaselineSelect(tier)}
      className="cursor-pointer"
    >
      {/* ... same content ... */}
    </DropdownMenuItem>
  );
})}
```

---

### User Flow

1. User clicks the settings icon (gear) next to "Baselines" label
2. Dialog opens showing 4 rows with name and $/sqft inputs
3. User can rename tiers (e.g., "Cosmetic" to "Light Touch")
4. User can change $/sqft values (e.g., 35 to 40)
5. Click "Save" to persist changes to localStorage
6. "Reset to Defaults" reverts to original values

---

### Storage

Custom baselines are stored in localStorage under `budget-baseline-tiers` as JSON:

```json
[
  {"name": "Light Touch", "pricePerSqft": 40, "description": "Light refresh - paint, fixtures"},
  {"name": "Standard", "pricePerSqft": 50, "description": "Typical rental-ready updates"},
  {"name": "Premium", "pricePerSqft": 60, "description": "Quality finishes and systems"},
  {"name": "Full Gut", "pricePerSqft": 75, "description": "Major renovation work"}
]
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/budget/TemplatePicker.tsx` | Add Settings icon, edit dialog, localStorage persistence, dynamic tier rendering |

