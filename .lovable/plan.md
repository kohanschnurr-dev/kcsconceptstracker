
## Fix Procurement Mobile UI

### Problems in the Screenshot

From the screenshot, the mobile Procurement page has several issues:

1. **Header action buttons overflow** — "Orders", "New Bundle", and "+ Add Item" buttons are all in a row that clips past the right edge of the screen (the screenshot shows "+ Add It" cut off)
2. **Filter rows are too tall** — Each filter (Bundles, Categories, Sort) takes its own full-width row, eating 3+ rows of vertical space below the search bar
3. **Table has too many columns** — 9 columns (checkbox, image, item, bundle, source, category, price, qty, actions) are impossible to display on a ~375px screen. The screenshot shows only "Item" and "Bundle" visible before the right edge clips off
4. **Summary cards are fine** — 2-column grid works well

### Solution

#### Part 1: Compact the header action buttons on mobile

On mobile, show icon-only buttons (or very short labels) to prevent overflow:
- "Orders" button → show just the bell icon + badge (no text on mobile)
- "New Bundle" → show just the folder icon (no text on mobile)  
- "+ Add Item" → keep "+" icon + "Add" text (short)

#### Part 2: Compact the filter area on mobile

Replace 4-row filter layout with 2 rows on mobile:
- **Row 1**: Search bar (full width)
- **Row 2**: All 3 dropdowns (Bundles, Categories, Sort) side-by-side using `flex-1` and icon-only triggers

#### Part 3: Simplify the table on mobile

On mobile (below `sm:`), hide heavy columns and keep only the essentials:
- **Keep**: Image thumbnail (small), Item name, Price + Qty (combined), Actions (edit/delete only — compact)
- **Hide on mobile**: Bundle column, Source column, Category column
- The checkbox column for bulk selection stays (but shrinks)

Also reduce the image thumbnail from 12×12 to 10×10 on mobile.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/Procurement.tsx` | 1. Make header buttons icon-only on mobile. 2. Restructure filter area into 2 rows with compact dropdowns. 3. Hide Bundle/Source/Category table headers and cells on mobile. |

### Technical Implementation

**Header buttons (mobile icon-only):**
```tsx
// Orders button
<Button variant="outline" className="relative px-2 sm:px-4" onClick={() => setOrdersPanelOpen(true)}>
  <Bell className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Orders</span>
  ...
</Button>

// New Bundle
<Button variant="outline" className="px-2 sm:px-4" onClick={...}>
  <FolderOpen className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">New Bundle</span>
</Button>

// Add Item
<Button className="px-2 sm:px-4" onClick={...}>
  <Plus className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Add Item</span>
</Button>
```

**Filter rows (2 compact rows on mobile):**
```tsx
// Row 1: Search (unchanged, full width)
// Row 2: 3 dropdowns side by side
<div className="flex gap-2">
  <Select ...> <SelectTrigger className="flex-1 h-9 min-w-0"> ... </SelectTrigger> </Select>
  <Select ...> <SelectTrigger className="flex-1 h-9 min-w-0"> ... </SelectTrigger> </Select>
  <Select ...> <SelectTrigger className="flex-1 h-9 min-w-0"> ... </SelectTrigger> </Select>
</div>
```
On mobile, hide the icons inside SelectTrigger (or keep them since they're small).

**Table columns (hide on mobile):**
```tsx
<TableHead className="text-center hidden sm:table-cell">Bundle</TableHead>
<TableHead className="text-center hidden sm:table-cell">Source</TableHead>
<TableHead className="text-center hidden sm:table-cell">Category</TableHead>

// Corresponding cells:
<TableCell className="text-center hidden sm:table-cell">...</TableCell>
```

**Image cell — smaller on mobile:**
```tsx
<div className="w-8 h-8 sm:w-12 sm:h-12 rounded-md overflow-hidden ...">
```

**Actions cell — hide delete on mobile to save space:**
Keep edit and the project-assign `+` button; hide the delete button on mobile (`hidden sm:inline-flex`). This saves ~32px per row.

### Visual Result

**Before (mobile):**
```
[Orders] [New Bundle] [+ Add It...] ← clips off
[Search                            ]
[All Bundles ▾                     ]
[All Categories ▾                  ]
[A-Z ▾                             ]
| ☐ | img | Item | Bundle | → clips
```

**After (mobile):**
```
[🔔] [📁] [+ Add]                   ← all visible
[Search                            ]
[Bundles ▾] [Categories ▾] [A-Z ▾]
| ☐ | img | Item Name    | $Price |
```

Clean, no clipping, no horizontal scroll.
