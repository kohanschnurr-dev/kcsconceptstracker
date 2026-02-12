

## Sort Projects by Start Date + Star/Pin Feature

### What Changes

1. **Sort projects by newest start date first** within each project type tab
2. **Add a star button** on each project card allowing up to 3 starred projects per type, which are always pinned to the front in the order they were starred

### Technical Details

#### 1. Database: Add `starred_projects` column to `profiles` table

Add a new JSONB column to store starred project IDs with their order:

```sql
ALTER TABLE profiles ADD COLUMN starred_projects jsonb DEFAULT '[]'::jsonb;
```

The column stores an array of project IDs, e.g. `["uuid1", "uuid2", "uuid3"]`. Order in the array = pin order.

#### 2. Hook: `useProfile.ts` -- add star mutation

- Add a `toggleStarProject` mutation that adds/removes a project ID from the `starred_projects` array
- Enforce max 3 starred projects -- if already 3, show a toast warning
- Add a helper `isProjectStarred(projectId)` getter

#### 3. Sorting: `Projects.tsx` -- update `getFilteredProjects`

Change sorting logic to:
1. Starred projects first, in their saved order
2. Then remaining projects sorted by `startDate` descending (newest first)

#### 4. UI: `ProjectCard.tsx` -- add star icon

- Add a small star icon (lucide `Star`) in the top-left or next to the project name
- Filled star = starred, outline = not starred
- Click toggles star status (with `e.stopPropagation()` to prevent card navigation)

#### 5. Dashboard: `Index.tsx` -- update active projects sorting

Apply the same sorting logic (starred first, then by start date descending) to the dashboard's active projects list, replacing the current project-type priority sort.

### Files Modified
- **Migration** -- add `starred_projects` jsonb column to `profiles`
- `src/hooks/useProfile.ts` -- add `starred_projects` to Profile interface, add `toggleStarProject` mutation and `isProjectStarred` helper
- `src/pages/Projects.tsx` -- update `getFilteredProjects` sorting: starred first, then by start date desc
- `src/components/dashboard/ProjectCard.tsx` -- add star/unstar icon button
- `src/pages/Index.tsx` -- update active projects sort to match (starred first, then newest start date)
