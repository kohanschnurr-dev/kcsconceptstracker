

## Plan: Improve Receipt Details Modal UI Layout

### Problems Identified

Looking at the screenshot, the modal has several visual issues:

1. **Long text wrapping badly** - The "Framing" item description is extremely long and wraps messily
2. **Cramped layout** - Category badge and description run together
3. **Amounts misaligned** - Should form a clean right-aligned column
4. **No structure** - Items feel like random text blobs rather than organized line items

### Solution

Redesign the items list with a proper table-like structure:

| Category Badge | Item Description (truncated) | Amount (right-aligned) |
|----------------|------------------------------|------------------------|

### Visual Design (Before vs After)

**Before (current mess):**
```
[Framing]
LP SMARTSIDE 8"X16' LP LAP SIDING (3x), WEATHERSHIELD 2X8-16FT #2PRIME PT GC WEATHERSHIELD (3x), UNBRANDED 2X8-16FT #2PRIME PT GC (1x)    $119.81
```

**After (clean layout):**
```
┌──────────────────────────────────────────────────────────────┐
│ [Drywall]                                                    │
│ USG SHEETROCK BRAND ULTRALIGHT 1/2 IN. X 4 F...     $31.60  │
├──────────────────────────────────────────────────────────────┤
│ [Framing]                                                    │
│ LP SMARTSIDE 8"X16' LP LAP SIDING (3x), WEAT...    $119.81  │
├──────────────────────────────────────────────────────────────┤
│ [Demolition]                                                 │
│ HUSKY HUSKY 42G CONTRACTOR BAGS 50CT (1x)           $32.44  │
├──────────────────────────────────────────────────────────────┤
│ [Hardware]                                                   │
│ GRIP-RITE 3" PG10 EXT DECK SCREWS...                $27.57  │
└──────────────────────────────────────────────────────────────┘
```

### Technical Changes

**File: `src/components/GroupedExpenseDetailModal.tsx`**

Restructure the items list to:
1. **Stack vertically** - Category badge on top, description below
2. **Fixed amount column** - Use grid or flex with fixed-width right column
3. **Proper truncation** - Limit description to 1-2 lines max with ellipsis
4. **Add padding** - More breathing room between items

```typescript
{expenses.map((expense) => (
  <div key={expense.id} className="p-3 hover:bg-muted/30">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-1">
        <Badge variant="secondary" className="text-xs">
          {getCategoryLabel(expense.category_id, expense.project_id)}
        </Badge>
        {expense.notes && (
          <p 
            className="text-xs text-muted-foreground line-clamp-2" 
            title={expense.notes}
          >
            {expense.notes}
          </p>
        )}
      </div>
      <span className="font-mono text-sm font-medium whitespace-nowrap">
        {formatCurrency(expense.amount)}
      </span>
    </div>
  </div>
))}
```

Key CSS changes:
- `line-clamp-2` - Limits text to 2 lines with ellipsis
- `items-start` instead of `items-center` - Badge stays at top
- `gap-4` - More space before amount
- `whitespace-nowrap` on amount - Prevents wrap
- `space-y-1` - Proper vertical spacing

### Summary

| Issue | Fix |
|-------|-----|
| Text wrapping badly | `line-clamp-2` to limit and truncate |
| Cramped layout | Stack badge above description |
| Amounts misaligned | `whitespace-nowrap` + `gap-4` |
| No structure | Consistent padding and spacing |

