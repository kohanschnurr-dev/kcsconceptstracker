

## Plan: Update Loan Term Options and Auto-Calculate Closing Costs

### Overview

Update the Hard Money Loan Calculator with:
1. Fixed loan term buttons: 6, 12, 18 months + 30yr (360 months) option
2. Auto-calculate closing costs as 2% of purchase price by default

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Update term options array, add 30yr button with special label, calculate default closing costs as 2% of purchase price |

---

### Technical Details

**File: `src/components/project/HardMoneyLoanCalculator.tsx`**

**1. Update default closing costs calculation (line 35):**

Change default from `0` to `purchasePrice * 0.02` (2% of purchase price):

```tsx
// Before
initialClosingCosts = 0,

// After - Calculate 2% of purchase price as default
```

**2. Update useEffect to set closing costs default (around line 54):**

```tsx
// If no initial closing costs provided, default to 2% of purchase price
setClosingCosts(initialClosingCosts ?? (purchasePrice * 0.02));
```

**3. Update term options array (line 170):**

```tsx
// Before
const termOptions = [6, 12, 18];

// After - Add 360 months (30 years)
const termOptions = [6, 12, 18, 360];
```

**4. Update button display to show "30yr" for 360 months (around line 249-259):**

```tsx
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
```

**5. Update input max constraint (line 267):**

```tsx
// Before
max={36}

// After - Allow up to 360 months
max={360}
```

---

### Visual Result

**Loan Term Section:**
```text
Loan Term (Months)
┌─────┐ ┌─────┐ ┌─────┐ ┌──────┐ ┌──────────┐
│  6  │ │ 12  │ │ 18  │ │ 30yr │ │   [12]   │
└─────┘ └─────┘ └─────┘ └──────┘ └──────────┘
                                   Custom input
```

**Closing Costs (auto-filled):**
- For a $200,000 purchase price → defaults to $4,000 (2%)
- User can still override manually

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | 35 | Update default closing costs parameter |
| `src/components/project/HardMoneyLoanCalculator.tsx` | 45, 54 | Calculate default closing costs as 2% of purchase price |
| `src/components/project/HardMoneyLoanCalculator.tsx` | 170 | Add 360 to termOptions array |
| `src/components/project/HardMoneyLoanCalculator.tsx` | 258 | Display "30yr" label for 360 months |
| `src/components/project/HardMoneyLoanCalculator.tsx` | 267 | Update max to 360 |

