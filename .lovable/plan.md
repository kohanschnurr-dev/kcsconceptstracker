

## Fix: "All Projects" option missing from calendar project filter

### Problem
The `ProjectAutocomplete` component groups items by `projectType` (New Construction, Fix & Flips, Rentals). The synthetic "All Projects" entry (`{id: 'all', name: 'All Projects', address: ''}`) has no `projectType`, so it never appears in any group and is never rendered in the dropdown. Once a project is selected, there's no way to go back to viewing all projects.

### Solution

**File: `src/components/ProjectAutocomplete.tsx`**

Render "All Projects" (and any other ungrouped items like `id === 'all'`) as a separate item **above** the grouped project lists. Specifically:

1. Before the `groupedProjects.map(...)` block, check if `filteredProjects` contains an item with `id === 'all'`
2. If so, render it as a standalone `CommandItem` (outside any `CommandGroup`) at the top of the list
3. This ensures "All Projects" is always visible and selectable regardless of grouping logic

This is a small, targeted change — just ~10 lines added to the render section of `ProjectAutocomplete.tsx`.

