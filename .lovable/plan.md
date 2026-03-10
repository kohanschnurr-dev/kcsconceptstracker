

## Fix: Calendar Categories Not Loading from Settings

**Root cause:** The Settings page uses `useCustomCategories` which saves categories as `{ value, label, group, isCustom }` — there is no `groupLabel` field. But `getCalendarCategories()` requires all four fields including `groupLabel` to pass validation, so every saved category is filtered out as "invalid."

**Fix in `src/lib/calendarCategories.ts`:**

Update `getCalendarCategories()` to:
1. Only require `value`, `label`, and `group` (not `groupLabel`)
2. Reconstruct `groupLabel` from the `CATEGORY_GROUPS` lookup when missing

```ts
const valid = parsed
  .filter(c => c.value && c.label && c.group)
  .map(c => ({
    ...c,
    groupLabel: c.groupLabel || CATEGORY_GROUPS[c.group as CategoryGroup]?.label || c.group,
  }));
```

This single change makes `getCalendarCategories()` compatible with data saved by the Settings page while still sanitizing truly broken entries.

