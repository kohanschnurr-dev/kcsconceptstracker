

## Maximize Loan Detail Layout on Desktop

### Problem
The loan detail page is constrained to `max-w-5xl` (~64rem / 1024px), leaving significant whitespace on wider screens. The Payments tab and other content areas feel sparse.

### Changes

**`src/pages/LoanDetail.tsx`**
- Change the container from `max-w-5xl` to `max-w-7xl` (~80rem / 1280px) to better fill wide desktop screens while still maintaining readability.
- This affects the stats row, overview grid, amortization table, draw schedule, and payments tab — all will stretch to use the available space.

Single line change: `max-w-5xl mx-auto` → `max-w-7xl mx-auto`.

