

## Fix: Silent Refresh After "Send Back to Queue"

### Problem
When you click "Send Back to Queue" (or Delete/Save), the `onExpenseUpdated` callback calls `refreshData()`, which calls `fetchData()` without the `silent` flag. This triggers `setLoading(true)`, causing the entire page to show loading skeletons, resetting your scroll position and collapsing all UI sections.

### Solution
Change `refreshData` in `ProjectBudget.tsx` to use a silent refresh by default, so the data updates in the background without flashing loading states.

### Technical Details

**File: `src/pages/ProjectBudget.tsx`** (line 281-283)

Change:
```ts
const refreshData = () => {
  fetchData();
};
```

To:
```ts
const refreshData = () => {
  fetchData(true);
};
```

This single change makes all post-action refreshes (Send Back to Queue, Delete, Save, Edit) update data silently in the background, preserving scroll position and UI state. The full loading skeleton will only show on initial page load and navigation.

### Files Modified
- `src/pages/ProjectBudget.tsx` -- pass `silent=true` to `fetchData` in `refreshData`

