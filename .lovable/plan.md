

## Fix Edit Task Dialog for Mobile + Add Notes & Photo Upload

### Problems
1. On mobile, the Edit Task dialog opens as a centered modal that can look awkward (partially covered, hard to interact with). It should use a Drawer (bottom sheet) on mobile instead.
2. The dialog is missing a **Notes** field (the `description` column exists in the database but isn't shown).
3. Photo upload is already present but could be more visible.

### Changes

**`src/components/project/ProjectTasks.tsx`**

1. **Use Drawer on mobile, Dialog on desktop**: Import `useIsMobile` hook and conditionally render either a `Drawer` (vaul) or `Dialog` for the edit form. This follows the pattern used elsewhere in the app.

2. **Add a Notes/Description field**: 
   - Add `editDescription` state alongside existing edit states
   - Fetch `description` in the query (already exists in DB)
   - Add `description` to the `ProjectTask` interface
   - Add a `Textarea` field labeled "Notes" between Due Date and Photos
   - Save `description` in the update call

3. **Populate description on open**: In `openEditDialog`, set `editDescription` from the task.

### Technical Details

- Use `useIsMobile()` from `@/hooks/use-mobile`
- On mobile: wrap edit form in `Drawer` / `DrawerContent` from vaul (already installed)
- On desktop: keep existing `Dialog` / `DialogContent`
- Extract the edit form into a shared variable to avoid duplication
- Add `description` to the Supabase select query and update call
- No database migration needed -- `description` column already exists on `tasks` table

