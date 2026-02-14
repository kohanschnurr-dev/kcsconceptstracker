

## Fix: Projects Not Showing in Quick Log Expense Modal

### Root Cause
The `ProjectAutocomplete` component defines its own internal `Project` interface that expects `project_type` (snake_case), but the app's `Project` type uses `projectType` (camelCase). When projects are passed in, the grouping logic looks for `project_type` on each project object, finds `undefined`, and every group ends up empty -- resulting in "No projects found."

This affects both the Expenses page and the MainLayout (sidebar quick-add) modals.

### Fix

**`src/components/ProjectAutocomplete.tsx`**

Update the internal `Project` interface to accept both conventions, and update the grouping logic to check for either field:

1. Change the interface property from `project_type?: string` to `projectType?: string` (matching the app-wide `Project` type)
2. Update the grouping filter (line 83) from:
   ```ts
   projects: filteredProjects.filter(p => p.project_type === group.type)
   ```
   to:
   ```ts
   projects: filteredProjects.filter(p => p.projectType === group.type)
   ```

This single file change fixes the dropdown everywhere it's used (Expenses page, MainLayout sidebar, Business Expenses, etc.).
