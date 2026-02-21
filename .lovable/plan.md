

## Fix PDF Background Color and Blank Pages

### Problems

1. **White background in PDF** -- Line 272 sets `body { background: white !important; }` in the `@media print` block, overriding the dark theme background. The PDF should use the theme's background color instead.

2. **Two blank pages** -- The "Category Breakdown" section has `print:break-before-page` (line 579) which forces a page break. Combined with `break-inside: avoid` on sections, the "Where the Money Went" donut chart section gets pushed down, creating blank pages. The fix is to remove the forced page break from Category Breakdown and let content flow naturally, relying only on `break-inside: avoid` to keep individual cards intact.

### Fix

**File: `src/components/project/ProjectReport.tsx`**

1. **Change print background from white to theme color** (line 272):
   - Change `body { background: white !important; }` to `body { background: hsl(var(--background)) !important; }`

2. **Remove forced page break from Category Breakdown section** (line 579):
   - Change `className="report-anim print:break-before-page"` to `className="report-anim"`
   - Content will still avoid splitting mid-section thanks to `break-inside: avoid`

3. **Also remove the `.grid { break-inside: avoid; }` rule** (line 295) -- grids inside sections don't need their own break-inside since the parent section already has it, and this over-constraint contributes to blank pages by preventing the grid from splitting even when the section is allowed to flow.

### Files Changed

- `src/components/project/ProjectReport.tsx` -- three targeted changes to fix background color and eliminate blank pages

