
## Update ProjectAutocomplete: Remove @mention, Add Project Type Groups

### What Changes
1. Remove the "@mention" reference from the search placeholder
2. Group projects by type (Fix & Flip, Rental, New Construction, Wholesaling) using `CommandGroup` headers
3. Preserve the user's starred project ordering within each group
4. Fetch `project_type` alongside existing project data in BusinessExpenses

### Technical Steps

**1. `src/pages/BusinessExpenses.tsx`**
- Update the projects query to also select `project_type`:
  - Change `.select('id, name, address')` to `.select('id, name, address, project_type')`
- Update the `projects` state type to include `project_type?: string`

**2. `src/components/ProjectAutocomplete.tsx`**
- Update the `Project` interface to include `project_type?: string`
- Change the `CommandInput` placeholder from `"Type to search or @mention..."` to `"Search projects..."`
- Remove the `@` prefix stripping logic from the search filter
- Replace the single `CommandGroup` with multiple groups, one per project type, in this order: Fix & Flip, Rental, New Construction, Wholesaling
- Each group gets a labeled header (e.g., "Fix & Flips", "Rentals", "New Builds", "Wholesaling")
- Empty groups are hidden
- Within each group, projects maintain alphabetical sort order (existing behavior)
