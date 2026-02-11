

## Fix: +/- Buttons Should Update the Input Value Immediately

### Problem
When clicking the `-` or `+` buttons in the goal editor, the input field stays at its old value because `handleStepValue` calls `onUpdateGoal` (a database update) but never updates the local `editValue` state that controls the input.

### Change

**File: `src/components/ops/GoalsPopout.tsx`**

Update `handleStepValue` to also set the local `editValue` state so the input reflects the new number immediately:

```typescript
const handleStepValue = async (goal: Goal, delta: number) => {
  if (!onUpdateGoal) return;
  const newVal = Math.max(0, (goal.current_value || 0) + delta);
  setEditValue(String(newVal));
  await onUpdateGoal(goal.id, newVal);
};
```

One line addition, no other files affected.

