

## Plan: Fix Receipt Details Modal Item Display

### Problem Identified

The Receipt Details modal is displaying information incorrectly:

**Current display (wrong):**
- Shows vendor address ("THE HOME DEPOT 542 FORT WORTH TX XXXX1006") as the main description
- Shows actual item details ("USG SHEETROCK BRAND...") as a secondary italic note
- This is redundant since the vendor name is already displayed in the header

**Database structure:**
| Field | Contains | Example |
|-------|----------|---------|
| `vendor_name` | Vendor name | "Home Depot" |
| `description` | Vendor address (redundant) | "THE HOME DEPOT 542 FORT WORTH TX XXXX1006" |
| `notes` | Actual item details | "USG SHEETROCK BRAND ULTRALIGHT 1/2 IN. X 4 FT. X 8 FT. G (3x)" |

### Solution

Update the item display in `GroupedExpenseDetailModal.tsx` to:
1. Show `notes` as the primary item description (this has the actual product info)
2. Hide the redundant `description` field that just shows the vendor address
3. Clean up the layout for better readability

---

### Technical Changes

**File: `src/components/GroupedExpenseDetailModal.tsx`**

Update the items list rendering (lines 267-289) to prioritize `notes` over `description`:

```typescript
{expenses.map((expense, index) => (
  <div key={expense.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {getCategoryLabel(expense.category_id, expense.project_id)}
        </Badge>
      </div>
      {/* Show notes as primary text (contains actual item descriptions) */}
      {expense.notes && (
        <p className="text-xs text-muted-foreground truncate mt-1 max-w-[350px]" title={expense.notes}>
          {expense.notes}
        </p>
      )}
      {/* Only show description if there's no notes AND it's not just a vendor address */}
      {!expense.notes && expense.description && !expense.description.includes('XXXX') && (
        <p className="text-xs text-muted-foreground truncate mt-1">
          {expense.description}
        </p>
      )}
    </div>
    <span className="font-mono text-sm ml-4 flex-shrink-0">
      {formatCurrency(expense.amount)}
    </span>
  </div>
))}
```

---

### Visual Result

**Before:**
```
[Drywall]
THE HOME DEPOT 542 FORT WORTH TX XXXX1006        $31.60
Note: USG SHEETROCK BRAND ULTRALIGHT...
```

**After:**
```
[Drywall]
USG SHEETROCK BRAND ULTRALIGHT 1/2 IN. X 4 FT... $31.60
```

---

### Summary

| Change | Purpose |
|--------|---------|
| Show `notes` as primary description | Contains actual product/item details |
| Hide vendor address in `description` | Redundant - vendor already shown in header |
| Add title attribute for hover | Show full text on hover for truncated items |
| Add `flex-shrink-0` to amount | Prevent amount from being squished |

