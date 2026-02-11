

## Fix: Goal Count Showing All Goals Instead of Relevant Ones

### Problem

The dashboard shows "4 goals" because there are 4 goals in the database, all with `completed_at = null` (all active). Three of these appear to be default/seeded goals that you don't want. Currently there's no way to delete unwanted goals.

### Solution: Add Delete Goal Capability

**File: `src/components/ops/GoalsPopout.tsx`**
- Add a delete button (trash icon) to each active goal card
- Wire it to a new `onDeleteGoal` callback prop

**File: `src/components/ops/CompactDashboardWidgets.tsx`**
- Add `onDeleteGoal` prop and pass it through to `GoalsPopout`

**File: `src/pages/BusinessExpenses.tsx`**
- Add `handleDeleteGoal` function that deletes the row from `quarterly_goals` table
- Update local state to remove the deleted goal
- Pass handler down through widgets

### Technical Details

Handler logic:
```typescript
const handleDeleteGoal = async (goalId: string) => {
  await supabase.from('quarterly_goals').delete().eq('id', goalId);
  setGoals(prev => prev.filter(g => g.id !== goalId));
};
```

The delete button will appear alongside the edit/complete buttons on each goal card, using a `Trash2` icon. After deleting the unwanted goals, the widget will correctly show "1 goal".
