
## Add Loan Points Field to Refinance Section

### What Changes
Add a **Points** input field to the Refinance section in the Deal Sidebar that supports toggling between **% of loan** and **flat $** modes --- matching the existing pattern used elsewhere in the app for transaction/holding costs.

### How It Works
- A new "Points" field appears in the Refi section alongside Rate and Term (expanding the grid to 3 columns)
- A small toggle button (% or $) lets users switch between percentage-of-loan and flat-dollar modes
- Default: **0** points
- The computed dollar cost of points is displayed as helper text when in % mode (e.g., "= $750")
- The points value feeds into the BRRR/Rental analysis for accurate cash-invested calculations

### Technical Details

**File: `src/components/budget/RentalFields.tsx`**
1. Add `refiPoints` (string) and `refiPointsMode` (`'pct'` | `'flat'`) to `RentalFieldValues` interface
2. Expand the Rate/Term grid from `grid-cols-2` to `grid-cols-3`
3. Add a Points input with a small toggle button cycling between `%` and `$`
4. When in `%` mode, show computed dollar amount as helper text: `loanAmount * points / 100`

**File: `src/pages/BudgetCalculator.tsx`**
1. Add `refiPoints: ''` and `refiPointsMode: 'pct'` to the initial `rentalFields` state
2. Pass through to analysis components (no other changes needed for state flow since it's part of `rentalFields`)

**File: `src/components/budget/BRRRAnalysis.tsx`** (and optionally `RentalAnalysis.tsx`)
1. Read `refiPoints` and `refiPointsMode` from `rentalFields`
2. Compute points cost and factor into "Cash Invested" or display as a line item
