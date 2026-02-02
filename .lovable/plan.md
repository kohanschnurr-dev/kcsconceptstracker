

## Plan: Convert Custom Loan Term Input to Popover

### Overview

Replace the always-visible custom loan term input with a compact "Custom" button that opens a small popover for entering a custom term. This saves horizontal space and keeps the UI cleaner.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Replace inline Input with a Popover triggered by a "Custom" button |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

**1. Add Popover import (line 10):**

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
```

**2. Add state for popover and custom term input (around line 76):**

```tsx
const [customTermOpen, setCustomTermOpen] = useState(false);
const [customTermInput, setCustomTermInput] = useState('');
```

**3. Replace the Loan Term section (lines 433-458):**

Current code:
```tsx
{/* Loan Term */}
<div className="space-y-2">
  <Label>Loan Term (Months)</Label>
  <div className="flex gap-2">
    {termOptions.map((term) => (
      <Button ...>
        {term === 360 ? '30yr' : term}
      </Button>
    ))}
    <Input
      type="number"
      value={loanTermMonths}
      onChange={(e) => setLoanTermMonths(Number(e.target.value))}
      className="w-20 rounded-sm"
      min={1}
      max={360}
    />
  </div>
</div>
```

New code:
```tsx
{/* Loan Term */}
<div className="space-y-2">
  <Label>Loan Term (Months)</Label>
  <div className="flex gap-2">
    {termOptions.map((term) => (
      <Button
        key={term}
        type="button"
        variant={loanTermMonths === term ? 'default' : 'outline'}
        size="sm"
        onClick={() => setLoanTermMonths(term)}
        className="flex-1 rounded-sm"
      >
        {term === 360 ? '30yr' : term}
      </Button>
    ))}
    <Popover open={customTermOpen} onOpenChange={setCustomTermOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={!termOptions.includes(loanTermMonths) ? 'default' : 'outline'}
          size="sm"
          className="rounded-sm"
        >
          {!termOptions.includes(loanTermMonths) ? loanTermMonths : 'Custom'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <div className="space-y-2">
          <Label htmlFor="custom-term" className="text-xs">Custom Term (Months)</Label>
          <div className="flex gap-2">
            <Input
              id="custom-term"
              type="number"
              value={customTermInput}
              onChange={(e) => setCustomTermInput(e.target.value)}
              className="h-8 rounded-sm text-sm"
              placeholder="e.g. 9"
              min={1}
              max={360}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = Number(customTermInput);
                  if (val > 0 && val <= 360) {
                    setLoanTermMonths(val);
                    setCustomTermOpen(false);
                    setCustomTermInput('');
                  }
                }
              }}
            />
            <Button
              size="sm"
              className="h-8"
              onClick={() => {
                const val = Number(customTermInput);
                if (val > 0 && val <= 360) {
                  setLoanTermMonths(val);
                  setCustomTermOpen(false);
                  setCustomTermInput('');
                }
              }}
            >
              Set
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</div>
```

---

### Visual Result

**Before:**
```text
Loan Term (Months)
┌────┐ ┌────┐ ┌────┐ ┌──────┐ ┌──────────┐
│  6 │ │ 12 │ │ 18 │ │ 30yr │ │   360    │  <-- Input always visible
└────┘ └────┘ └────┘ └──────┘ └──────────┘
```

**After:**
```text
Loan Term (Months)
┌────┐ ┌────┐ ┌────┐ ┌──────┐ ┌────────┐
│  6 │ │ 12 │ │ 18 │ │ 30yr │ │ Custom │  <-- Compact button
└────┘ └────┘ └────┘ └──────┘ └────────┘
                                   │
                                   ▼ (click to open popover)
                              ┌─────────────────┐
                              │ Custom (Months) │
                              │ ┌─────┐ ┌─────┐ │
                              │ │  9  │ │ Set │ │
                              │ └─────┘ └─────┘ │
                              └─────────────────┘
```

When a custom value is set (not in preset list), the button shows the value instead of "Custom" (e.g., shows "9" if 9 months is selected).

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | 10 | Add Popover import |
| `src/components/project/HardMoneyLoanCalculator.tsx` | ~76 | Add customTermOpen and customTermInput state |
| `src/components/project/HardMoneyLoanCalculator.tsx` | 433-458 | Replace Input with Popover component |

