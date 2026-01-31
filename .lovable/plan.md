

## Fix: Restore SmartSplit Layout - No Scroll, Inline Editable Quantity

### Problem
The current SmartSplit Match modal has:
1. A scrollable container (`max-h-[300px] overflow-y-auto`) forcing users to scroll through items
2. Quantity input stacked below the item name, making the layout feel cramped

### Solution
Restore the previous compact, inline layout while keeping editable quantities:

---

### Changes

**File:** `src/components/SmartSplitReceiptUpload.tsx`

#### Change 1: Remove scroll container (line 819)

```text
Before:  <div className="space-y-2 max-h-[300px] overflow-y-auto">
After:   <div className="space-y-2">
```

#### Change 2: Restore inline layout for line items (lines 825-858)

Return to the original single-row layout with editable quantity inline:

```jsx
<div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/30 text-sm">
  {/* Item name - truncated */}
  <div className="flex-1 min-w-0 truncate text-sm" title={item.item_name}>
    {item.item_name}
  </div>
  
  {/* Editable Quantity × Unit Price */}
  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
    <Input
      type="number"
      min={1}
      value={editedQty}
      onChange={(e) => {
        const newQty = parseInt(e.target.value) || 1;
        setEditableQuantities(prev => ({ ...prev, [idx]: newQty }));
      }}
      className="w-10 h-6 px-1 text-xs text-center bg-background border-muted"
    />
    <span className="text-muted-foreground">×</span>
    <span>{formatCurrency(item.unit_price)}</span>
  </div>
  
  {/* Category Dropdown */}
  <Select ...>
    <SelectTrigger className="w-[110px] h-6 text-xs shrink-0">
      ...
    </SelectTrigger>
  </Select>
  
  {/* Total */}
  <span className="font-mono text-xs w-14 text-right shrink-0">
    {formatCurrency(calculatedTotal)}
  </span>
</div>
```

---

### Visual Comparison

```text
BEFORE (Current - Bad):
┌─────────────────────────────────────────────────────────────┐
│ BELZ Bathroom Faucet, Modern Single Handle...               │
│ [1]  × $55.99                                               │
│                                      [Bathroom ▾]  $55.99   │
├─────────────────────────────────────────────────────────────┤
│ 10-Pieces Matte Black Bathroom Accessories...               │
│ [2]  × $59.99                                               │
│                                      [Bathroom ▾] $119.98   │
│ ... (scroll to see more)                                    │
└─────────────────────────────────────────────────────────────┘

AFTER (Fixed - Compact inline):
┌─────────────────────────────────────────────────────────────┐
│ BELZ Bathroom Faucet...     [1] × $55.99  [Bathroom▾] $55.99│
│ 10-Pieces Matte Black...    [2] × $59.99  [Bathroom▾]$119.98│
│ Sopoby Black Door Knob...   [1] × $49.99  [Hardware▾] $49.99│
│ Amico Ceiling Fans...       [1] × $56.99  [Light Fix▾]$56.99│
│ Zarbitta 3-Light...         [2] × $29.75  [Light Fix▾]$59.50│
│ ... (all items visible, no scroll)                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Technical Details

| Location | Change |
|----------|--------|
| Line 819 | Remove `max-h-[300px] overflow-y-auto` |
| Lines 825-858 | Flatten layout: single row with item name, qty input, unit price, category, total all inline |
| Input styling | Make quantity input more compact (`w-10 h-6`) to fit inline |
| SelectTrigger | Slightly smaller (`w-[110px] h-6`) to fit in row |

---

### Result
- All items visible at once (no scrolling)
- Quantity is editable inline next to "× $price"
- Compact, clean layout matching the previous design
- Dialog expands naturally to fit content

