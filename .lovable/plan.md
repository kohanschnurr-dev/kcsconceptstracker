

## Show Loan Tab Content for Rental Projects

### What's happening
The Loan tab is now visible for rental projects (fixed earlier), but its **content** is still hidden behind a `{!isRental && ...}` guard on line 809. So the tab appears but shows a blank page.

### Change

**File: `src/pages/ProjectDetail.tsx` (line 809-826)**

Remove the `{!isRental && ...}` wrapper so the Loan tab content renders for all project types. The content includes:
- **HardMoneyLoanCalculator** -- the loan calculator with interest, term presets, and payoff timeline
- **LoanPayments** -- the payment history table at the bottom

Both components are project-type agnostic and will work for rentals as-is.

Also update the AlertDialog description (line 442) to remove the outdated text saying "the Loan tab will be hidden" since it will no longer be hidden after conversion.

### Summary
- One file changed (`ProjectDetail.tsx`)
- Remove the `!isRental` conditional around the loan tab content
- Update the convert-to-rental dialog text
