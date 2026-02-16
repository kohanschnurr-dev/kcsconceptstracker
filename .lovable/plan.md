

## Remove Refinance Toggle from Deal Sidebar

### What Changes
Remove the on/off toggle switch next to the "Refinance" heading in the Deal Sidebar. Since the Loan section now has "Regular" vs "Refi" tabs that control which analysis is shown, the toggle is redundant. The refinance input fields (LTV slider, Rate, Term, Points) will always be visible in the sidebar.

### How It Works
- The "REFINANCE" heading stays, but the Switch is removed
- The refi input fields (LTV, Rate, Term, Points) are always visible -- no longer wrapped in a conditional
- `refiEnabled` is initialized to `true` by default so the analysis components continue to use the loan values in their calculations

### Technical Details

**File: `src/components/budget/RentalFields.tsx`**
1. Remove the `Switch` import and the toggle next to the "Refinance" heading
2. Remove the `{values.refiEnabled && (...)}` conditional wrapper so the refi fields always render

**File: `src/pages/BudgetCalculator.tsx`**
1. Change `refiEnabled` default from `false` to `true` in the initial state
2. Remove the auto-populate logic tied to `refiEnabled` toggling on (no longer needed since it starts enabled)

No changes to BRRRAnalysis or RentalAnalysis -- they already read `refiEnabled` from the fields object and will see it as `true`.
