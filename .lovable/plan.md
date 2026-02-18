
## Fix: Mobile Tab UI — Comprehensive Audit & Polish

### Problems Found

Five distinct mobile issues across the project detail tabs:

---

### 1. Tab Bar — Wrapping Multi-Row Blob (Highest Priority)

**File:** `src/pages/ProjectDetail.tsx` (line 1047)

`TabsList` uses `flex-wrap h-auto` — with 9–12 tabs on a fix & flip or rental project, these wrap into 2–3 rows of misaligned pill buttons that look broken.

**Fix:** Replace with a horizontally scrollable single row — the native app pattern for tab bars.

```tsx
// Before
<TabsList className="flex-wrap h-auto">

// After: single-row, horizontally scrollable, no wrap
<TabsList className="flex overflow-x-auto scrollbar-none h-10 w-full justify-start gap-0.5">
  {/* Each trigger uses shrink-0 to prevent squishing */}
```

Each `TabsTrigger` will get `shrink-0` so tabs never compress. The row scrolls horizontally with no scrollbar visible (hide via `scrollbar-none`). Desktop behavior is unchanged since tabs fit on one line.

---

### 2. Photos Tab Header — 5 Controls Wrapping Haphazardly

**File:** `src/components/project/PhotoGallery.tsx` (line 262)

The `CardHeader` uses `flex flex-row items-center justify-between flex-wrap gap-2` with up to 5 controls (2 selects, Select All, Clear, Cancel/Select, Add Photos). On mobile these wrap unpredictably.

**Fix:** Two-row layout matching the Documents pattern we already established:
- Row 1: Title + "Add Photos" + "Select" buttons (icon-only on mobile)
- Row 2: Category select + Date select (icon-only triggers on mobile)

```tsx
<CardHeader className="flex flex-col gap-3 pb-3">
  {/* Row 1: Title + Actions */}
  <div className="flex items-center justify-between gap-2">
    <CardTitle className="text-lg flex items-center gap-2">
      <Image className="h-5 w-5 shrink-0" />
      Photo Gallery ({photos.length})
    </CardTitle>
    <div className="flex items-center gap-1.5 shrink-0">
      {isSelectionMode ? (
        <>
          <Button variant="outline" size="sm" onClick={handleSelectAll} className="px-2 sm:px-3">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">All</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={exitSelectionMode} className="px-2 sm:px-3">
            <X className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Cancel</span>
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)} className="px-2 sm:px-3">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Select</span>
          </Button>
          <Button size="sm" onClick={() => setIsUploadOpen(true)} className="px-2 sm:px-3">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Add</span>
          </Button>
        </>
      )}
    </div>
  </div>
  {/* Row 2: Filters */}
  <div className="flex items-center gap-2">
    <Select value={filterCategory} onValueChange={setFilterCategory}>
      <SelectTrigger className="flex-1 sm:w-[110px] sm:flex-none">
        <SelectValue />
      </SelectTrigger>
      ...
    </Select>
    <Select value={filterDate} onValueChange={setFilterDate}>
      <SelectTrigger className="flex-1 sm:w-[130px] sm:flex-none">
        <SelectValue />
      </SelectTrigger>
      ...
    </Select>
    {/* Delete button only shows in selection mode */}
    {isSelectionMode && selectedIds.size > 0 && (
      <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isDeleting} className="shrink-0">
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Delete ({selectedIds.size})</span>
      </Button>
    )}
  </div>
</CardHeader>
```

---

### 3. Procurement Tab — Table Overflow on Mobile

**File:** `src/components/project/ProcurementTab.tsx` (lines 617–663)

The procurement table has 8 columns (status badge, item, category, finish, price, qty, total, delete). On a 390px phone this is completely unreadable — it either clips or forces horizontal scroll of the whole page.

**Fix:** Wrap the table in `overflow-x-auto` and hide the least-critical columns on mobile:
- Hide `Finish` column on mobile (`hidden sm:table-cell`)
- Hide `Category` column on mobile (`hidden sm:table-cell`)  
- The status icon, item name, price, qty, and total remain visible

