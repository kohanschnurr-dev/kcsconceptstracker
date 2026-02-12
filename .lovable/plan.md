

## Stop Budget Page from Showing Loading Screen on Tab Switch

### Problem
Every time you click away from the browser tab and come back, the Budget page runs `fetchData()` which sets `loading = true`, causing the full loading skeleton to flash. This is disruptive since the data is already displayed.

### Solution
Two changes in `src/pages/ProjectBudget.tsx`:

1. **Only show loading skeleton on initial load**: Change `setLoading(true)` so it only triggers when there's no existing data. On subsequent refreshes (tab focus, visibility change), the data refreshes silently in the background without resetting the loading state.

2. **Remove the `focus` event listener**: The `visibilitychange` event already covers tab switches. The `focus` listener fires redundantly (e.g., clicking back into the window) and doubles the unnecessary refreshes.

### Technical Detail

**File: `src/pages/ProjectBudget.tsx`**

- **Line ~182**: Change `setLoading(true)` to only set loading when no project data exists yet:
  ```ts
  const fetchData = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    // ... rest unchanged
  };
  ```

- **Lines ~271-281**: Update the visibility listener to call `fetchData(true)` (silent mode) and remove the `focus` listener:
  ```ts
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData(true);
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [id]);
  ```

### Files Modified
- `src/pages/ProjectBudget.tsx`

