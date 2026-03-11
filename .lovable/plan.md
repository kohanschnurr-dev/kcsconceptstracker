

## Plan: Replace "Rehab" with "Construction" in Budget Calculator UI

Rename all user-facing "Rehab" labels to "Construction" across the budget calculator and related financial components. Variable names stay unchanged — only visible text strings.

### Files & Changes

**`src/pages/BudgetCalculator.tsx`**
- Subtitle: "rehab budgets" → "construction budgets"
- Profit Analysis column header: "Rehab & Holding" → "Construction & Holding"
- Line item: "Rehab Budget" → "Construction Budget"

**`src/components/budget/BRRRAnalysis.tsx`**
- Description: "Rehab equity capture" → "Construction equity capture"
- Line item: "Rehab" → "Construction"

**`src/components/project/CashFlowCalculator.tsx`**
- Label: "Rehab Budget" → "Construction Budget"
- Manual switch label context
- Breakdown line: "Rehab Budget" → "Construction Budget"

**`src/components/project/ProfitCalculator.tsx`**
- "Rehab Budget" / "Rehab Spent" → "Construction Budget" / "Construction Spent"

**`src/components/CreateBudgetModal.tsx`**
- Label: "Rehab Budget" → "Construction Budget"

