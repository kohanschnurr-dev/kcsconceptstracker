
# Fix Desktop Tab Bar Styling on Project Detail Page

## Problem

The current `TabsList` in `src/pages/ProjectDetail.tsx` (line 1050) renders with the default shadcn tab styling: a gray rounded pill container with small pill-shaped active triggers. On desktop, this looks cramped and visually heavy — like a segmented control rather than a proper tab bar.

The screenshot shows it rendering like a navigation pill group on a wide page, which clashes with the card-based layout around it.

## Solution

Replace the default pill-style tabs with a clean **underline-style tab bar** — the most common, professional look for desktop navigation tabs. This means:

- No gray background container on the `TabsList`
- Active tab shows a bottom border/underline in the primary color
- Inactive tabs are plain text, getting a subtle hover state
- The overall bar sits on a bottom border line for visual structure

## Technical Changes

### 1. `src/pages/ProjectDetail.tsx` — TabsList & TabsTrigger styling

**Current (line 1050):**
```tsx
<TabsList className="flex h-10 w-max justify-start gap-0.5 min-w-full">
  {effectiveTabOrder.map((tab) => (
    <TabsTrigger key={tab} value={tab} className="shrink-0">
      {getTabLabel(tab, project.project_type)}
    </TabsTrigger>
  ))}
</TabsList>
```

**After:**
```tsx
<TabsList className="flex h-10 w-max justify-start gap-0 min-w-full bg-transparent p-0 border-b border-border rounded-none">
  {effectiveTabOrder.map((tab) => (
    <TabsTrigger
      key={tab}
      value={tab}
      className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground transition-colors
        data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none
        hover:text-foreground bg-transparent"
    >
      {getTabLabel(tab, project.project_type)}
    </TabsTrigger>
  ))}
</TabsList>
```

**Key CSS changes:**
- `bg-transparent p-0 rounded-none` — removes the pill container background
- `border-b border-border` — adds a subtle line under the whole tab bar
- On triggers: `border-b-2 border-transparent` by default, flips to `border-primary` when active
- `data-[state=active]:bg-transparent data-[state=active]:shadow-none` — removes the active white pill highlight from the default shadcn style
- `text-muted-foreground` default, `text-foreground` when active or hovered

This is a **single-file, single-location change** — only the `TabsList` and `TabsTrigger` className props at lines ~1050-1055 need updating.

### Files to Change

| File | Change |
|---|---|
| `src/pages/ProjectDetail.tsx` | Update `TabsList` and `TabsTrigger` class names at lines 1050–1054 |

### What stays the same
- Tab order, drag-to-reorder, settings gear — untouched
- Mobile horizontal scrolling behavior — untouched  
- Tab content rendering — untouched
- All other page layout — untouched
