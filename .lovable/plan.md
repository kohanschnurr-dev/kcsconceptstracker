

## Add Line-Item Category Breakdown to Manual Expense Form

### What this does
After scanning a receipt (photo, PDF, or pasted text), the form will show the parsed line items with per-item category dropdowns -- just like the SmartSplit flow does for QuickBooks users. The user can review, edit categories and quantities, then submit. Instead of one expense record, the system creates one expense per category group, with proportional amounts.

### Changes to `src/components/QuickExpenseModal.tsx`

**1. Store line items from parsed receipt**

Add new state variables to the `ExpenseForm` component:
- `parsedLineItems` -- array of line items from the image/text parser
- `editableCategories` -- per-item category overrides (same pattern as SmartSplit)
- `editableQuantities` -- per-item quantity overrides
- `showLineItems` -- boolean toggle to show/hide the breakdown view

**2. Wire both parsers to populate line items**

- `handleParseReceiptImage`: if `parsed.line_items` exists and has items, store them in `parsedLineItems` and initialize `editableCategories`/`editableQuantities` from the AI suggestions
- `handleParseReceiptText`: the text parser currently does not return line items, so this path continues as single-expense (no change needed there)

**3. Render line-item breakdown UI (when available)**

After the scan section and before Project/Category, show a collapsible "Receipt Breakdown" section when `parsedLineItems.length > 0`:
- Each line item row shows: item name, editable quantity, unit price, category dropdown, line total
- Category dropdown uses `getBudgetCategories()` (same list as existing category selector)
- A summary footer shows the split total vs. scanned total
- A toggle to switch between "Split by Category" and "Single Expense" mode

**4. Update submit logic**

When line items are present and split mode is active:
- Group line items by their assigned category
- For each category group, calculate proportional amount (scaled to match the entered total)
- Create one `expenses` row per category group, each with appropriate `category_id`, proportional `amount`, and item notes in `description`
- Upload receipt once, attach the same `receipt_url` to all split records
- Show toast: "Split into X categories for [vendor]"

When no line items or single-expense mode: existing submit logic unchanged.

**5. Hide single Project/Category selectors when in split mode**

When split mode is active, the per-item categories replace the single Category dropdown. The Project selector remains (all splits go to the same project). The Type (Product/Labor) toggle also remains as a global setting for all splits.

### Technical Details

**Line item state initialization (after image parse):**
```typescript
const [parsedLineItems, setParsedLineItems] = useState<Array<{
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  suggested_category: string;
}>>([]);
const [editableCategories, setEditableCategories] = useState<Record<number, string>>({});
const [editableQuantities, setEditableQuantities] = useState<Record<number, number>>({});
const [splitMode, setSplitMode] = useState(false);
```

**In handleParseReceiptImage, after existing auto-fill:**
```typescript
if (parsed.line_items?.length > 0) {
  setParsedLineItems(parsed.line_items);
  const cats: Record<number, string> = {};
  const qtys: Record<number, number> = {};
  parsed.line_items.forEach((item, idx) => {
    cats[idx] = item.suggested_category || 'misc';
    qtys[idx] = item.quantity || 1;
  });
  setEditableCategories(cats);
  setEditableQuantities(qtys);
  setSplitMode(true);
}
```

**Submit with split mode:**
```typescript
// Group by category
const groups = {};
parsedLineItems.forEach((item, idx) => {
  const cat = editableCategories[idx] || item.suggested_category;
  const qty = editableQuantities[idx] ?? item.quantity;
  const total = qty * item.unit_price;
  if (!groups[cat]) groups[cat] = { items: [], total: 0 };
  groups[cat].items.push({ ...item, qty, total });
  groups[cat].total += total;
});

// Scale proportionally to match entered amount
const rawTotal = Object.values(groups).reduce((s, g) => s + g.total, 0);
for (const cat of Object.keys(groups)) {
  const proportion = rawTotal > 0 ? groups[cat].total / rawTotal : 0;
  const scaledAmount = calculateTotal() * proportion;
  // Insert expense with this category + scaled amount
}
```

**UI layout when split mode is active:**
```
[Scan Receipt Section]
[Receipt Breakdown]       <-- NEW: line items with category dropdowns
  Item 1  qty x $price   [Category v]  $total
  Item 2  qty x $price   [Category v]  $total
  Split Total: $xxx.xx
[Project]                 <-- single project for all splits
[Type: Product / Labor]   <-- global type
[Amount] [Date]           <-- total amount (auto-filled, still editable)
[Contractor] [Payment]
[Description]             <-- hidden in split mode (notes come from items)
[Tax toggle]
[Total]
[Log Expense]
```

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- add line-item state, breakdown UI, split submit logic
