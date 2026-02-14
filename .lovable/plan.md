

## Fix Missing "Cash Flow" Tab for Rental Projects

### Problem
The "Cash Flow" tab doesn't appear because the user has a **previously saved tab order** for rental projects in their profile. That saved order was created before `cashflow` was added, so it doesn't include it. The `getDetailTabOrder` function returns the saved array as-is without merging in newly added tabs.

### Root Cause
In `src/hooks/useProfile.ts` line 113, when a saved tab order exists, it's returned directly:
```typescript
if (saved && Array.isArray(saved) && saved.length > 0) return saved;
```
This skips any tabs that were added to `DEFAULT_DETAIL_TAB_ORDER` after the user saved their preference.

### Fix

**`src/hooks/useProfile.ts`** (line 111-114):

Update `getDetailTabOrder` to merge any missing tabs from `defaultOrder` into the saved order. New tabs will be inserted at the position they occupy in the default order:

```typescript
const getDetailTabOrder = (projectType: string, defaultOrder: string[]): string[] => {
  const saved = (profile?.detail_tab_order as Record<string, string[]> | null)?.[projectType];
  if (saved && Array.isArray(saved) && saved.length > 0) {
    // Merge any new tabs from defaultOrder that aren't in saved
    const merged = [...saved];
    for (const tab of defaultOrder) {
      if (!merged.includes(tab)) {
        // Insert at its default position (or end)
        const defaultIdx = defaultOrder.indexOf(tab);
        const insertAt = Math.min(defaultIdx, merged.length);
        merged.splice(insertAt, 0, tab);
      }
    }
    // Also remove any tabs that no longer exist in defaultOrder
    return merged.filter(tab => defaultOrder.includes(tab));
  }
  return defaultOrder;
};
```

This ensures:
- Existing user tab reordering is preserved
- Newly added tabs (like `cashflow`) appear automatically
- Removed tabs are cleaned up

### Files to Change
- **`src/hooks/useProfile.ts`** -- update `getDetailTabOrder` to merge missing tabs from the default order into the saved order
