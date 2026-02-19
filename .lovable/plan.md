
# Fix PDF Dead Space & Single-Page Layout

## Root Causes Identified

From the screenshot, three specific bugs are causing the problems:

### 1. `min-height: 100vh` on `.page`
The page wrapper forces itself to be at least the full viewport height. When content is short (a simple receipt), this creates a massive empty gray block below the content before the footer.

**Fix:** Remove `min-height: 100vh` entirely. The page should only be as tall as its content.

### 2. Blank lines in AI output creating `height:10px` spacers
The `renderContent` function converts every empty line into `<div style="height:10px;"></div>`. The AI output typically has multiple blank lines between sections, and between the last section and the total. These stack up into the visible dead space gap.

**Fix:** Collapse consecutive empty lines — only emit one spacer per group of blank lines (deduplicate). Also reduce the spacer height from `10px` to `4px`.

### 3. Total box appended after all content
The total lines are pulled out of the flow and appended at the very end of `renderContent`. If the AI output has blank lines after the last real section but before the total, those spacers appear as a gap above the total box.

**Fix:** Keep detecting total lines separately (for special styling), but don't append the box after all content — instead, insert it inline where the total line was detected in the text flow. This eliminates the gap between the last content and the total.

### 4. `content-wrapper` padding is too large
Current: `padding: 36px 44px 40px` — this adds 76px of vertical breathing room around the card, visible as the gray background area.

**Fix:** Reduce to `padding: 20px 36px 24px`.

### 5. Footer padding creates second-page bleed
`padding: 16px 0 36px` on the footer adds 52px below the footer text, which on short documents can push the last pixel onto page 2.

**Fix:** Reduce to `padding: 12px 0 16px`.

## Changes to `src/lib/pdfExport.ts`

### A. `renderContent` — deduplicate blank lines & inline total box

Current behavior:
```
line 1 content
[empty spacer 10px]
[empty spacer 10px]   ← stacks up
[empty spacer 10px]
line 2 content
```

New behavior:
```
line 1 content
[empty spacer 4px]   ← only one, collapsed
line 2 content
```

The total box insertion changes from "always appended at end" to "inserted inline in position", so it appears immediately after the last content line with no gap.

### B. CSS changes

| Property | Current | New |
|---|---|---|
| `.page` `min-height` | `100vh` | removed |
| `.content-wrapper` padding | `36px 44px 40px` | `20px 36px 24px` |
| `.content-card` padding | `36px 40px` | `24px 32px` |
| `.footer` padding | `16px 0 36px` | `12px 0 16px` |
| `.header` padding | `28px 44px` | `20px 36px` |
| `.meta-bar` padding | `11px 44px` | `8px 36px` |
| Section header `margin-top` | `24px` | `16px` |
| Empty spacer height | `10px` | `4px` |
| Total box `margin-top` | `28px` | `12px` |

### C. `@page` print rule — enforce portrait

Add `size: A4 portrait` to the `@page` rule inside `@media print`, and also add `min-height: unset` to `.page` within print media to eliminate any remaining forced height.

```css
@page { size: A4 portrait; margin: 0; }
@media print {
  .page { min-height: unset; }
}
```

## Result

- No dead gray space between content and total box
- No forced second page for short documents
- Portrait orientation locked
- Total box appears inline, right after the last content section
- Documents with many line items still naturally flow to page 2
