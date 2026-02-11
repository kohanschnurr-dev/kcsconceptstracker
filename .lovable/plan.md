

## Fix Cash Flow Calculator Save Issues

### Problem
Two issues are happening:

1. **Placeholders look like real values** -- Fields like "Interest Rate" show "7.0" and "Loan Term" shows "30" as gray placeholder text. These look like actual entered values but are not -- they're just hints. When you hit Save, the actual values (which are 0 or empty) get saved instead.

2. **Data doesn't refresh after saving** -- The save writes to the database successfully (confirmed -- your rent, taxes, insurance, HOA values ARE saved), but the parent page doesn't re-fetch the data. So if the component re-renders, it may reset to old values.

### What Will Change

**File: `src/components/project/CashFlowCalculator.tsx`**

1. **Remove misleading placeholders** -- Change default prop values so Interest Rate defaults to 7.0, Loan Term defaults to 30, Vacancy defaults to 8, and Management defaults to 10 (instead of 0 with placeholder text). This way these values are real from the start and will be saved.

2. **Refetch project data after save** -- After the save succeeds, call a callback (e.g., `onSaved`) passed from the parent to trigger a data refresh, so the parent page stays in sync with what was just saved.

**File: `src/pages/ProjectDetail.tsx`**

3. **Add refresh callback** -- Extract the project fetch logic into a reusable function and pass it as `onSaved` to the CashFlowCalculator so saving triggers a fresh data load.

### Technical Details

- In `CashFlowCalculator`, change default prop values: `initialInterestRate = 7`, `initialLoanTermYears = 30`, `initialVacancyRate = 8`, `initialManagementRate = 10` -- these match the current placeholder text but now they'll be real values
- Change `placeholder` attributes to `"0"` for those fields (since the default state covers the common case)
- Add an `onSaved?: () => void` prop to `CashFlowCalculatorProps`
- Call `onSaved?.()` after a successful save
- In `ProjectDetail.tsx`, extract `fetchProjectData` so it can be called from `onSaved`, and pass it to the `CashFlowCalculator`
