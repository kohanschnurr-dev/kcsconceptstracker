

## Move Linked Loans Below Quick Estimate Calculator

### Current Order
1. Link a Loan selector
2. Linked loan cards
3. Quick Estimate Calculator (accordion)

### New Order
1. Link a Loan selector
2. Quick Estimate Calculator (accordion)
3. Linked loan cards (+ empty state message)

### Changes

**`src/components/project/ProjectLoanTab.tsx`** (lines 273-310)
- Move the Quick Estimate Calculator accordion (lines 286-310) above the linked loans section (lines 273-283)
- Update the empty state message text from "Select one above" to "Select one from the top" since the link selector remains at the top

