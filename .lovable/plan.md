

## Remove Forced Page Breaks Before Deal Financials

### Problem

The Deal Financials and Category Breakdown sections both have `print:break-before-page` which forces them to always start on a new page. This leaves a large blank area at the bottom of page 1 when there's plenty of room for the Deal Financials section to begin there.

### Fix

**File: `src/components/project/ProjectReport.tsx`**

1. **Remove `print:break-before-page` from the Deal Financials section** (line 442) -- change the className from `"report-anim print:break-before-page"` to just `"report-anim"`. This lets it flow naturally after the Budget Snapshot section.

2. **Keep `print:break-before-page` on Category Breakdown** (line 579) -- this section contains the large donut chart and spending table, so a page break before it still makes sense.

3. **Remove the CSS rule for `.print\:break-before-page`** from the three places it's declared (lines 265, 296, 674) -- No, actually keep the CSS rule since Category Breakdown still uses it. Just remove the class from the Deal Financials section element.

Summary: One-line change -- remove `print:break-before-page` from the Deal Financials section's className on line 442.

### Files Changed

- `src/components/project/ProjectReport.tsx` -- remove `print:break-before-page` class from the Deal Financials section element (line 442)

