

## Fix: Active Projects Should Sort Before Complete Projects

### Problem
On the Projects page, when viewing "All" projects, completed projects can appear before active ones. The current sort only considers starred status and start date, ignoring project status.

### Fix

**File: `src/pages/Projects.tsx`** -- Update `getFilteredProjects` sort (lines 225-234)

Add a status-based sort tier between the starred check and the date fallback. Active projects sort before complete projects:

```
starred first (existing) -> active before complete (new) -> by start date descending (existing)
```

The sort comparator will map status to a numeric priority: `active = 0`, `on-hold = 1`, `complete = 2`. After the starred check, compare by status priority before falling back to date.

### Technical Detail

In the sort function around line 225, after the starred checks, add:

```typescript
const statusOrder = { active: 0, 'on-hold': 1, complete: 2 };
const aStatus = statusOrder[a.status] ?? 1;
const bStatus = statusOrder[b.status] ?? 1;
if (aStatus !== bStatus) return aStatus - bStatus;
```

This ensures active projects always appear before complete ones, while preserving starred-first ordering and date-based sorting within each status group.

| File | Change |
|------|--------|
| `src/pages/Projects.tsx` | Add status priority to sort in `getFilteredProjects` |

