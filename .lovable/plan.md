

## Show All Term Presets in Months Only

### Change

Update the `formatTermLabel` function in `src/components/project/HardMoneyLoanCalculator.tsx` to always return the raw month number as a string, removing the year conversion logic.

**Current (lines 70-73):**
```typescript
function formatTermLabel(months: number): string {
  if (months >= 12 && months % 12 === 0) return `${months / 12}yr`;
  if (months >= 24) return `${(months / 12).toFixed(1)}yr`;
  return `${months}`;
}
```

**New:**
```typescript
function formatTermLabel(months: number): string {
  return `${months}`;
}
```

This means buttons will display `6`, `12`, `18`, `360` instead of `6`, `1yr`, `18`, `30yr`. The header already says "Loan Term (Months)" so context is clear.

