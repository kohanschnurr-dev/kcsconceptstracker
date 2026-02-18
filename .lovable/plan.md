
## Clean Up Expenses Mobile UI

### Problems Identified

From the screenshot, the mobile Expenses page has two areas that need fixing:

**1. Filter bar — too many rows, too cluttered**
- Search input, Projects dropdown, Categories dropdown, and Date Range button each wrap to their own rows
- The summary line ("512 expenses • $394,993.49 • Export") wraps to yet another row
- Result: ~4-5 rows of filter controls before any expense data

**2. Table — too many columns for mobile**
- 6 columns: Date, Vendor, Project, Category, Payment, Amount
- On a ~375px screen, this forces horizontal scroll or text overflow
- "Project" and "Category" columns are barely readable at that width

### Solution

#### Part 1: Compact the filter bar on mobile (`src/pages/Expenses.tsx`)

Replace the current `flex flex-wrap` filter area with a mobile-specific 2-row layout:

**Row 1 (mobile):** Search bar (full width)  
**Row 2 (mobile):** Projects filter + Categories filter + Date Range icon-only button (compact)  
**Row 3 (mobile):** Summary count + amount + Export (tight, small text)

Key changes:
- Search bar gets its own full-width row on mobile (easier to type in)
- Projects + Categories + Date Range all fit on row 2 using shorter trigger labels and `flex-1` sizing
- Date Range button shows only the calendar icon on mobile (no text unless a date is set)
- Summary row uses smaller text and tighter spacing

#### Part 2: Simplify the table on mobile (`src/components/expenses/GroupedExpenseRow.tsx`)

On mobile (below `sm:`), hide the **Project**, **Category**, and **Payment** columns — they're the least useful at a glance and cause the most crowding. Show only:
- **Date** (compact)
- **Vendor + description** (main info)
- **Amount** (the most important number)

Also hide the corresponding `<th>` headers in `Expenses.tsx`.

Use `hidden sm:table-cell` on the columns to hide/show responsively.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/Expenses.tsx` | Restructure filter bar into mobile-optimized 2-row layout; hide Project/Category/Payment `<th>` on mobile |
| `src/components/expenses/GroupedExpenseRow.tsx` | Add `hidden sm:table-cell` to Project, Category, Payment `<td>` columns on both single and grouped rows |

### Visual Result (Mobile)

**Before:**
```
[Search...                    ]   ← full row
[All Projects ▾               ]   ← full row  
[All Categories ▾] [Date Range]   ← another row
[512 expenses • $394,993 Export]  ← another row
| Date | Vendor | Project | Category | Payment | Amount |  ← 6 cols
```

**After:**
```
[Search...                        ]   ← row 1
[Projects ▾] [Categories ▾] [📅]      ← row 2
[512 exp • $394,993  ↓ Export]        ← row 3
| Date | Vendor           | Amount |  ← 3 cols, readable
```

Clean, scannable, no horizontal overflow.
