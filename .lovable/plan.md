

## Plan: Arrow-Only Expand for Grouped Expenses

### Overview
Change the expand/collapse behavior so that only clicking the chevron arrow toggles the expansion, not the entire row. This allows clicking elsewhere on the row to open the expense detail modal without accidentally expanding/collapsing.

### Changes

**File: `src/components/expenses/GroupedExpenseRow.tsx`**

#### 1. Remove onClick from Parent Row (line 121)
Remove the `onClick={() => setIsExpanded(!isExpanded)}` from the `<tr>` element.

#### 2. Add onClick to Parent Row for Opening Modal
Change the parent row's onClick to call `onExpenseClick(parentExpense)` so clicking the row opens the detail modal.

#### 3. Make Chevron a Clickable Button (lines 123-131)
Wrap the chevron icon in a clickable button that:
- Stops event propagation (so row click doesn't also fire)
- Toggles `isExpanded` state
- Has hover styling for better UX

#### 4. Update Helper Text (line 138)
Change "Click to expand" to "Click arrow to expand" for clarity.

### Technical Details

**Current behavior (lines 119-131):**
```tsx
<tr 
  className="hover:bg-muted/20 transition-colors cursor-pointer"
  onClick={() => setIsExpanded(!isExpanded)}
>
  <td className="whitespace-nowrap">
    <div className="flex items-center gap-1">
      {formatDisplayDate(parentExpense.date)}
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  </td>
```

**New behavior:**
```tsx
<tr 
  className="hover:bg-muted/20 transition-colors cursor-pointer"
  onClick={() => onExpenseClick(parentExpense)}
>
  <td className="whitespace-nowrap">
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="p-1 -ml-1 hover:bg-muted/50 rounded transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {formatDisplayDate(parentExpense.date)}
    </div>
  </td>
```

### Summary of Changes
| Line | Change |
|------|--------|
| 121 | Change row onClick to `onExpenseClick(parentExpense)` |
| 124-130 | Move chevron before date, wrap in clickable button with stopPropagation |
| 138 | Update text to "Click arrow to expand" |

### Result
- Clicking the arrow expands/collapses the grouped items
- Clicking anywhere else on the row opens the expense detail modal
- Better UX with clear visual feedback on the arrow button

