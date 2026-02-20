

## Add Project Selection to Add Task Dialog

### What Changes

Add a "Project" field to the Add Task dialog using the existing `ProjectAutocomplete` component. This lets users optionally assign a task to a project when creating it from the dashboard.

### Technical Details

**`src/components/dashboard/AddTaskDialog.tsx`**

1. **Add state**: `projectId` (string, default `''`) and `projects` (fetched from database).
2. **Fetch projects**: Use a `useEffect` to query `projects` table for `id, name, address, status, project_type` on dialog open.
3. **Add Project field**: Insert a `ProjectAutocomplete` component between the Title and Description fields (or between Description and Priority). Include a "None" option so the field is optional.
4. **Reset**: Add `setProjectId('')` to `resetForm`.
5. **Insert**: Pass `project_id: projectId || null` in the `supabase.from('tasks').insert(...)` call (line 71-78).
6. **Import**: Add `ProjectAutocomplete` import and map `project_type` to `projectType` for the autocomplete component.

