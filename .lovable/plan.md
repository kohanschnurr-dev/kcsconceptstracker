

## Fix: Keep Refi Loan Amount in Sync with ARV

### The Problem
When ARV is changed **after** the refi slider has been set, the displayed loan amount in the sidebar updates correctly (it's computed fresh from `arv * ltv%` each render), but the stored `refiLoanAmount` state stays stale. The analysis components (RentalAnalysis, BRRRAnalysis) read from that stale state value, causing incorrect financial calculations.

### The Fix
Add a `useEffect` in `BudgetCalculator.tsx` that recomputes and updates `refiLoanAmount` whenever `arv` changes and refi is enabled. This keeps the stored value in sync with the displayed value.

### Technical Details

**File: `src/pages/BudgetCalculator.tsx`**
- Add a `useEffect` that watches `arv` and `rentalFields.refiEnabled`. When both are truthy, recompute `refiLoanAmount` as `Math.round(arvNum * (ltvPercent / 100))` and update the rental fields state.

```typescript
useEffect(() => {
  if (rentalFields.refiEnabled) {
    const ltv = parseFloat(rentalFields.refiLtv) || 75;
    const newLoanAmount = String(Math.round(arvNum * (ltv / 100)));
    setRentalFields(prev => ({ ...prev, refiLoanAmount: newLoanAmount }));
  }
}, [arv, rentalFields.refiEnabled, rentalFields.refiLtv]);
```

This is a small, targeted fix -- one `useEffect` added to the page component. No other files need changes.

