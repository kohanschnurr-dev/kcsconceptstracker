

## Fix Empty Categories — Fall Back to Defaults When localStorage Data Is Invalid

**Root cause:** The `getCalendarCategories()` function checks localStorage first. If the key `custom-calendar-categories` exists but contains malformed data (all entries missing required fields), the sanitization filter returns an empty array. The fallback to `CALENDAR_CATEGORIES` only triggers when there's *no* localStorage key — not when the stored data is all invalid.

**File:** `src/lib/calendarCategories.ts` (lines 120-133)

**Change:** After filtering, check if the result is empty. If so, fall back to the built-in defaults:

```ts
export function getCalendarCategories(): CalendarCategory[] {
  try {
    const saved = localStorage.getItem('custom-calendar-categories');
    if (saved) {
      const parsed = JSON.parse(saved) as CalendarCategory[];
      const valid = parsed
        .filter(c => c.value && c.label && c.group && c.groupLabel);
      if (valid.length > 0) {
        return valid.sort((a, b) => a.label.localeCompare(b.label));
      }
      // All entries invalid — clear corrupted data
      localStorage.removeItem('custom-calendar-categories');
    }
  } catch (e) {
    console.error('Error loading custom calendar categories:', e);
    localStorage.removeItem('custom-calendar-categories');
  }
  return [...CALENDAR_CATEGORIES].sort((a, b) => a.label.localeCompare(b.label));
}
```

This ensures categories always render, and corrupted localStorage data is automatically cleaned up.

