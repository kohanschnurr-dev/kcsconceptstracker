

## Fix Loan Calculator Save Persistence (For Real This Time)

### Root Cause (Multiple Issues)

The previous fix only partially addressed the problem. There are actually **three** things overwriting your saved values:

1. **The preset-fetch effect (line 204-257)** re-runs whenever `initialLoanAmount` changes (which happens after save + query invalidation). It **always** overrides the loan term with "To Date" at lines 244-252, regardless of whether the user just saved. This is the biggest culprit.

2. **`lastSavedValues` only tracks 2 of 6 fields** -- it stores `loanAmount` and `interestRate` but the reset effect also resets `loanTermMonths`, `points`, `closingCosts`, and `interestOnly`. If the comparison fails for any reason, all fields get wiped.

3. **Interest rate changes don't mark as dirty** -- the `onChange` at line 757 calls `setInterestRate()` but never sets `hasUserEdited.current = true`, so the reset effect can overwrite interest rate changes.

### Fix in `src/components/project/HardMoneyLoanCalculator.tsx`

**Change 1 -- Mark ALL user edits as dirty**: Add `hasUserEdited.current = true` to every input's onChange handler (interest rate at line 757, points, closing costs, interest-only toggle).

**Change 2 -- Guard the preset-fetch effect**: Skip the "To Date" override and default preset auto-load when `hasUserEdited.current` is true. This prevents the preset effect from stomping on values after a save.

**Change 3 -- Track all saved fields in `lastSavedValues`**: Expand the ref to include all 6 fields (`loanAmount`, `interestRate`, `loanTermMonths`, `points`, `closingCosts`, `interestOnly`) and compare all of them in the reset effect before clearing the dirty flag.

**Change 4 -- Add "No Preset" option**: Add a "None / Manual" option to the presets list that clears the default preset selection and just keeps whatever values the user has entered manually, without auto-loading any preset on mount.

### Files to Change
- `src/components/project/HardMoneyLoanCalculator.tsx`
  - Add `hasUserEdited.current = true` to interest rate, points, closing costs, and interest-only onChange handlers
  - Guard preset-fetch effect with `hasUserEdited.current` check
  - Expand `lastSavedValues` to track all 6 loan fields
  - Add "No Preset / Manual" option in the presets UI

