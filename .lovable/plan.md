

## Allow Uncompleting Goals

### Change

**File: `src/components/ops/GoalsPopout.tsx`**

Add an "Uncomplete" button to each completed goal card in the history section. Clicking it sets `completed_at` back to `null`, moving the goal back to the active list.

**File: `src/pages/BusinessExpenses.tsx`**

Update the `handleCompleteGoal` function (or add a new `handleUncompleteGoal`) to set `completed_at = null` on the `quarterly_goals` row. Pass this as a new `onUncompleteGoal` prop through `CompactDashboardWidgets` to `GoalsPopout`.

### Technical Details

- **GoalsPopout**: In the completed goals section (`renderGoalCard` when `isCompleted = true`), add an undo/reopen button (e.g., `RotateCcw` icon) that calls `onUncompleteGoal(goal.id)`.
- **BusinessExpenses.tsx**: Add handler that runs `supabase.from('quarterly_goals').update({ completed_at: null }).eq('id', goalId)` and refreshes the goals list.
- **CompactDashboardWidgets**: Pass through the new `onUncompleteGoal` prop to `GoalsPopout`.

