

## Update Categories Widget to "Category Breakdown"

### Change
Replace the current Categories widget (dots + count) with a cleaner "Category Breakdown" label and a more useful mini-visualization showing the top spending categories as small proportional bars instead of uniform dots.

### File: `src/components/ops/CompactDashboardWidgets.tsx`

**Lines 132-152** -- Replace the Categories widget content:

1. Change header label from "Categories" to "Category Breakdown"
2. Replace the count text ("8 categories") with a summary like the top category name and spend, or just a cleaner "X active" count
3. Replace the dots row with small horizontal proportional bars showing top 3-4 category spend ratios -- gives actual information at a glance instead of meaningless dots
4. Keep the click-to-open CategoriesPopout behavior

Updated widget will look something like:

```text
[grid icon] CATEGORY BREAKDOWN
$X,XXX across Y categories
[====] [===] [==] [=]   (proportional mini-bars for top categories)
```

### Technical Details

- Add a `useMemo` to compute top category spending amounts (reuse the category aggregation logic already partially present)
- Render 3-4 small `div` bars with `flex-grow` proportional to each category's spend
- Keep the same 100px height, padding, and click handler

