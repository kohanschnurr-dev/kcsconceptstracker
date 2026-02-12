

## Add 6-Pin Star Feature to Dashboard

### What Changes

1. **Increase the pin limit from 3 to 6** in the profile hook so you can star more projects.

2. **Show star icons on dashboard project cards** by passing the star/unstar props that `ProjectCard` already supports but the dashboard currently doesn't use.

3. **Keep sorting logic as-is** -- pinned projects appear first (in the order they were pinned), followed by unpinned projects sorted by most recent start date.

4. **Show a toast** when you try to pin a 7th project, letting you know the limit.

### Technical Details

**File: `src/hooks/useProfile.ts`** (~line 119)
- Change `current.length >= 3` to `current.length >= 6`

**File: `src/pages/Index.tsx`** (~lines 195-200, the ProjectCard render)
- Import and use `useProfile` hook's `isProjectStarred` and `toggleStarProject`
- Pass `isStarred={isProjectStarred(project.id)}` and `onToggleStar` handler to each `ProjectCard`
- In the `onToggleStar` handler, call `toggleStarProject.mutate(projectId)` and show a toast on the "max" error

### Files Modified
- `src/hooks/useProfile.ts` -- raise star limit from 3 to 6
- `src/pages/Index.tsx` -- wire up `isStarred` and `onToggleStar` on dashboard project cards, add max-reached toast
