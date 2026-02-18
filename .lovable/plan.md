
## Improve the "Show Empty Categories" Toggle UI

### Current Problem
The toggle is a plain text link at the bottom of the table: `"Show all categories (X hidden)"`. It blends into the page and feels disconnected from the table it controls.

### Better UI Approach

Replace the plain text button with a **styled chip/badge** in the **table header row**, right next to the column headers. This is a common pattern (similar to GitHub's "X hidden items" in issue lists or Notion's collapsed items).

Specifically:

1. **Move the control to the table header area** -- Add a small toggle chip on the right side of the "Budget by Category" `CollapsibleTrigger` header bar (next to the category count), OR place it as a footer row inside the table itself styled as a distinct "dimmed" row.

2. **Best option -- a subtle badge in the table footer area**, styled as a full-width row with a dashed border-top and a softer background:
   - Shows: `⊕ Show 38 unallocated categories` when collapsed
   - Shows: `⊖ Hide unallocated categories` when expanded
   - Uses `ChevronDown` / `ChevronUp` icon
   - Styled with `text-muted-foreground`, `bg-muted/30`, `border-t border-dashed`

3. **Alternatively (and even cleaner)** -- place a small pill badge directly in the section **header** (`CollapsibleTrigger` area), alongside the existing category count chip:
   - e.g., `[12 categories] [+38 unallocated]`
   - Clicking the `+38 unallocated` pill toggles `showAllCategories`
   - This keeps the table itself clean with no footer row

### Chosen Approach: Badge in the Section Header + Styled Footer Row

**Header badge** (pill in the CollapsibleTrigger):
- When `hiddenCount > 0` and `!showAllCategories`: show a small amber/muted pill `+38 unallocated`
- Clicking it (stopPropagation so it doesn't toggle the collapsible) sets `showAllCategories = true`

**Table footer row** (when `showAllCategories === true`):
- A `<tfoot>` row with a "Hide unallocated categories" link in muted style
- Only shown when categories are expanded

### Technical Details

**File: `src/pages/ProjectBudget.tsx`**

1. **CollapsibleTrigger area** (~line 975): Add a badge pill when `hiddenCount > 0 && !showAllCategories`:
```tsx
{hiddenCount > 0 && !showAllCategories && (
  <button
    onClick={(e) => { e.stopPropagation(); setShowAllCategories(true); }}
    className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground hover:bg-muted/80 border border-border/50"
  >
    <Plus className="h-3 w-3" />
    {hiddenCount} unallocated
  </button>
)}
```

2. **Remove the current plain text button** at the bottom (~lines 1199-1215)

3. **Add a `<TableFooter>` row** when `showAllCategories && hiddenCount > 0`:
```tsx
<TableFooter>
  <TableRow>
    <TableCell colSpan={5} className="text-center py-2">
      <button
        onClick={() => setShowAllCategories(false)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
      >
        <ChevronUp className="h-3.5 w-3.5" />
        Hide unallocated categories
      </button>
    </TableCell>
  </TableRow>
</TableFooter>
```

This creates a clear visual hierarchy: the header pill invites discovery, and the footer link provides the collapse action after expansion.
