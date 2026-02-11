

## Filter Out Completed Projects from Daily Logs & Tasks

### Problem
The project selection dropdown in the Daily Logs page shows all projects, including ones with "complete" status. Per the existing convention (used in Calendar, New Daily Log Modal, etc.), completed projects should be excluded.

### Change

**File: `src/pages/DailyLogs.tsx`** (1 line change)

In the `fetchProjects` function (line 169), add `.neq('status', 'complete')` to the query:

```typescript
const { data, error } = await supabase
  .from('projects')
  .select('id, name')
  .neq('status', 'complete')   // <-- add this line
  .order('name');
```

This single filter ensures completed projects won't appear in:
- The project dropdown when creating a new task (Master Pipeline)
- The project list shown on task rows

This matches the existing pattern used in `NewDailyLogModal` (which filters `.eq('status', 'active')`) and the `ProjectAutocomplete` component (which filters out `complete` status).

