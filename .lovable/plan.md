
## Fix: Add Contractor to Project Autocomplete

### Root Cause

In `src/components/ProjectAutocomplete.tsx`, lines 73–78, the `PROJECT_TYPE_GROUPS` array that controls which project types appear in the grouped dropdown is missing `'contractor'`:

```tsx
const PROJECT_TYPE_GROUPS: { type: string; label: string }[] = [
  { type: 'fix_flip', label: 'Fix & Flips' },
  { type: 'rental', label: 'Rentals' },
  { type: 'new_construction', label: 'New Builds' },
  { type: 'wholesaling', label: 'Wholesaling' },
  // 'contractor' is missing!
];
```

Because `groupedProjects` is built by filtering `filteredProjects` against this list, contractor projects are silently excluded.

### Fix

Add the missing `contractor` entry to `PROJECT_TYPE_GROUPS`:

```tsx
const PROJECT_TYPE_GROUPS: { type: string; label: string }[] = [
  { type: 'fix_flip', label: 'Fix & Flips' },
  { type: 'rental', label: 'Rentals' },
  { type: 'new_construction', label: 'New Builds' },
  { type: 'wholesaling', label: 'Wholesaling' },
  { type: 'contractor', label: 'Contractor' },
];
```

### Files to Modify

| File | Change |
|---|---|
| `src/components/ProjectAutocomplete.tsx` | Add `{ type: 'contractor', label: 'Contractor' }` to the `PROJECT_TYPE_GROUPS` array. |

One file, one line added.
