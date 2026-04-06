

## Plan: Order Calendar Categories by Construction Sequence

The categories are currently sorted alphabetically (both within groups and the groups themselves render in arbitrary `Object.entries` order). The `CALENDAR_CATEGORIES` array and `CATEGORY_GROUPS` object are already defined in correct construction order-of-operations. The fix is to stop alphabetically sorting and enforce the defined group order.

### Changes

**`src/lib/calendarCategories.ts`**
- In `getCalendarCategories()`: Remove the `.sort((a, b) => a.label.localeCompare(b.label))` calls (lines 132 and 141) so categories preserve their original construction-sequence order
- In `getGroupedCategories()`: Iterate using the `CATEGORY_GROUPS` key order instead of relying on `reduce` insertion order, ensuring groups appear as: Acquisition/Admin → Structural/Exterior → Rough-ins → Inspections → Interior Finishes → Milestones

**`src/components/calendar/NewEventModal.tsx`**
- In the `filteredGrouped` rendering (~line 325): Replace `Object.entries(filteredGrouped)` with an iteration that follows the `CATEGORY_GROUPS` key order, so groups always render in construction sequence

**`src/components/calendar/TaskDetailPanel.tsx`**
- Same fix for `groupedCategories` rendering: iterate in `CATEGORY_GROUPS` key order

### Result
The dropdown will show groups top-to-bottom in construction workflow order, with categories within each group also in their logical sequence (e.g., Demo before Foundation before Roofing).

### Files touched
- `src/lib/calendarCategories.ts`
- `src/components/calendar/NewEventModal.tsx`
- `src/components/calendar/TaskDetailPanel.tsx`

