
## Replace MAO Gauge with Gross Margin % Gauge for Contractor Mode

### What to Change

In the sticky header bar (the `px-6 py-3 border-b bg-muted/30` div at line ~512), the `MAOGauge` component is rendered unconditionally for all calculator types. For the **Contractor** mode, replace this with a clean **Gross Margin %** display instead.

### Contractor Gross Margin Calculation

The contractor math is:
- **Contract Value** = `arvNum` (the "Contract Value" field)
- **Job Cost** = `totalBudget` (sum of all category budgets)
- **Gross Profit** = Contract Value − Job Cost
- **Gross Margin %** = (Gross Profit / Contract Value) × 100

A healthy contractor margin is typically 20–30%+.

---

### Plan

#### 1. Add a computed `contractorMargin` value in `BudgetCalculator.tsx`

Near the existing `grossProfit` / `roi` calculations (~line 216), add:

```tsx
const contractorGrossProfit = arvNum - totalBudget;
const contractorMargin = arvNum > 0 ? (contractorGrossProfit / arvNum) * 100 : 0;
```

#### 2. Create an inline Gross Margin Gauge in the sticky header

Replace the single `<MAOGauge ... />` render with a conditional:

```tsx
{/* Sticky header gauge area */}
<div className="px-6 py-3 border-b bg-muted/30">
  {calculatorType === 'contractor' ? (
    <ContractorMarginGauge
      contractValue={arvNum}
      jobCost={totalBudget}
    />
  ) : (
    <MAOGauge
      arv={arvNum}
      currentBudget={totalBudget}
      purchasePrice={purchasePriceNum}
      maoPercentage={maoPercentage}
      onPercentageChange={setMaoPercentage}
    />
  )}
</div>
```

#### 3. Build a `ContractorMarginGauge` component

Create a new file `src/components/budget/ContractorMarginGauge.tsx`. It mirrors the MAOGauge layout (three stat blocks + a progress bar) but shows contractor-specific metrics:

**Stat blocks:**
- **Contract Value** — `arvNum` formatted as currency
- **Job Cost (Budget)** — `totalBudget` formatted as currency  
- **Gross Profit** — `contractValue - jobCost`, colored green/red

**Progress bar:**
- Shows gross margin % visually (0–40% range, so 20% = 50% of bar)
- Color thresholds:
  - `< 10%` → red (`text-destructive`)
  - `10–19%` → amber
  - `≥ 20%` → green

**Large central display:**
- The margin % in large bold font, colored by threshold

The component will look like:

```
[Contract Value $150k]  [Job Cost $120k]  [Gross Profit $30k ✓]  [Margin: 20.0%]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━ (progress bar) ━━━━━━
Job Cost vs Contract Value  20%
```

This mirrors the familiar MAOGauge style so the UI feels consistent.

---

### Files to Modify / Create

| File | Action |
|---|---|
| `src/components/budget/ContractorMarginGauge.tsx` | **Create** — new component showing gross margin % gauge |
| `src/pages/BudgetCalculator.tsx` | **Modify** — conditionally render `ContractorMarginGauge` instead of `MAOGauge` when `calculatorType === 'contractor'` |

No database changes. No sidebar changes needed.
