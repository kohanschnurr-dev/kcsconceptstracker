
## Plan: Enlarge Expand/Collapse Hit Area

### Overview
Make the entire date cell clickable for expand/collapse on grouped expense rows, so users don't have to precisely click the small arrow icon.

### Change

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

Convert the date cell content from a small button + text into a single clickable area that spans the whole cell.

### Technical Details

**Current structure (lines 134-151):**
```tsx
<td className="whitespace-nowrap">
  <div className="flex items-center gap-1">
    <button onClick={(e) => {...}} className="p-1 -ml-1 hover:bg-muted/50 rounded">
      {isExpanded ? <ChevronDown /> : <ChevronRight />}
    </button>
    {formatDisplayDate(parentExpense.date)}
  </div>
</td>
```

**New structure:**
```tsx
<td 
  className="whitespace-nowrap cursor-pointer hover:bg-muted/30 transition-colors"
  onClick={(e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }}
>
  <div className="flex items-center gap-1">
    {isExpanded ? (
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    ) : (
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    )}
    {formatDisplayDate(parentExpense.date)}
  </div>
</td>
```

### Key Changes
1. Move the `onClick` handler from the button to the entire `<td>` cell
2. Add `cursor-pointer` and hover styling to the cell
3. Remove the inner button wrapper - the chevron icon becomes a simple visual indicator
4. Keep `e.stopPropagation()` so clicking the date doesn't also trigger the row's detail modal

### Result
- Clicking anywhere on the date (including the chevron) toggles expand/collapse
- Much larger hit area - the entire date cell is clickable
- Visual feedback on hover shows the cell is interactive
- Clicking other cells still opens the expense detail modal as before
