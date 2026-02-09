

## Plan: Fix Project Selection in Split Expense Modal

### Problem Identified

The Split Expense modal's Project dropdown is not responding to selections. The console shows:

```
Warning: Function components cannot be given refs. 
Check the render method of `SplitExpenseModal`.
at Select
```

This is a known Radix UI issue when **Select components are nested inside Dialog components**. Both use Portals, and the Dialog's overlay can intercept pointer events intended for the Select dropdown.

### Root Cause

When you click on a `SelectItem`, the click event bubbles up and gets captured by the Dialog's overlay event handler, which then closes the Select without registering the selection.

### Solution

Add `modal={false}` to each `Select` component inside the `SplitExpenseModal`. This prevents the Select from creating its own modal context that conflicts with the Dialog's modal context.

---

### Technical Changes

**File: `src/components/SplitExpenseModal.tsx`**

#### Change 1: Project Select (Lines 226-243)

Add `modal={false}` to the Project Select:

```typescript
// Before
<Select
  value={split.projectId}
  onValueChange={(value) => {
    updateSplit(split.id, 'projectId', value);
    updateSplit(split.id, 'categoryValue', '');
  }}
>

// After
<Select
  value={split.projectId}
  onValueChange={(value) => {
    updateSplit(split.id, 'projectId', value);
    updateSplit(split.id, 'categoryValue', '');
  }}
  modal={false}
>
```

#### Change 2: Category Select (Lines 248-263)

Add `modal={false}` to the Category Select:

```typescript
// Before
<Select
  value={split.categoryValue}
  onValueChange={(value) => updateSplit(split.id, 'categoryValue', value)}
  disabled={!split.projectId}
>

// After
<Select
  value={split.categoryValue}
  onValueChange={(value) => updateSplit(split.id, 'categoryValue', value)}
  disabled={!split.projectId}
  modal={false}
>
```

---

### Why This Works

- The `modal` prop on Radix Select controls whether the Select creates its own focus trap and modal behavior
- When `modal={false}`, the Select allows events to propagate normally without conflicting with the parent Dialog's event handling
- This is the standard fix for using Select inside Dialog in Radix UI

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/SplitExpenseModal.tsx` | Add `modal={false}` to both Project and Category Select components |

