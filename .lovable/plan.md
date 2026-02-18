
## Fix Documents UI for Mobile — Intentional, Sleek Layout

### Problem

The Documents header currently uses `flex flex-row items-center justify-between flex-wrap gap-4` which dumps **5 controls** (search input, date select, category select, Folder button, Add button) into one row that wraps unpredictably on mobile. The screenshot shows exactly this: a cluttered, multi-row heap of truncated controls that looks like an afterthought.

### Design Approach

Redesign the header into a **two-row mobile layout** that feels deliberate:

- **Row 1 (Title + Actions)**: Title on the left. `+ Add` and `Folder` buttons (icon-only on mobile) on the right — always anchored.
- **Row 2 (Filters bar)**: Full-width search field + compact filter row below. On mobile the filters collapse into a single slim bar.

This mirrors the pattern used by modern file managers (Google Drive, Dropbox mobile).

### Specific Changes

#### `src/components/project/DocumentsGallery.tsx`

**1. Replace the `CardHeader` layout:**

Current: `flex flex-row items-center justify-between flex-wrap gap-4` — one flat row that wraps
New: `flex flex-col gap-3` with two intentional sub-rows:

```tsx
<CardHeader className="pb-3">
  {/* Row 1: Title + Action Buttons */}
  <div className="flex items-center justify-between gap-2">
    {/* Title / breadcrumb on the left */}
    ...

    {/* Right side: icon-only on mobile, text on desktop */}
    <div className="flex items-center gap-1.5 shrink-0">
      <Button size="sm" variant="outline" onClick={() => setFolderModalOpen(true)} className="px-2 sm:px-3">
        <FolderPlus className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Folder</span>
      </Button>
      <Button size="sm" onClick={() => setUploadModalOpen(true)} className="px-2 sm:px-3">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Add</span>
      </Button>
    </div>
  </div>

  {/* Row 2: Search + Filters */}
  <div className="flex items-center gap-2">
    {/* Search takes all available space */}
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search documents..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 pr-8 w-full"   {/* was fixed w-[180px] */}
      />
      ...
    </div>

    {/* Date filter: icon + short label on mobile */}
    <Select value={filterDate} onValueChange={setFilterDate}>
      <SelectTrigger className="w-auto gap-1 px-2 sm:w-[130px]">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline"><SelectValue /></span>
      </SelectTrigger>
      ...
    </Select>

    {/* Category filter: icon only on mobile */}
    <Select value={filterCategory} onValueChange={setFilterCategory}>
      <SelectTrigger className="w-auto gap-1 px-2 sm:w-[140px]">
        <Filter className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline"><SelectValue /></span>
      </SelectTrigger>
      ...
    </Select>
  </div>
</CardHeader>
```

**Key Changes Summary:**

| Element | Before | After (mobile) |
|---|---|---|
| Header layout | 1 wrapping flex row | 2 intentional rows |
| Search width | Fixed `w-[180px]` | `flex-1` (fills row) |
| Date select | `w-[130px]` with text | Icon-only (`w-auto px-2`) |
| Category select | `w-[140px]` with text | Icon-only (`w-auto px-2`) |
| Folder button | Text + icon | Icon-only on mobile |
| Add button | Text + icon | Icon-only on mobile |

**2. Card grid on mobile — make it feel more spacious:**

Change `grid-cols-2` (current, produces very small cards) → keep `grid-cols-2` but reduce gap to `gap-3` and reduce card internal padding in `DraggableDocumentCard` and `DraggableDroppableFolder`.

Actually the grid is fine — the issue is purely the header. The card layout at `grid-cols-2` on mobile is workable.

### Files to Modify

| File | Change |
|---|---|
| `src/components/project/DocumentsGallery.tsx` | Redesign `CardHeader` into a clean 2-row mobile layout. Search goes full-width. Filter selects become icon-only on mobile. Action buttons become icon-only on mobile. |

No logic changes — all filtering, state, and handlers stay identical.
