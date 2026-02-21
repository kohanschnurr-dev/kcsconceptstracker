

## Fix PDF Print Fidelity

### Problem

The preview website in the new tab looks correct, but when the user saves/prints it as PDF, it looks "off" because:

1. **Chrome's print renderer strips some CSS** -- The arbitrary value overrides (letter-spacing, font sizes) are outside `@media print` and Chrome may not fully honor them during save-as-PDF
2. **Background colors get stripped** -- Chrome's default "Save as PDF" doesn't print background colors/graphics unless explicitly forced with `print-color-adjust: exact` on every element
3. **Sections split across pages** -- `break-inside: avoid` needs more aggressive application in the print context
4. **Tailwind CDN race condition** -- The CDN may not finish processing before `window.print()` fires, even with the 1500ms delay

### Fix

**File: `src/components/project/ProjectReport.tsx`** -- update the `handleDownloadPdf` function's style block

1. **Duplicate all arbitrary CSS overrides inside `@media print`** with `!important` to guarantee Chrome's print engine applies them during PDF save

2. **Force backgrounds on all elements in print** -- Add `* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }` inside `@media print`

3. **More aggressive break-inside controls in print** -- Apply `break-inside: avoid` to cards, sections, stat grids, and the deal financials block specifically inside `@media print`

4. **Increase the print delay** from 1500ms to 2500ms to ensure Tailwind CDN fully processes before the print dialog opens

5. **Add explicit print styles for key layout elements** -- Force grid columns, padding, and card backgrounds to render correctly in print context

### Technical Details

The `@media print` block in the generated HTML will be expanded to:

```css
@media print {
  @page { size: A4 portrait; margin: 0.5in; }
  body { background: white !important; }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Re-declare arbitrary values for print engine */
  .tracking-\[0\.35em\] { letter-spacing: 0.35em !important; }
  .tracking-\[2\.5px\] { letter-spacing: 2.5px !important; }
  .tracking-\[2px\] { letter-spacing: 2px !important; }
  .tracking-\[3px\] { letter-spacing: 3px !important; }
  .text-\[9px\] { font-size: 9px !important; line-height: 1.2; }
  .text-\[10px\] { font-size: 10px !important; line-height: 1.4; }
  .border-t-\[3px\] { border-top-width: 3px !important; }
  .h-\[10px\] { height: 10px !important; }
  .w-\[2px\] { width: 2px !important; }
  .top-\[-2px\] { top: -2px !important; }
  .bottom-\[-2px\] { bottom: -2px !important; }

  /* Prevent content splitting */
  section { break-inside: avoid; margin-bottom: 12px; }
  .bg-card, .bg-warning\/5 { break-inside: avoid; }
  .grid { break-inside: avoid; }
  .print\:break-before-page { page-break-before: always; break-before: page; }

  /* Force background colors in print */
  .bg-card { background-color: hsl(var(--card)) !important; }
  .bg-background { background-color: hsl(var(--background)) !important; }
  .bg-secondary { background-color: hsl(var(--secondary)) !important; }
  .bg-primary { background-color: hsl(var(--primary)) !important; }
  .bg-destructive { background-color: hsl(var(--destructive)) !important; }
  .bg-success { background-color: hsl(var(--success)) !important; }
  .bg-warning { background-color: hsl(var(--warning)) !important; }

  /* Hide chart tooltips */
  .recharts-tooltip-wrapper { display: none !important; }
}
```

Also change the print timeout from `1500` to `2500`:
```js
setTimeout(function() { window.print(); }, 2500);
```

### Files Changed

- `src/components/project/ProjectReport.tsx` -- expand `@media print` block with duplicated arbitrary overrides, forced backgrounds, aggressive break controls, and increased delay

