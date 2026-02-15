
## Add "Delete Project" Feature with Double Confirmation

### Overview
Add a delete button to the project detail page that requires two confirmation dialogs before permanently removing a project. Any QuickBooks expenses linked to the project get sent back to the pending queue.

### Changes to `src/pages/ProjectDetail.tsx`

1. **Add a "Delete Project" button** -- Place a red destructive button (with Trash2 icon) in the header area near the status dropdown. Alternatively, add it as a dropdown menu item alongside status options.

2. **Two-step confirmation flow using AlertDialog**:
   - **Step 1**: "Are you sure you want to delete this project? All project data will be permanently removed. Any categorized expenses will be sent back to the queue."
   - **Step 2**: "This action cannot be undone. Type the project name to confirm." -- Requires the user to type the project name before the delete button becomes active.

3. **Delete handler logic** (executed in order):
   - **Reset QuickBooks expenses**: Update all `quickbooks_expenses` rows where `project_id = projectId` -- set `project_id = null`, `category_id = null`, `is_imported = false`, and `cost_type = 'construction'` (default). This sends them back to the pending queue.
   - **Delete the project row**: `DELETE FROM projects WHERE id = projectId`. Because all other related tables (`expenses`, `project_categories`, `daily_logs`, `calendar_events`, `document_folders`, `project_documents`, `project_photos`, `project_info`, `project_milestones`, `project_notes`, `project_vendors`, `project_procurement_items`, `loan_payments`, `tasks`, `receipt_line_items`) have `ON DELETE CASCADE`, they will be automatically cleaned up.
   - **Navigate to `/projects`** on success with a toast confirmation.

4. **New state variables**:
   - `deleteStep` (0 | 1 | 2) -- 0 = closed, 1 = first confirmation, 2 = type-to-confirm
   - `deleteConfirmName` (string) -- text input for the name-typing confirmation
   - `deleting` (boolean) -- loading state during deletion

### Technical Detail

```text
Delete Flow:
  [Trash Button] --> AlertDialog Step 1 ("Are you sure?")
                     --> [Delete] --> AlertDialog Step 2 ("Type project name")
                                     --> [Confirm] --> Reset QB expenses
                                                   --> DELETE project (cascades)
                                                   --> Navigate to /projects
```

**SQL operations in the handler:**
```typescript
// 1. Reset QB expenses back to queue
await supabase.from('quickbooks_expenses')
  .update({ project_id: null, category_id: null, is_imported: false })
  .eq('project_id', projectId);

// 2. Delete the project (cascades to all child tables)
await supabase.from('projects')
  .delete()
  .eq('id', projectId);
```

### Files to Change
- `src/pages/ProjectDetail.tsx` -- Add delete button, two AlertDialogs, and delete handler
