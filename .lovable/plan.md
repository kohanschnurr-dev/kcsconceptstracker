

## Remove "3 Items" Badge from Quick Actions Header

### What Changes

Remove the `Badge` element that shows the item count (e.g. "3 Items") next to the "Quick Actions" heading.

### Technical Details

**`src/components/dashboard/TasksDueTodayBanner.tsx`**

- Remove the `<Badge>` element (showing `{totalActionable} Items`) from the header row.
- Remove the `totalActionable` variable since it will no longer be used.
- Remove the `Badge` import if not used elsewhere in the file.

