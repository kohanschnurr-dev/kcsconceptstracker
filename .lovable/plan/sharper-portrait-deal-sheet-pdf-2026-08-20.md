# Sharper Portrait Deal Sheet PDF

Keep the current structure and content — refine the layout, typography, and print behavior so the exported sheet looks like a polished, branded one-pager on US Letter portrait.

## What changes visually

**Header**
- Fix the clipped right column (company name currently runs past the page edge) by giving the right block a fixed width and right alignment with proper wrapping.
- Larger "Deal Analysis" title, property name as a strong secondary line, mode chip aligned on the same baseline.
- Gold rule under the header becomes a thin gold bar with a subtle dark accent, matching the brand.

**Snapshot row**
- Five cramped cards become a single bordered stat strip with vertical dividers, uniform label height, and tabular-numeric values — no more ragged card heights or wrapped labels.

**MAO block**
- Tighter two-column band with a clear pass/fail badge (green "Under max" / red "Over max") instead of plain sentence text.

**Construction budget table**
- Alternating row shading, tighter row height, right-aligned amounts, and a share bar (thin gold bar sized to the % of total) so the mix reads at a glance.
- Sticky repeated header row on page 2+, keeps totals row visually anchored with a heavier top border.
- Collapse very long category lists gracefully: rows never split across pages.

**Strategy analysis / summary cards**
- Consistent card sizing, larger value type, muted labels, and page-break protection so a section never orphans its title.

**Print setup**
- Explicit `@page { size: Letter portrait; margin: 0.45in }`, `-webkit-print-color-adjust: exact` so the gold/greys actually print, and a repeating footer line with page context.

## Technical notes

All work is in `src/lib/budgetPdfExport.ts` (the generated HTML string + its `<style>` block). No data, calculation, or `BudgetCalculator.tsx` logic changes — same inputs, same numbers, sharper presentation. After the edit I'll render the export in a headless browser at print size and visually QA each page for clipping, orphaned headers, and contrast.
