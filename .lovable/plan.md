

## Reorder Budget Summary Cards

### What Changes

Swap the two rows so the big-picture numbers lead, and the cost-type breakdown sits underneath.

**File: `src/pages/ProjectBudget.tsx`**

**Row 1 (lines 675-863) — The Big Picture** will contain (in order):
1. Total All-In Costs (currently in Row 2, line 728-738)
2. Total Construction Budget (currently in Row 2, line 740-840)
3. Remaining Construction Budget (currently in Row 2, line 842-852)
4. # of Expenses (currently in Row 2, line 854-862)

**Row 2 — The Breakdown** will contain (in order):
1. Construction Costs (currently Row 1, line 677-685)
2. Loan Costs (currently Row 1, line 687-698)
3. Holding Costs (currently Row 1, line 700-711)
4. Transaction Costs (currently Row 1, line 713-724)

This is purely a reorder of the existing card markup — no logic changes needed. The current Row 1 content (4 cost-type cards) moves to Row 2, and the current Row 2 content (summary cards) moves to Row 1.

