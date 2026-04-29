## Problem

The Gantt project-type section header (e.g. "OTHER", "FIX & FLIP") uses a transparent `bg-secondary/40` background. This lets the timeline column gridlines and the red "today" indicator line show through, making the header look broken and visually noisy.

## Fix

In `src/components/calendar/GanttView.tsx` (lines 488–500), make the section header fully opaque so nothing bleeds through it.

- Outer header strip: change `bg-secondary/40` → `bg-secondary` (solid). Keep `border-y border-border` for clean top/bottom separation.
- Inner sticky label cell: change `bg-secondary/40` → `bg-secondary` so the frozen "OTHER" / "FIX & FLIP" label cell matches the rest of the band with no transparency seam.

### Resulting markup

```tsx
{showHeader && (
  <div
    className="flex items-center bg-secondary border-y border-border"
    style={{ height: TYPE_HEADER_H }}
  >
    <div
      className="sticky left-0 z-[15] px-3 bg-secondary text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/80 flex items-center"
      style={{ minWidth: FROZEN_W, height: TYPE_HEADER_H }}
    >
      {TYPE_LABEL[currType] ?? 'Other'}
    </div>
  </div>
)}
```

## Files

- `src/components/calendar/GanttView.tsx` — opacity change only on the two header `<div>` className strings. No layout, sizing, or logic changes.

## Verification

- The "OTHER" / "FIX & FLIP" / "RENTAL" / "NEW CONSTRUCTION" header bands appear as a solid horizontal strip across the full Gantt width.
- No vertical gridlines, day separators, or the red today line show through the header.
- Project rows below remain unchanged.