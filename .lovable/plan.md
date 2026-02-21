

## Compact Export Reports Dialog Vertically

### What's Changing

The Export Reports dialog is too tall/stretched vertically. The spacing between sections and inside cards will be tightened to make the whole dialog more compact.

### Technical Details

**`src/components/project/ExportReports.tsx`**

1. **Outer spacing**: Change `space-y-4` (line 315) to `space-y-2` on the root container
2. **Card grid gap**: Change `gap-4` to `gap-2` on the grid (line 319)
3. **Card inner spacing**: Reduce `mb-2` to `mb-1` on the icon+title row inside each card (lines 328, 345, 362, 381)
4. **Footer spacing**: Change `pt-4` to `pt-2` on the footer divider row (line 393)

These changes tighten the vertical rhythm without changing the horizontal layout or card widths.

### Files Changed
- `src/components/project/ExportReports.tsx` -- reduce vertical spacing throughout

