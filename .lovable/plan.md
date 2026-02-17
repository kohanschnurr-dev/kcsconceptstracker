

## Remove Count from Logs Tab Label

### Change
On line 966 of `src/pages/ProjectDetail.tsx`, the Logs tab currently displays as `Logs (6)` by including the daily logs count. This will be changed to just display `"Logs"`.

### Technical Detail

**File: `src/pages/ProjectDetail.tsx` (line 966)**

Change:
```tsx
{tab === 'logs' ? `Logs (${dailyLogs.length})` : TAB_LABELS[tab]}
```
To:
```tsx
{TAB_LABELS[tab]}
```

This assumes `TAB_LABELS` already has a `logs` entry mapped to `"Logs"`. If not, we just use a simple fallback. Either way, the count is removed.

