

## Auto-fill Amortization Period to 360 Months

### Change

**File: `src/components/loans/AddLoanModal.tsx`**

Update the initial form state to set `amortization_period_months` from `null` to `360`.

```typescript
// Line ~47: change
amortization_period_months: null,
// to
amortization_period_months: 360,
```

This single-line change ensures the field pre-populates with 360 months when opening the "Add New Loan" modal, matching the placeholder text already shown.

