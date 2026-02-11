

## Fix: Auto-Refresh Budget Page After Category Reassignment

The budget page (`ProjectBudget.tsx`) fetches data only once when it mounts. After renaming or reassigning a category (from Settings or inline), returning to the budget page shows stale data because the component doesn't know the underlying data changed.

### Root Cause

`fetchData()` is called in a `useEffect` with `[id]` as the dependency. Since the project ID doesn't change, no refetch happens when you navigate away and back.

### Fix

**File: `src/pages/ProjectBudget.tsx`**

Add a `visibilitychange` event listener so the page refetches whenever it regains focus (e.g., switching tabs or navigating back from Settings). This is a lightweight, reliable pattern that catches all cases where data may have changed externally.

```typescript
// Add alongside the existing useEffect
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      fetchData();
    }
  };
  window.addEventListener('visibilitychange', handleVisibility);
  // Also refetch on window focus (covers same-tab navigation)
  window.addEventListener('focus', handleVisibility);
  return () => {
    window.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleVisibility);
  };
}, [id]);
```

Additionally, add the `pathname` from `useLocation()` as a dependency on the existing fetch `useEffect`, so navigating back to the same route triggers a refetch:

```typescript
const location = useLocation(); // already imported via react-router-dom

useEffect(() => {
  fetchData();
}, [id, location.key]);
```

Using `location.key` ensures that every navigation event (even to the same URL) triggers a fresh data load. This is the most direct fix for the "navigate back and see stale data" problem.

### Summary

One small change to the existing `useEffect` dependency array -- adding `location.key` -- ensures the budget page always shows fresh data after navigating away and back.
