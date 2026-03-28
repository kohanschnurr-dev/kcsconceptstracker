

## Plan: Simplify Cash Flow PDF — Remove Property Overview, Conditionally Hide Loan

### Changes

**File: `src/lib/cashFlowPdfExport.ts`**

1. **Remove the Property Overview section** (lines 116-130) — delete the "Property Overview" title and the 3-card grid showing Purchase Price, ARV, and Rehab Budget entirely.

2. **Conditionally include Debt Service row** — only add the "Less: Debt Service (P&I)" row to the table when `data.monthlyMortgage > 0`. When there's no loan, cash flow = NOI directly.

3. **Remove loan info line** (line 148) — the `Loan: $X at Y% for Z months` text below the table is removed entirely (already conditional, but should be fully removed).

4. **Conditionally show CoC ROI** — only include the Cash-on-Cash ROI summary card when there's a loan (it's meaningless without one). Keep Monthly Cash Flow, Annual Cash Flow, and Cap Rate.

### Files touched
- `src/lib/cashFlowPdfExport.ts` (~15 lines changed/removed)

