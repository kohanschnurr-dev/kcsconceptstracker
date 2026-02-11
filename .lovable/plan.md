

## Collapse All Categories by Default, Auto-Expand on Template Selection

### What changes
1. Categories start **all collapsed** when the Budget Calculator loads (currently "Structure" is open by default).
2. When a template or baseline is selected, **all category groups auto-expand** and the **Profit Breakdown** section also opens automatically.

### Steps

**File: `src/components/budget/BudgetCanvas.tsx`**
- Change the initial `openGroups` state from `['Structure']` to `[]` (empty array -- all collapsed).
- Add a new optional prop `expandAll?: boolean` that, when toggled to `true`, sets `openGroups` to all group names.
- Add a `useEffect` that watches `expandAll` and opens all groups when it becomes `true`.

**File: `src/pages/BudgetCalculator.tsx`**
- Add a state `const [templateJustApplied, setTemplateJustApplied] = useState(false)`.
- In `handleSelectTemplate`, set `templateJustApplied` to `true` and also set `profitBreakdownOpen` to `true`.
- Pass `expandAll={templateJustApplied}` to `BudgetCanvas`.
- After the canvas processes the expansion, reset `templateJustApplied` back to `false` (via a callback prop or effect).

### Technical Detail
- `BudgetCanvas` gets a new prop: `expandAll?: boolean`
- A `useEffect` in BudgetCanvas reacts: when `expandAll` transitions to `true`, it sets `openGroups` to all group names, then calls an optional `onExpandHandled?.()` callback so the parent can reset the flag.
- This avoids permanently locking all groups open -- it's a one-shot trigger per template selection.
