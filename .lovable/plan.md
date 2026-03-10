

## Plan: Move "Assign to" and "Type" Above the Match Summary

Reorder the sections inside the Match Approval Modal so the user flow is: **assign first → review split → submit**.

### Current order (lines 1288–1530):
1. Match Summary (Receipt + QB Transaction cards)
2. Line Items / Suggested Split
3. Split Total
4. **Assign to** (project/business toggle, project search, type/cost type)

### New order:
1. **Assign to** (project/business toggle, project search, type/cost type)
2. Match Summary (Receipt + QB Transaction cards)
3. Line Items / Suggested Split
4. Split Total

### Implementation
Single file change in `src/components/SmartSplitReceiptUpload.tsx`:
- Cut the "Assignment Type & Project Selection" block (lines 1459–1530) and paste it right after `<div className="space-y-4">` on line 1289, before the Match Summary grid.

No logic changes needed — just reordering the JSX blocks.

