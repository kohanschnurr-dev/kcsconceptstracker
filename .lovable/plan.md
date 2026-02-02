
## Plan: Loan Calculator Updates

### Overview

Update the Loan Calculator with three key changes:
1. Rename from "Hard Money Loan Calculator" to "Loan Calculator"
2. Add editable Purchase Price field that defaults to the project's purchase price
3. Add preset loan packages for quick loading of common loan configurations

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Rename title, add editable purchase price, add loan presets dropdown |
| Database Migration | Create `loan_presets` table for user-saved presets |

---

### Technical Details

#### 1. Rename Title

Change the CardTitle from "Hard Money Loan Calculator" to "Loan Calculator"

```tsx
// Before
Hard Money Loan Calculator

// After
Loan Calculator
```

#### 2. Add Editable Purchase Price

Add a new state variable and input field for purchase price that:
- Defaults to the `purchasePrice` prop passed from the project
- Can be edited by the user for testing different scenarios
- Updates the LTV calculation dynamically

```tsx
// New state
const [editablePurchasePrice, setEditablePurchasePrice] = useState(purchasePrice);

// New input field (placed above Loan Amount)
<div className="space-y-2">
  <Label htmlFor="purchase-price">Purchase Price</Label>
  <div className="relative">
    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      id="purchase-price"
      type="number"
      value={editablePurchasePrice || ''}
      onChange={(e) => setEditablePurchasePrice(Number(e.target.value))}
      className="pl-9 rounded-sm"
      placeholder="0"
    />
  </div>
</div>
```

Update all references to use `editablePurchasePrice` instead of `purchasePrice` where appropriate (LTV calculation, slider max, closing costs default).

#### 3. Add Loan Presets Feature

**A. Create database table for user-saved presets**

```sql
CREATE TABLE public.loan_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  loan_term_months INTEGER NOT NULL,
  points NUMERIC NOT NULL,
  closing_costs_percent NUMERIC DEFAULT 2,
  interest_only BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.loan_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own loan presets"
  ON public.loan_presets
  FOR ALL
  USING (auth.uid() = user_id);
```

**B. Add preset dropdown and built-in defaults**

Built-in preset examples:
- "Standard Hard Money" - 12%, 6 mo, 3 pts, interest-only
- "Competitive Rate" - 10%, 12 mo, 2 pts, interest-only
- "Extended Term" - 11%, 18 mo, 2.5 pts, interest-only
- "Conventional 30yr" - 7%, 360 mo, 1 pt, amortizing

```tsx
// Add imports
import { ChevronDown, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Built-in presets array
const BUILT_IN_PRESETS = [
  { name: 'Standard Hard Money', interestRate: 12, loanTermMonths: 6, points: 3, closingCostsPercent: 2, interestOnly: true },
  { name: 'Competitive Rate', interestRate: 10, loanTermMonths: 12, points: 2, closingCostsPercent: 2, interestOnly: true },
  { name: 'Extended Term', interestRate: 11, loanTermMonths: 18, points: 2.5, closingCostsPercent: 2, interestOnly: true },
  { name: 'Conventional 30yr', interestRate: 7, loanTermMonths: 360, points: 1, closingCostsPercent: 2, interestOnly: false },
];

// Load preset function
const loadPreset = (preset) => {
  setInterestRate(preset.interestRate);
  setLoanTermMonths(preset.loanTermMonths);
  setPoints(preset.points);
  setClosingCosts(editablePurchasePrice * (preset.closingCostsPercent / 100));
  setInterestOnly(preset.interestOnly);
  toast.success(`Loaded "${preset.name}" preset`);
};
```

**C. Add Save Preset functionality**

Add a button to save current loan settings as a new preset (opens a simple dialog to name it).

---

### UI Layout Update

```text
Card Header:
┌─────────────────────────────────────────────────────────────┐
│ 🏛 Loan Calculator         [Load Preset ▼] [Save Preset] [Save] │
└─────────────────────────────────────────────────────────────┘

Left Column (Inputs):
┌───────────────────────────────────────┐
│ Purchase Price (NEW - editable)       │
│ $ [200,000]                           │
├───────────────────────────────────────┤
│ Loan Amount                           │
│ $ [150,000] ────────○────── 75% LTV   │
├───────────────────────────────────────┤
│ ... (rest of existing fields)         │
└───────────────────────────────────────┘
```

---

### Files to Create/Modify

| File | Action | Changes |
|------|--------|---------|
| Database | Create | `loan_presets` table with RLS |
| `src/components/project/HardMoneyLoanCalculator.tsx` | Modify | Rename title, add purchase price input, add preset dropdown/save |

---

### Implementation Steps

1. Create database migration for `loan_presets` table
2. Update component:
   - Rename title to "Loan Calculator"
   - Add `editablePurchasePrice` state initialized from prop
   - Add Purchase Price input field before Loan Amount
   - Update LTV and slider max calculations to use editable value
   - Add built-in presets array
   - Add preset dropdown in header
   - Add load preset functionality
   - Add save preset button and dialog
   - Fetch user's saved presets on mount
