

## Fix Remaining Term to Use Maturity Date

### Problem
Currently `remainingTerm` is calculated as `loan.loan_term_months - payments.length`, which is inaccurate. It should reflect the actual time remaining until the effective maturity date (including extensions), and switch from months to days when under 1 month.

### Change

**`src/pages/LoanDetail.tsx`** — line 68 and line 92

1. Replace the `remainingTerm` calculation with date-based logic:
   - Compute `effectiveMaturity` as the latest `extended_to` from extensions, or `loan.maturity_date` if no extensions
   - Calculate the difference between `effectiveMaturity` and today
   - If ≥ 1 month remaining, show months (rounded down). If < 1 month, show days. If past due, show `0 days`.

2. Update the summary stat value from `\`${remainingTerm} mo\`` to the dynamically formatted string (e.g., `"4 mo"` or `"12 days"`).

### Logic
```typescript
const effectiveMaturity = extensions.length > 0
  ? extensions.reduce((latest: string, e: any) => e.extended_to > latest ? e.extended_to : latest, loan.maturity_date)
  : loan.maturity_date;
const matDate = new Date(effectiveMaturity + 'T00:00:00');
const today = new Date(); today.setHours(0,0,0,0);
const diffMs = matDate.getTime() - today.getTime();
const diffDays = Math.max(Math.ceil(diffMs / 86400000), 0);
const diffMonths = Math.floor(diffDays / 30.44);
const remainingTermLabel = diffMonths >= 1 ? `${diffMonths} mo` : `${diffDays} days`;
```

