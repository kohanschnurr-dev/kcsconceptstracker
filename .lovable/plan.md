

## Fix Spending Label, Goals Count, and Rules Count

### 1. Change "Spending" label to "30 Day Spending"

**File: `src/components/ops/CompactDashboardWidgets.tsx`** (line 125)

Change the label from `Spending` to `30 Day Spending` so the time period is clear at a glance.

### 2. Fix Goals widget count

**File: `src/components/ops/CompactDashboardWidgets.tsx`** (lines 183-184)

The current display shows `{active}/{total} active` which counts only *incomplete* goals. This is misleading when you have 1 goal -- it can show "0/1 active" if the goal is complete, or "1/1 active" otherwise.

Change to show the **total count** plainly: e.g. `1 goal` or `3 goals`, so it accurately reflects how many goals exist.

### 3. Fix Rules widget count

**File: `src/components/ops/CompactDashboardWidgets.tsx`** (lines 217-218)

Same issue -- change from `{completed}/{total} complete` to show the total count: e.g. `1 rule` or `5 rules`, keeping it consistent with the goals widget.

### Technical Details

All changes are in a single file: `src/components/ops/CompactDashboardWidgets.tsx`.

- **Line 125**: `"Spending"` -> `"30 Day Spending"`
- **Lines 183-184**: Replace `{goalsSummary.active}/{goalsSummary.total} active` with `{goals.length} {goals.length === 1 ? 'goal' : 'goals'}`
- **Lines 217-218**: Replace `{rulesSummary.completed}/{rulesSummary.total} complete` with `{rules.length} {rules.length === 1 ? 'rule' : 'rules'}`
