## Plan: Add Interest-Only Loan Mode to Rental Cash Flow

Let users toggle the loan between **Amortizing** (current behavior) and **Interest-Only**. Interest-only mode pays just `loanAmount × rate / 12` each month — no principal — which usually boosts monthly cash flow.

### UI changes — `src/components/budget/RentalFields.tsx`

Add a compact segmented toggle right under the "Loan" heading, matching the existing ARV/PP pill style:

```
Loan                              [ Amortizing | Interest-Only ]
```

- Same `bg-primary text-primary-foreground` active state used elsewhere
- When Interest-Only is active, the **Term (yrs)** input is disabled and dimmed (term doesn't affect I/O payment), with a tiny helper "n/a for I/O"
- Rate, LTV slider, Points all stay enabled and behave identically

### State — `RentalFieldValues`

Add one field: `loanType: 'amortizing' | 'interest_only'` (default `'amortizing'`). Wire it through `BudgetCalculator` / `ProjectBudget` defaults so existing saved budgets fall back to `'amortizing'`.

### Calculation — `src/components/budget/RentalAnalysis.tsx`

```ts
const isIO = rentalFields.loanType === 'interest_only';
const monthlyInterestOnly = refiLoanAmount * monthlyRate;
const monthlyPI = isIO ? monthlyInterestOnly : amortizedPayment;
```

Monthly Expenses column adapts:
- **Amortizing** — keeps current 3-row breakdown (Principal Yr1 avg / Interest Yr1 avg / Total P&I)
- **Interest-Only** — single row: **Interest-Only Payment** (in `text-destructive`), no principal row, no "Yr 1 avg" subtitle. A muted caption underneath: "Principal not paid down"

Cash flow math is unchanged — it already subtracts `monthlyPI`, which now correctly reflects whichever mode is active.

### Equity Gain note

Equity Gain currently = `ARV − Purchase − Budget − closing − holding − sale closing`. It does **not** include principal paydown, so it's already correct for both modes — no change needed.

### Scope

- 2 files: `RentalFields.tsx`, `RentalAnalysis.tsx`
- 1 new field on `RentalFieldValues` with a safe default
- No schema/migration changes (rental fields live in the existing JSONB column)
- No changes to `rentalCashFlow.ts` unless you also want project-level cards to honor I/O — see question below

### Question before I build

The shared helper `src/lib/rentalCashFlow.ts` (used by dashboard project cards) currently always amortizes. Two options:

1. **Calculator-only** — Interest-Only toggle affects only the Cash Flow Analysis panel on `/calculator`. Dashboard/Project cards keep using amortizing math. Simpler, isolated.
2. **Project-wide** — Persist `loanType` on the project and have project cards / `RentalAnalysis` everywhere reflect it. Requires a small `projects` column + plumbing.

I'll go with **(1) Calculator-only** unless you tell me otherwise — it matches the scope of your other recent calculator changes and avoids a schema migration.
