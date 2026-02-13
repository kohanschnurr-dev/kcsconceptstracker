

## Fix Profit Display on Project Cards (Projects Page)

### Problem
The Projects page (`/projects`) is missing the data needed to display profit on project cards:
1. It doesn't fetch `arv` or `purchase_price` from the database when building Project objects
2. It doesn't compute `constructionSpent` (construction-only expenses) per project
3. Without these, every project card on the Projects page shows a dash for profit

The Dashboard (Index.tsx) already does this correctly -- the Projects page needs the same treatment.

### Technical Changes

**`src/pages/Projects.tsx`** (lines 78-136):

1. Update the expenses query to also fetch `project_id` and `cost_type` fields (currently only fetches `category_id, amount`)
2. Add construction-only expense aggregation per project (same pattern as Index.tsx)
3. Add `arv`, `purchasePrice`, and `constructionSpent` to the project transform (lines 113-136)

Specifically:
- Change expenses select from `'category_id, amount'` to `'category_id, amount, project_id, cost_type'`
- Change QB expenses select to also include `'project_id, cost_type'`
- Add a `constructionByProject` accumulator that sums expenses where `cost_type` is null or `'construction'`
- Map `arv: p.arv ?? 0` and `purchasePrice: p.purchase_price ?? 0` in the project transform
- Map `constructionSpent: constructionByProject[p.id] || 0`

No other files need changes -- the ProjectCard component already has the profit display logic.
