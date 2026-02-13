

## Add Project Picker with Starred Quick-Select to Business Expenses

### What Changes
The "Add Business Expense" modal will get a new **Project** field with:
1. A `ProjectAutocomplete` dropdown to select any active project
2. A row of quick-select buttons showing your **starred projects** (up to 6), so you can assign a project with a single tap instead of opening the dropdown every time
3. The selected project name will also show in the expenses table as a column

### Database Migration
Add an optional `project_id` column to `business_expenses`:

```sql
ALTER TABLE public.business_expenses
  ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
```

No RLS changes needed -- the existing policies already cover this table.

### UI Details

**In the Add Expense modal** (above the Category field):
- Label: "Project (optional)"
- Row of starred project buttons (compact chips/badges) -- tap one to instantly select it, tap again to deselect
- Below the chips: the full `ProjectAutocomplete` dropdown for searching all projects
- The selected project highlights in the chip row and syncs with the dropdown

**In the expenses table**:
- Add a "Project" column between Vendor and Category showing the linked project name (or blank if none)

**In the detail modal** (`BusinessExpenseDetailModal`):
- Show the linked project name if one is assigned

### Technical Steps

1. **Migration**: Add `project_id` column to `business_expenses`
2. **`src/pages/BusinessExpenses.tsx`**:
   - Import `useProfile` hook to access `starredProjects`
   - Add `projectId` to `formData` state (default empty string)
   - Add starred project chip buttons + `ProjectAutocomplete` to the form
   - Include `project_id` in the insert payload
   - Add `project_id` to `DBBusinessExpense` interface
   - Add Project column to the table, looking up project name from the `projects` array
3. **`src/components/BusinessExpenseDetailModal.tsx`**:
   - Accept projects list as prop, display linked project name if present
