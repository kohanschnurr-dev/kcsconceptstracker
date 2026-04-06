

## Plan: Fix Edit Task Dialog Footer Layout

The footer has 4 buttons crammed into one row, causing the "Save Changes" button to get cut off. The fix is to reorganize the footer into a cleaner two-row or wrapped layout.

### Changes

**`src/components/project/ProjectTasks.tsx`**

1. **Restructure `editFooterContent`** — Stack the footer into two rows:
   - Top row: `Delete` (left) and `Add to Calendar` (right) as secondary actions
   - Bottom row: `Cancel` and `Save Changes` right-aligned as primary actions
   - Use `flex flex-col gap-2` wrapper with inner rows using `flex justify-between`

2. **Shorten button text**: Change "Save Changes" to just "Save" to prevent overflow

3. **Dialog width**: Bump `sm:max-w-md` to `sm:max-w-lg` so buttons have more room on desktop

### Files touched
- `src/components/project/ProjectTasks.tsx`

