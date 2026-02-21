

## Fix PDF Layout and Typography

### Root Cause

The PDF export opens a new tab with Tailwind CDN (`cdn.tailwindcss.com`), but the CDN version does **not** support JIT arbitrary values like `tracking-[0.35em]`, `text-[9px]`, `tracking-[2.5px]`, etc. These classes are silently ignored, so:
- Letter-spacing reverts to normal, causing labels like "BUDGET SNAPSHOT" to look wrong
- Font sizes revert to Tailwind defaults instead of the precise `9px`, `10px` values
- The overall layout looks "broken up"

Additionally, there are no `break-inside: avoid` rules, so sections get split across pages.

### Fix

**File: `src/components/project/ProjectReport.tsx`** -- update the `handleDownloadPdf` function

1. **Add explicit CSS rules** for all arbitrary Tailwind classes used in the report, injected into the PDF's `<style>` block. This ensures the PDF renders identically to the screen, regardless of Tailwind CDN limitations:
   - `.tracking-\\[0\\.35em\\] { letter-spacing: 0.35em; }`
   - `.tracking-\\[2\\.5px\\] { letter-spacing: 2.5px; }`
   - `.tracking-\\[2px\\] { letter-spacing: 2px; }`
   - `.text-\\[9px\\] { font-size: 9px; }`
   - `.text-\\[10px\\] { font-size: 10px; }`
   - And all other arbitrary values used in the report

2. **Add page-break controls** to prevent sections from splitting:
   - `section, .bg-card { break-inside: avoid; }`
   - Keep existing `print:break-before-page` on Deal Financials and Category Breakdown sections

3. **Hide Recharts tooltips and interactive SVG elements** that don't render properly in print.

### Technical Details

The key change is in the `<style>` block of the generated HTML document inside `handleDownloadPdf`. After the existing CSS rules, add a block that maps every arbitrary Tailwind class used in the report to its actual CSS:

```css
/* Arbitrary value overrides for Tailwind CDN compatibility */
.tracking-\[0\.35em\] { letter-spacing: 0.35em !important; }
.tracking-\[2\.5px\] { letter-spacing: 2.5px !important; }
.tracking-\[2px\] { letter-spacing: 2px !important; }
.text-\[9px\] { font-size: 9px !important; line-height: 1.2; }
.text-\[10px\] { font-size: 10px !important; line-height: 1.4; }
.tracking-\[3px\] { letter-spacing: 3px !important; }
.border-t-\[3px\] { border-top-width: 3px !important; }
.h-\[10px\] { height: 10px !important; }

/* Page break controls */
section { break-inside: avoid; margin-bottom: 16px; }
.bg-card { break-inside: avoid; }
```

### Files Changed

- `src/components/project/ProjectReport.tsx` -- add arbitrary-value CSS overrides and page-break rules to the PDF export template

