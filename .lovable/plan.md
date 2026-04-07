

## Plan: Add Info Tooltips to Interest Calculation Options + Fix Build Errors

### 1. Add info tooltips to Interest Calculation dropdown

**File: `src/components/loans/AddLoanModal.tsx`**

Add a tooltip (info "i" icon) next to each interest calculation option in the dropdown, explaining what each method means:

- **Standard (30/360)**: Assumes 30-day months and 360-day year. Most common for conventional and commercial loans.
- **Actual/360**: Uses actual days in the month but divides by 360. Common for hard money and bridge loans — results in slightly higher interest.
- **Actual/365**: Uses actual days in the month divided by 365. More precise, common for private money loans.
- **Simple Interest**: Interest = Principal × Rate × Time. No compounding. Common for short-term or seller-financing deals.

Each `SelectItem` will include a small description below the label text, using a two-line layout (label + muted description). An info icon (`Info`) will also be added next to the "Interest Calculation" label with a tooltip summarizing the field.

### 2. Fix build errors in `useLoans.ts`

**File: `src/hooks/useLoans.ts`** — Lines 40, 53, 103, 116

Change `as Loan` / `as LoanDraw[]` / `as LoanPayment[]` casts to use `as unknown as` to satisfy TypeScript when Supabase generated types don't match the app types exactly.

### Files to change
- `src/components/loans/AddLoanModal.tsx` — Enhanced dropdown with descriptions
- `src/hooks/useLoans.ts` — Fix 4 type cast errors

