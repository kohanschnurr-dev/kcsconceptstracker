## Goal
On the Loans list, drop the separate "Type" column/badge and instead make the **Loan Purpose** itself render as a colored pill — each purpose gets its own stable color (e.g. Working Capital = purple, Construction = orange, Bridge = pink).

## Changes

### 1. `src/types/loans.ts` — add purpose color map
Add a `LOAN_PURPOSE_COLORS` map (one entry per `LOAN_PURPOSE_OPTIONS` value) plus a `getLoanPurposeColor(purpose)` helper that falls back to a neutral muted style for custom purposes. Colors use the same HSL pill convention as `LOAN_TYPE_COLORS` (`bg-[hsl]/15 text-[hsl] border-[hsl]/40`).

Proposed palette:
- Acquisition / Purchase — blue
- Construction — orange
- Purchase & Construction — burnt orange
- Renovation / Rehab — gold
- Land Acquisition — green
- Refinance — teal
- Cash-Out Refinance — cyan
- Bridge — pink
- DSCR / Long-Term Hold — sky blue
- **Working Capital — purple**
- (unknown / custom) — muted

### 2. `src/components/loans/LoanStatusBadge.tsx` — add `LoanPurposeBadge`
New component that renders the purpose string as an outline `Badge` using `getLoanPurposeColor`. Keeps `LoanTypeBadge` exported (still used in `LoanDetail.tsx` and `ProjectLoanTab.tsx`).

### 3. `src/components/loans/LoanTable.tsx`
- **Table view**: remove the "Type" column (header at line 538 + body cell at line 275). Replace the plain text cell at line 274 with `<LoanPurposeBadge purpose={loan.nickname ?? loan.lender_name} />`.
- **Card view**: 
  - Remove the `<LoanTypeBadge>` row at line 494 (the interest-rate text moves up to that row alone, or stays as-is).
  - Use the **purpose** color (not type) for the 4px left border at line 477.
  - Render the purpose name as the colored pill above the project line for instant recognition.

### 4. Out of scope
- No changes to `LoanDetail.tsx` or `ProjectLoanTab.tsx` — Type badge still useful in detail context.
- No DB changes; purpose remains a free-form string in `loans.nickname`.

## Result
The Loans table reads cleaner — one less column — and each row's purpose is instantly identifiable by color, matching the screenshot reference (purple "Working Capital" pill style).
