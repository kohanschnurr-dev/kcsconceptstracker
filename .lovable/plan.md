

## Show Custom Trade Groups as Section Headers in Settings

### Problem
The "Purchase & Sale" custom group you created appears in the "Manage Groups" area but doesn't show up as a section header (like Structure, MEPs, Finishes, etc.) in the Expense Categories list. This is because the code skips any group with zero categories.

### Solution
Update the rendering logic in `src/components/settings/ManageSourcesCard.tsx` so that custom trade groups always appear as section headers -- even when empty -- just like the built-in groups that have categories. This lets you see the group and start assigning categories to it via the dropdown.

### Technical Details

**File: `src/components/settings/ManageSourcesCard.tsx` (line 244)**

Change the filter to keep custom groups visible even when empty:

```typescript
// Before
if (groupItems.length === 0) return null;

// After
const customDefs = loadCustomGroups();
if (groupItems.length === 0 && !(groupKey in customDefs)) return null;
```

Also add a subtle empty-state hint when a custom group has no categories yet:

```tsx
{groupItems.length === 0 && (
  <p className="text-xs text-muted-foreground/60 italic">
    No categories assigned yet
  </p>
)}
```

### Files Modified
- `src/components/settings/ManageSourcesCard.tsx` -- show empty custom groups as section headers with placeholder text

