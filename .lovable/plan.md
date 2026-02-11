

## Quarterly Goals: Relocate Add Button and Add Progress Update Feature

### 1. Move the "Add Goal" button away from the X

Currently the `+` button sits in the header row right next to the dialog's close `X`, making them easy to confuse. The fix:

- Remove the `+` button from the `DialogHeader`.
- Add a full-width "Add New Goal" button at the **bottom** of the goals list (inside the content area), styled as an outline or ghost button with the Plus icon. This gives it clear separation from the close button.

### 2. Add ability to update a goal's progress (current_value)

Each goal card will get an interactive way to increment progress. For the "Stay Under Budget on 3 Projects" example, you could tap to mark a project as under budget.

- Add a small "Update" or pencil icon button on each goal card.
- Clicking it reveals an inline input (or a +1 / -1 stepper for task goals, or a dollar input for financial goals) to change `current_value`.
- On save, update the `quarterly_goals` row in the database.
- Pass a new `onUpdateGoal` callback prop from `BusinessExpenses.tsx` through `CompactDashboardWidgets` into `GoalsPopout`.

---

### Technical Details

**File: `src/components/ops/GoalsPopout.tsx`**

- Remove the `+` Button from the `DialogHeader` (lines 84-93).
- Add a bottom "Add New Goal" button after the goals list (before the closing `</div>` of `space-y-6`).
- Add local state for editing a goal's progress (`editingGoalId`, `editValue`).
- On each goal card, add a small edit/pencil button that toggles an inline input for updating `current_value`.
- Accept new prop: `onUpdateGoal?: (goalId: string, newValue: number) => Promise<void>`.
- On confirm, call `onUpdateGoal` and update the UI optimistically.

**File: `src/components/ops/CompactDashboardWidgets.tsx`**

- Pass through the new `onUpdateGoal` prop to `GoalsPopout`.

**File: `src/pages/BusinessExpenses.tsx`**

- Add `onUpdateGoal` handler that calls `supabase.from('quarterly_goals').update({ current_value }).eq('id', goalId)` and updates local state.

**Database**: No schema changes needed -- `current_value` column already exists on `quarterly_goals`.

