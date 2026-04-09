

## Add Early Payoff Interest Simulator Slider

### What
Add a slider between the tab bar and the tab content that lets users simulate selling/paying off the loan early. As the user drags the slider (1 month to full remaining term), it dynamically calculates and displays the total interest accrued up to that point, plus total cost savings vs. holding to maturity.

### Changes

**`src/pages/LoanDetail.tsx`**
- Add a `useState` for `earlyPayoffMonth` defaulting to `remainingTerm`
- Between `</TabsList>` and the first `<TabsContent>`, insert a styled card/banner containing:
  - A label: "Early Payoff Simulator"
  - A `Slider` (from `@/components/ui/slider`) with min=1, max=`loan.loan_term_months`, step=1
  - Display row showing: selected month count, calculated interest accrued at that month, and savings vs full term
- Interest calculation logic:
  - For simple/interest-only loans: `principal × (rate/100) / 12 × months`
  - For amortizing loans: sum interest column from `buildAmortizationSchedule` up to the selected month
  - For draw-based loans: proportionally scale `drawInterest.totalInterest` by `months / loan_term_months`
- Import `Slider` component and `buildAmortizationSchedule` from existing code

### UI Layout
```text
┌─────────────────────────────────────────────────┐
│  Overview  │  Amortization  │  Payments         │  ← existing tabs
├─────────────────────────────────────────────────┤
│  Early Payoff Simulator                         │
│  If sold at month [====●=========] 6 of 12      │
│  Interest Accrued: $4,200  │  Savings: $4,200   │
├─────────────────────────────────────────────────┤
│  (tab content below)                            │
```

Minimal, single-file change to `LoanDetail.tsx`.

