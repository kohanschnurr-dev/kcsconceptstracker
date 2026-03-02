

## Add Separate Loan Start Date to Loan Calculator

The "To Date" calculation currently uses the project's start date as the loan origination date. This change adds a dedicated **Loan Start Date** field that defaults to the project start date but can be overridden.

---

### 1. Database Migration

Add a new column to the `projects` table:

```sql
ALTER TABLE public.projects ADD COLUMN hm_loan_start_date date;
```

No RLS changes needed -- inherits existing project row policies.

---

### 2. HardMoneyLoanCalculator.tsx -- Add Loan Start Date picker

**New prop**: `initialLoanStartDate?: string` (from `project.hm_loan_start_date`)

**New state**: `loanStartDate` -- defaults to `projectStartDate` if `initialLoanStartDate` is null.

**UI**: Add a date picker row below the Interest Rate / Loan Term row. Shows the current loan start date with a small calendar popover. When the date differs from the project start date, show a muted hint like "Project started: Jan 15, 2026".

**Logic changes**:
- Replace all references to `projectStartDate` in `calculateToDateMonths`, `toDateMonths`, and `toDateDays` computations with `loanStartDate`
- The "To Date" button and its calendar picker will calculate days/months from the loan start date instead of the project start date

**Save**: Include `hm_loan_start_date` in the `handleSave` update call. Only save the value if it differs from the project start date (otherwise save null to indicate "use project start").

---

### 3. ProjectDetail.tsx -- Pass the new prop

Pass `initialLoanStartDate={(project as any).hm_loan_start_date}` to the `HardMoneyLoanCalculator` component.

---

### Summary

| File | Change |
|------|--------|
| Migration | Add `hm_loan_start_date` column |
| `src/components/project/HardMoneyLoanCalculator.tsx` | Add loan start date state, date picker UI, update calculations |
| `src/pages/ProjectDetail.tsx` | Pass new prop |

