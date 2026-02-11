

## Add Goals and Rules Directly from Dashboard Cards

### What Changes
Add inline "Add" functionality to both the Goals and Rules popout dialogs so you can create new goals and rules without leaving the Business Expenses page.

### Goals Popout Changes
- Add a "+" button in the dialog header next to the title
- Clicking it reveals an inline form at the top with:
  - Title input
  - Target value input
  - Category dropdown (Financial / Task Completion)
- Submitting inserts into the database and refreshes the list
- Form collapses after adding

### Rules Popout Changes
- Add a "+" button in the dialog header next to the title
- Clicking it reveals an inline form with:
  - Title input
  - Category dropdown (Order of Operations / Vendor Requirements)
- Submitting inserts into the database and refreshes the list

### Data Flow
- Both popouts will receive an `onAdd` callback prop from the parent (`BusinessExpenses.tsx`)
- The parent already manages goals/rules state and has the Supabase insert logic pattern
- New items get inserted with the current user's ID, then the local state is updated immediately

### Technical Details

**Files modified:**

1. **`src/components/ops/GoalsPopout.tsx`**
   - Add `onAddGoal` prop: `(goal: { title: string; target_value: number; category: string }) => Promise<void>`
   - Add local state for showing the add form and form fields
   - Render inline form with Input, Select, and Button components
   - Call `onAddGoal` on submit

2. **`src/components/ops/RulesPopout.tsx`**
   - Add `onAddRule` prop: `(rule: { title: string; category: string }) => Promise<void>`
   - Add local state for the add form
   - Render inline form with Input, Select, and Button

3. **`src/pages/BusinessExpenses.tsx`**
   - Add `handleAddGoal` function that inserts into `quarterly_goals` and appends to state
   - Add `handleAddRule` function that inserts into `operation_codes` and appends to state
   - Pass these as props to the popout components via `CompactDashboardWidgets`

4. **`src/components/ops/CompactDashboardWidgets.tsx`**
   - Pass through the new `onAddGoal` and `onAddRule` props to the respective popouts
