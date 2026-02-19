

## Replace Project Type Tabs with Underline Style

### Problem
The project type tabs (Fix & Flips, Rentals, etc.) on the Projects page use the default pill/segmented control style (`TabsList`), which scrolls awkwardly on mobile -- the rounded container clips oddly and the horizontal overflow isn't smooth.

### Solution
Replace the `TabsList` + `TabsTrigger` combo with custom underline-style buttons, matching the pattern already used on the Project Detail page. This gives a clean, horizontally scrollable row without the pill container.

### Changes

**`src/pages/Projects.tsx`** (lines 341-355)

Replace the `<TabsList>` wrapper and its `<TabsTrigger>` children with plain `<button>` elements styled with `border-b-2 border-transparent` (inactive) and `border-primary text-foreground` (active), inside a horizontally scrollable `div` with `overflow-x-auto scrollbar-hide`. The outer `<Tabs>` component stays for managing `TabsContent`, but the triggers become custom buttons calling `setMainTab()`.

Specific styling per tab button:
- `shrink-0 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors`
- Active state: `border-primary text-foreground`
- Each button still shows the icon + label + count

The Settings gear button stays positioned after the scrollable row (hidden on mobile per existing memory).

### Technical Details

- Remove `TabsList` and `TabsTrigger` imports if no longer used elsewhere in the file (they're still used for the status sub-tabs, so keep imports)
- The main type tabs become `<button>` elements in a `<div className="flex overflow-x-auto scrollbar-hide gap-1 border-b">`
- Each button calls `setMainTab(type)` and `setStatusTab('all')` on click
- Active state determined by `mainTab === type`
- `TabsContent` blocks remain unchanged
- The status sub-tabs (All / Active / Complete) keep the existing pill style since they're short and don't overflow

