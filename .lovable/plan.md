

## Fix: Stop Manage Users Card from Auto-Refreshing

### Root Cause

React Query retries failed queries 3 times by default (with exponential backoff). If any of the three team queries (team, members, invitations) fail, they enter a retry loop that keeps the loading spinner visible. The card shows a spinner for the entire duration of retries, making it look like it's endlessly refreshing.

### Changes

**File: `src/hooks/useTeam.ts`**

Add `retry: false` to all three `useQuery` calls (team, team-members, team-invitations). This way, if a query fails, it fails once and shows the data (or empty state) instead of retrying in a loop with a spinner.

Additionally, change error handling in the members and invitations queries to log errors and return empty arrays instead of throwing -- this prevents the error state from blocking the rest of the UI.

```
// For each useQuery:
{
  queryKey: [...],
  queryFn: async () => { ... },
  enabled: ...,
  retry: false,       // <-- add this
  staleTime: 30000,   // <-- prevent unnecessary refetches for 30s
}
```

For the members and invitations query functions, wrap in try/catch to gracefully degrade:

```typescript
// Instead of: if (error) throw error;
// Do:
if (error) {
  console.error('Failed to fetch team members:', error);
  return [];
}
```

### Summary

| Change | Why |
|--------|-----|
| `retry: false` on all 3 queries | Stop retry loops that cause repeated spinner |
| `staleTime: 30000` | Prevent refetching every time component re-renders |
| Graceful error handling | Return empty data instead of throwing, so UI still renders |

No database or other file changes needed.

