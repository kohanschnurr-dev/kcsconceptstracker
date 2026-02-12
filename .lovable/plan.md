

## Add Completion Date When Marking a Project Complete

### What Changes

1. **Add a `completed_date` column** to the `projects` table in the database (nullable, date type, defaults to null).

2. **When the user clicks "Complete"** in the status dropdown on the project detail page, instead of immediately changing the status, show a date picker popover so they can choose the completion date. The date defaults to today.

3. **Save the completion date** alongside the status update to the database.

4. **Clear the completion date** when the status is changed back to "Active" or "On Hold".

5. **Show the completion date** on the project detail header next to the start date (e.g., "Started May 1, 2025 -- Completed Jan 15, 2026").

6. **Show the completion date on the ProjectCard** (dashboard and projects page) next to the start date when the project is complete.

### Technical Details

**Database Migration:**
```sql
ALTER TABLE projects ADD COLUMN completed_date date;
```

**File: `src/pages/ProjectDetail.tsx`**
- In `handleStatusChange`: when `newStatus === 'complete'`, instead of saving immediately, open a completion date picker popover. On date selection, save both `status: 'complete'` and `completed_date` to the DB.
- When changing to `active` or `on_hold`, also set `completed_date: null`.
- In the header area (near line 575 where start date is shown), add a "Completed" date display when `project.completed_date` exists, formatted like the start date.

**File: `src/components/dashboard/ProjectCard.tsx`**
- Accept `completedDate` from the `Project` type.
- In the bottom grid (line 130-151), when `project.completedDate` exists, show it next to or below the start date.

**File: `src/types/index.ts`**
- Add `completedDate?: string` to the `Project` interface.

**File: `src/pages/Projects.tsx`**
- Map `completed_date` from the DB row to `completedDate` in the Project transform.

**File: `src/pages/Index.tsx`**
- Same mapping as Projects.tsx for the dashboard fetch.

### Files Modified
- Database: add `completed_date` column to `projects`
- `src/types/index.ts` -- add `completedDate` to Project interface
- `src/pages/ProjectDetail.tsx` -- completion date picker on status change, display in header
- `src/components/dashboard/ProjectCard.tsx` -- show completion date when present
- `src/pages/Projects.tsx` -- map `completed_date` from DB
- `src/pages/Index.tsx` -- map `completed_date` from DB
