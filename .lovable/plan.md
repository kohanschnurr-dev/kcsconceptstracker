

## Plan: Replace "$2M+" stat with "50+ Hours Saved Monthly"

### Single edit in `src/components/landing/StatsRow.tsx`

Replace the second stat in the `stats` array:

**Before:** `{ value: 2, prefix: "$", suffix: "M+", label: "In Budgets Managed" }`

**After:** `{ value: 50, prefix: "", suffix: "+", label: "Hours Saved Monthly" }`

The count-up animation will naturally tick from 0 → 50, which gives a satisfying visual without being too fast or too slow.

