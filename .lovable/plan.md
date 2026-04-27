## Remove "Remaining" subtitle under Loan Amount

The yellow `Remaining: $X` line below the Loan Amount stat card is redundant now that the Balance card (with breakdown) already shows remaining principal.

### Change
**`src/pages/LoanDetail.tsx`**
- Remove the `subtitle` field from the Loan Amount summary stat (line ~154).
- Remove the now-unused `showRemaining` and `remainingPrincipal` variables (lines ~138-139).
- Remove the subtitle rendering block in the card content (lines ~229-231) since no other stat uses it.