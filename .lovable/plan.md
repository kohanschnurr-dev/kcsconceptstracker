

## Move "Purchase & Sale" Above "Other" in Category Display

### What Changes
The "Other" trade group will always appear last in the list, so custom groups like "Purchase & Sale" display above it. Currently, built-in groups (including "Other") render first, followed by custom groups. This change ensures "Other" is pushed to the bottom since it's the catch-all group.

### Technical Details

**File: `src/lib/budgetCalculatorCategories.ts`**

Update the `getAllGroupDefs()` function (~line 93) so that when building the merged result, the `other` key is always moved to the end -- both when there's no saved order and as a fallback default.

Current logic returns `{ ...BUDGET_CALC_GROUP_DEFS, ...loadCustomGroups() }` directly when no saved order exists, which puts "other" at position 6 (before any custom groups).

Updated logic:
1. After merging, extract the `other` entry
2. Delete it from the merged object
3. Re-add it at the end

This ensures "Other" is always the last group regardless of whether a custom drag order has been saved. If a user has explicitly saved an order via drag-and-drop, that saved order will continue to be respected.

