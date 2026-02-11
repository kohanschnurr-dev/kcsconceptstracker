

## Remove "Tomorrow" Label from Weather Widget

### Change

**File: `src/components/calendar/WeatherWidget.tsx`**

In the `formatDay` function, remove the "Tomorrow" check so that all days except "Today" display their weekday abbreviation (Mon, Tue, Wed, etc.).

```text
Before:
  if (date === today) return 'Today';
  if (date === tomorrow) return 'Tomorrow';
  return weekday;

After:
  if (date === today) return 'Today';
  return weekday;
```

One small change, no other files affected.

