

## Cash Flow Calculator Updates

### Changes

1. **Loan Term: years to weeks** -- Change the "Loan Term (years)" label to "Loan Term (weeks)" and update the amortization math to convert weeks to months internally (weeks / 4.333)

2. **Add Rehab Budget field** -- Add a new "Rehab Budget" input between the Property Details row and Refi Details section. It defaults to the project's `totalBudget` (pulled from categories) with a toggle switch to enter a manual override value instead. The manual value saves to a new `cashflow_rehab_override` column on the `projects` table.

3. **Use Rehab Budget in ROI** -- Replace `totalSpent` with the rehab budget value (either `totalBudget` or manual override) in the Total Investment and Cash-on-Cash ROI calculation so ROI reflects the planned rehab cost, not just what's been spent so far.

### Technical Details

**Database Migration:**
- Add `cashflow_rehab_override` (numeric, nullable) column to `projects` table -- when null, the calculator uses `totalBudget`; when set, it uses the override value

**File: `src/components/project/CashFlowCalculator.tsx`**

1. Add new state: `rehabOverride` (number), `useManualRehab` (boolean toggle)
2. Add new prop: `initialRehabOverride` for loading saved value
3. Change `loanTermYears` state/prop/label to `loanTermWeeks` with default 1560 (30 years in weeks)
4. Update amortization: `numberOfPayments = Math.round(loanTermWeeks / 4.333)` (convert weeks to months)
5. Add a row with "Rehab Budget" input + a Switch toggle labeled "Manual". When off, field shows `totalBudget` and is read-only. When on, field is editable and saves to `cashflow_rehab_override`
6. Replace `totalSpent` with the active rehab value (`useManualRehab ? rehabOverride : totalBudget`) in `totalInvestment` and ROI calculations
7. Update `handleSave` to persist `cashflow_rehab_override` (set to value when manual, null when using project budget) and `loan_term_years` converted from weeks
8. Update breakdown text: "Rehab Spent" becomes "Rehab Budget"

**File: `src/pages/ProjectDetail.tsx`**
- Pass `initialRehabOverride={project.cashflow_rehab_override}` to `CashFlowCalculator`

