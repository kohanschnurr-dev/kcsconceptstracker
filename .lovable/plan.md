

## Fix: Don't Reset Category When Switching Product/Labor

### Problem
In `src/components/quickbooks/GroupedPendingExpenseCard.tsx`, line 329, the `onValueChange` handler for the Product/Labor toggle group explicitly calls `setSelectedCategory('')` every time the toggle changes. This clears the user's already-chosen category, which is frustrating since the category is typically selected first.

### Solution
Remove `setSelectedCategory('')` from the toggle handler (line 329). The category list is the same regardless of product vs labor type, so there is no reason to reset it.

### Technical Change

**File: `src/components/quickbooks/GroupedPendingExpenseCard.tsx` (line 326-331)**

Before:
```typescript
onValueChange={(value) => {
  if (value) {
    setSelectedExpenseType(value as 'product' | 'labor');
    setSelectedCategory('');
  }
}}
```

After:
```typescript
onValueChange={(value) => {
  if (value) {
    setSelectedExpenseType(value as 'product' | 'labor');
  }
}}
```

One line removed. Category selection persists across Product/Labor switches.
