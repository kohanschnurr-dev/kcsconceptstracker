
## Fix Budget Calculator Mobile UI

### Problems Identified (from screenshot)

The screenshot shows a mobile (~390px) view with these issues:

1. **Header is too tall and crowded**: "Budget Calculator" title wraps to two lines, subtitle text wraps to three lines ("Contractor job / budget and profit / analysis"), and the "Load Template" button + reset icon compete for space. The title area takes up ~100px of precious vertical space.

2. **ContractorMarginGauge / MAOGauge wraps badly**: The gauge uses `flex-wrap` with 4 stat cards, each with a label+value. On mobile these wrap into 2×2 or even 3+1 grids that look unaligned. The labels like "CONTRACT VALUE", "JOB COST", "GROSS PROFIT", "GROSS MARGIN" are all uppercase and take too much space.

3. **DealSidebar is a full-width 320px panel**: On mobile, the sidebar sits alongside the BudgetCanvas in a `flex` row — so the BudgetCanvas gets **zero width**. On desktop this works as a left sidebar; on mobile, it completely occupies the screen with no canvas visible.

4. **The main layout `flex flex-col h-[calc(100vh-4rem)]` with nested `flex flex-1 overflow-hidden`**: This inner flex row (sidebar + canvas) renders both side-by-side regardless of screen size, making the canvas invisible on mobile.

### Solution Architecture

The fix requires a **mobile-first layout restructuring** across two files:

#### Fix 1: `src/pages/BudgetCalculator.tsx` — Mobile Layout

**Header**: On mobile, compress to one row:
- Left: Just "Budget Calculator" (smaller, `text-xl sm:text-2xl`) — drop the subtitle on mobile
- Right: Template picker (compact) + reset button

**Gauge section**: Reduce padding on mobile (`px-3 sm:px-6`, `py-2 sm:py-3`)

**Main content area**: Change from `flex overflow-hidden` to a **stacked mobile layout**:
- On **mobile**: `flex-col` — sidebar on top (full-width, collapsed by default), canvas below (scrollable)
- On **desktop**: `flex-row overflow-hidden` (existing behavior)

```tsx
// Mobile: flex-col, Desktop: flex-row
<div className="flex flex-col md:flex-row flex-1 overflow-hidden">
  <DealSidebar ... />
  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
    ...
  </div>
</div>
```

On mobile, the `DealSidebar` needs to render differently — instead of a fixed-width `w-80` side panel, it should render as a **collapsible full-width section** at the top. We'll do this by passing an `isMobile` prop or detecting screen width.

The cleanest approach: use a `useIsMobile()` hook and pass it to `DealSidebar`. When mobile:
- Sidebar renders as a collapsible accordion-style panel (full width, default collapsed) 
- Canvas renders below it, full-width, scrollable

#### Fix 2: `src/components/budget/DealSidebar.tsx` — Mobile Rendering

Add an `isMobile` prop. When `isMobile=true`:
- Collapse button becomes a full-width toggle at the top of the panel instead of a left-side `w-12` strip
- When collapsed on mobile: shows a compact summary bar (e.g., "Deal Parameters — Contract Value: $0  [▼ Expand]") 
- When expanded on mobile: renders the full sidebar content as a scrollable section above the canvas
- The sidebar renders full-width `w-full` instead of `w-80`
- The `isCollapsed` state defaults to `true` on mobile to save space

#### Fix 3: `src/components/budget/ContractorMarginGauge.tsx` — Mobile Gauge

The 4 stat cards currently use `flex items-center justify-between gap-3 flex-wrap`. On mobile at 390px, each card is ~160px+ wide, causing wrapping into 2×2:

Fix: On mobile, use a **2×2 CSS grid** instead of flex-wrap, with smaller values:
```tsx
<div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
```
- Reduce icon wrapper from `p-1.5` to `p-1 sm:p-1.5`
- Reduce value `text-lg` to `text-base sm:text-lg`

#### Fix 4: `src/components/budget/MAOGauge.tsx` — Mobile Gauge

Same treatment — the 4 flex items wrap messily. Apply same 2×2 grid on mobile:
```tsx
<div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3 flex-wrap">
```

### Files to Modify

| File | Change |
|---|---|
| `src/pages/BudgetCalculator.tsx` | Compress header for mobile; change content area to `flex-col md:flex-row`; pass `isMobile` to DealSidebar |
| `src/components/budget/DealSidebar.tsx` | Accept `isMobile` prop; when mobile render as collapsible full-width top section (`w-full` vs `w-80`); default collapsed on mobile |
| `src/components/budget/ContractorMarginGauge.tsx` | 2×2 grid on mobile for stat cards; reduce font sizes |
| `src/components/budget/MAOGauge.tsx` | 2×2 grid on mobile for stat cards; reduce font sizes |

### Technical Snippet — Mobile Sidebar Toggle

```tsx
// DealSidebar.tsx — mobile collapsed state (compact header bar)
if (isMobile && isCollapsed) {
  return (
    <div className="border-b bg-muted/30">
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold"
        onClick={() => setIsCollapsed(false)}
      >
        <span className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Deal Parameters
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

// When expanded on mobile — full-width instead of w-80
<div className={cn(
  "bg-muted/30 border-b flex flex-col",
  isMobile ? "w-full max-h-[60vh]" : "w-80 border-r h-full"
)}>
```

### Visual Result

**Before (mobile):**
```
[Budget Calculator    ]   [Load Template ▾] [↺]
[Contractor job budget]
[and profit analysis  ]
[CONTRACT VALUE  JOB COST]
[GROSS PROFIT GROSS MARGIN] ← wraps badly
[← sidebar takes full width, canvas = 0px]
```

**After (mobile):**
```
[Budget Calculator] [Load Template ▾] [↺]
[▣ $0  ↑ $0  ✓ $0  % 0%]   ← clean 2×2 grid
[Deal Parameters              ▼]  ← collapsed pill
[======= Budget Canvas (full width) =======]
[  Category cards, scrollable, all visible  ]
```

Clean, functional, matches the professional mobile experience of the rest of the app.
