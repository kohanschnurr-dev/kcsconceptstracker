

## Fix Calendar Crash — Null Safety in Category Filtering

**Root cause:** `getCalendarCategories()` loads custom categories from localStorage. If any saved category object is missing `label` or `groupLabel` (e.g. corrupted data, older format), the `useMemo` filter in `NewEventModal.tsx` line 85-86 calls `.toLowerCase()` on `undefined`, crashing the entire React tree.

**File: `src/components/calendar/NewEventModal.tsx`**

Add null guards in the `filteredCategories` useMemo filter (lines 84-87):
```ts
cat.label?.toLowerCase().includes(query) ||
cat.groupLabel?.toLowerCase().includes(query)
```

**File: `src/lib/calendarCategories.ts`**

Sanitize categories returned from localStorage (line 123) — filter out any entries missing required fields:
```ts
if (saved) {
  const parsed = JSON.parse(saved) as CalendarCategory[];
  return parsed
    .filter(c => c.value && c.label && c.group && c.groupLabel)
    .sort((a, b) => a.label.localeCompare(b.label));
}
```

This two-layer fix prevents the crash at source (bad data) and at usage (missing null check).

