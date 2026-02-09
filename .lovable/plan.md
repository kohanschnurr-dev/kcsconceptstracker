
## Alphabetically Order Projects and Hide Completed Ones from Selection

### Overview

Ensure that everywhere a project can be selected (dropdowns, autocomplete, mentions), the list is sorted alphabetically by name and completed projects are excluded.

### Changes

**1. `src/components/ProjectAutocomplete.tsx`** (central component used in most places)

- Sort `filteredByStatus` alphabetically by `project.name` (case-insensitive)
- Change the default behavior of `filterActive` -- currently defaults to `false`. Update the filtering logic so that projects with `status === 'complete'` are always excluded unless a new prop `showComplete` is explicitly set to `true`. This way all existing consumers automatically get the fix.

**2. `src/components/quickbooks/GroupedPendingExpenseCard.tsx`** (2 Select dropdowns)

- Sort and filter the `projects` array before rendering: `projects.filter(p => p.status !== 'complete').sort((a, b) => a.name.localeCompare(b.name))` in both `projects.map()` calls (lines ~213 and ~395)

**3. `src/components/SplitExpenseModal.tsx`** (1 Select dropdown)

- Same sort + filter applied to the `projects.map()` at line ~237

**4. `src/components/procurement/BundleModal.tsx`** (1 Select dropdown)

- Same sort + filter at line ~250

**5. `src/components/MentionTextarea.tsx`** (mention suggestions)

- Sort the `filteredProjects` result alphabetically
- Filter out completed projects in the `useMemo` block

### Technical Details

The core pattern applied everywhere is:

```typescript
// Filter out complete, then sort alphabetically
projects
  .filter(p => p.status !== 'complete')
  .sort((a, b) => a.name.localeCompare(b.name))
```

For `ProjectAutocomplete`, this is done inside the `filteredByStatus` memo so it cascades to search results too. For `MentionTextarea`, it's applied in the existing `filteredProjects` memo. For the raw `Select` components, it's applied inline.

No database or backend changes needed -- this is purely frontend sorting and filtering.
