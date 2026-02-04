
## Plan: Move Filters into Expenses Table Header

### Current Layout
1. Page header with title + Export/Add buttons
2. Standalone filters section (search, project, category, date range)
3. QuickBooks integration
4. Summary card (expense count + total)
5. Collapsible Expenses Table

### New Layout
1. Page header with title + Export/Add buttons
2. QuickBooks integration
3. Collapsible Expenses Table with **filters integrated into the header bar**
   - Search input + Project + Category + Date Range filters in header
   - Count and total moved to the right side of the filters

The summary card will be removed since that information is already shown in the table header bar.

---

### Visual Layout (Header Bar)

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ▼ [🔍 Search vendor, amount...] [All Projects ▼] [All Categories ▼] [📅 Date Range]  50 expenses • $54,901.34 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/pages/Expenses.tsx`**

1. **Remove** the standalone filters section (lines 421-494)
2. **Remove** the summary card section (lines 500-514)
3. **Update** the Collapsible header to include:
   - Search input (compact)
   - Project dropdown
   - Category dropdown  
   - Date range picker
   - Expense count and total on the right

The header will use `onClick={(e) => e.stopPropagation()}` on filter controls to prevent the collapsible from toggling when interacting with filters.

**Updated Header Structure:**
```tsx
<div className="flex items-center justify-between p-4 border-b border-border/30">
  {/* Left side - Toggle + Label */}
  <CollapsibleTrigger asChild>
    <div className="flex items-center gap-2 cursor-pointer">
      <ChevronDown className={...} />
      <span className="font-medium">Expenses</span>
    </div>
  </CollapsibleTrigger>
  
  {/* Center - Filters (click doesn't toggle collapsible) */}
  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
    <Search input />
    <Project select />
    <Category select />
    <Date range picker />
  </div>
  
  {/* Right side - Summary */}
  <div className="text-sm text-muted-foreground">
    50 expenses • $54,901.34
  </div>
</div>
```

---

### Mobile Responsiveness
On smaller screens, the filters will wrap naturally using `flex-wrap`. The date range picker will show abbreviated format.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Move filters into table header, remove standalone filter section and summary card |

---

### Result
- Filters are now directly above the expense table
- Users see the correlation between filters and the table content
- Cleaner layout with less vertical space used
- Summary info stays visible in the header even when scrolling through the table
