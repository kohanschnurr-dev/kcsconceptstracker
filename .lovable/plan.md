
## Rename "Refinance" to "Loan" in Sidebar

### What Changes
Rename the "REFINANCE" section heading in the Deal Sidebar to "Loan". This clarifies that the sidebar section is for inputting loan details, while the main view's "Regular/Refi" tabs handle which analysis (Cash Flow vs BRRR) is displayed.

### Technical Details

**File: `src/components/budget/RentalFields.tsx`**
- Line 155: Change `Refinance` to `Loan`
- Also update the comment on line 152 from `{/* Refinance Section */}` to `{/* Loan Section */}`

One-line text change, no logic changes.
