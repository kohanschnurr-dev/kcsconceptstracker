

## Plan: Change "Purchase Price" to "Land Price" for New Construction

A small, targeted change to make the Profit Calculator label context-aware.

### Changes

**`src/components/project/ProfitCalculator.tsx`**
- Add optional `projectType` prop (default `'fix_flip'`)
- Change the "Purchase Price" label to render `"Land Price"` when `projectType === 'new_construction'`
- Update the breakdown panel text from "− Purchase Price" to "− Land Price" for new construction
- Update the ROI breakdown "Purchase Price" line similarly

**`src/pages/ProjectDetail.tsx`**
- Pass `projectType={project.project_type}` to the `<ProfitCalculator />` component

### Files touched (2)
- `src/components/project/ProfitCalculator.tsx`
- `src/pages/ProjectDetail.tsx`