```tsx
// Wrap table:
<div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead className="w-16"></TableHead>
        <TableHead>Item</TableHead>
        <TableHead className="hidden sm:table-cell">Category</TableHead>
        <TableHead className="hidden sm:table-cell">Finish</TableHead>
        <TableHead className="text-right">Price</TableHead>
        <TableHead className="text-center">Qty</TableHead>
        <TableHead className="text-right">Total</TableHead>
        <TableHead></TableHead>
      </TableRow>
    </TableHeader>
    ...
    // Mirror hidden classes in TableCell
```

Also the "Add from Library" button text is full-width on mobile — wrap in `flex-wrap` or keep as-is (the `flex flex-col sm:flex-row gap-3` already handles it).

---

### 4. Team Tab (ProjectVendors) — Vendor Card Header Overflow

**File:** `src/components/project/ProjectVendors.tsx` (line 179)

`CardHeader` with `flex flex-row items-center justify-between` is fine, but the "Assign Vendor" button shows full text `Assign Vendor` at all sizes — icon-only on mobile is cleaner.

```tsx
// Before
<Button size="sm" disabled={availableVendors.length === 0}>
  <Plus className="h-4 w-4 mr-1" />
  Assign Vendor
</Button>

// After
<Button size="sm" disabled={availableVendors.length === 0} className="px-2 sm:px-3">
  <Plus className="h-4 w-4" />
  <span className="hidden sm:inline ml-1">Assign Vendor</span>
</Button>
```

Also the vendor phone number (`pv.vendor.phone`) is displayed as full text in a button-link, e.g. `(555) 123-4567`. On very narrow phones, two contact chips (phone + email) with full text can overflow. Truncate the email to just the icon + `Email` on mobile:

```tsx
// Email chip: show icon + "Email" on mobile instead of full address
<a href={`mailto:${pv.vendor.email}`} ...>
  <Mail className="h-3 w-3" />
  <span className="hidden sm:inline">{pv.vendor.email}</span>
  <span className="sm:hidden">Email</span>
</a>
```

---

### 5. Summary Cards on Mobile — Visual Weight

**File:** `src/pages/ProjectDetail.tsx` (line 938)

The `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` summary card grid shows 1 card per row on mobile, which takes a lot of vertical space. Change to `grid-cols-2` on mobile so all 4 cards are visible at once without excessive scrolling. The currency values use `text-xl` — scale down to `text-lg` on mobile:

```tsx
// Before
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  ...
  <p className="text-xl font-semibold font-mono">

// After
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
  ...
  <p className="text-base sm:text-xl font-semibold font-mono">
```

Also reduce card `pt-6` to `pt-4` on mobile, and the icon boxes from `h-10 w-10` → `h-8 w-8 sm:h-10 sm:w-10`.

---

### Files to Modify

| File | Changes |
|---|---|
| `src/pages/ProjectDetail.tsx` | 1. Tab bar: scrollable single row. 2. Summary cards: 2-col on mobile, smaller text/icons. |
| `src/components/project/PhotoGallery.tsx` | Two-row header: title+actions row 1, filters row 2. Icon-only buttons on mobile. Delete button in filter row when in selection mode. |
| `src/components/project/ProcurementTab.tsx` | Wrap both tables in `overflow-x-auto`. Hide Category and Finish columns on mobile. Mirror hidden classes on `TableCell`s in `renderItemRow`. |
| `src/components/project/ProjectVendors.tsx` | Icon-only "Assign" button on mobile. Email chip shows "Email" label on mobile instead of full address. |

### What's Already Good

- Documents tab header: just fixed, looks great
- Tasks tab: already mobile-optimized
- Logs tab: Quick log form is responsive, works well  
- Info tab: 2-col grid auto-stacks to 1-col on mobile, fine
- Schedule tab (ProjectCalendar): min-h-[100px] calendar cells are compact, usable
- Cost Control / Lease / Deal / Field tabs: placeholder cards, fine as-is
