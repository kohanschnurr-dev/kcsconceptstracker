

## Plan: Fix Project Selection State Not Updating in Split Modal

### Problem Identified

When selecting a project in the Split Expense modal, the selection doesn't visually update. The issue has two causes:

1. **State Update Race Condition**: The `onValueChange` handler calls `updateSplit` twice in quick succession:
   ```typescript
   onValueChange={(value) => {
     updateSplit(split.id, 'projectId', value);
     updateSplit(split.id, 'categoryValue', ''); // Both use stale state!
   }}
   ```
   Both calls read from the same stale `splits` array, so the second call overwrites the first.

2. **Pointer Events Issue**: The SelectContent renders in a Portal, and when `modal={false}` is on the Dialog, the Select's Portal may still have focus/pointer conflicts.

---

### Solution

#### Fix 1: Use Functional State Update (Lines 116-120)

Change `updateSplit` to use the functional form of `setSplits` to ensure each update builds on the previous state:

```typescript
// Before
const updateSplit = (id: string, field: keyof SplitLine, value: string) => {
  setSplits(splits.map(s => 
    s.id === id ? { ...s, [field]: value } : s
  ));
};

// After
const updateSplit = (id: string, field: keyof SplitLine, value: string) => {
  setSplits(prevSplits => prevSplits.map(s => 
    s.id === id ? { ...s, [field]: value } : s
  ));
};
```

#### Fix 2: Add pointer-events-auto to SelectContent (Lines 236, 256)

Add className to ensure pointer events work in the Portal:

```typescript
// Project Select
<SelectContent className="pointer-events-auto">

// Category Select  
<SelectContent className="pointer-events-auto">
```

---

### Why This Works

1. **Functional Updates**: Using `prevSplits =>` ensures each state update sees the result of the previous one, preventing the race condition.

2. **Pointer Events**: When Dialog has `modal={false}`, some browsers may still have pointer-event conflicts with Portaled content. Adding `pointer-events-auto` ensures clicks register.

---

### Technical Changes Summary

| File | Line | Change |
|------|------|--------|
| `src/components/SplitExpenseModal.tsx` | 116-120 | Use functional state update `prevSplits =>` |
| `src/components/SplitExpenseModal.tsx` | 236 | Add `className="pointer-events-auto"` to Project SelectContent |
| `src/components/SplitExpenseModal.tsx` | 256 | Add `className="pointer-events-auto"` to Category SelectContent |

