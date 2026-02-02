

## Plan: Add "New Construction" as Third Project Type

### Overview

Add "New Construction" as a new project type alongside "Fix & Flips" and "Rentals". This will include filler content for testing the functionality with the card display.

---

### Changes Summary

| File | Change |
|------|--------|
| Database Migration | Add `new_construction` to `project_type` enum |
| `src/types/index.ts` | Add `new_construction` to `ProjectType` union |
| `src/pages/Projects.tsx` | Add third tab, update state type, add new construction grid |
| `src/components/dashboard/ProjectCard.tsx` | Add new construction icon and display logic |
| `src/components/NewProjectModal.tsx` | Add third tab trigger for New Construction |

---

### Database Migration

Add the new enum value to the existing `project_type` enum:

```sql
ALTER TYPE project_type ADD VALUE 'new_construction';
```

---

### Technical Details

**File: `src/types/index.ts`**

Update the `ProjectType` union:
```typescript
// Before
export type ProjectType = 'fix_flip' | 'rental';

// After
export type ProjectType = 'fix_flip' | 'rental' | 'new_construction';
```

---

**File: `src/pages/Projects.tsx`**

| Current | New |
|---------|-----|
| `mainTab` state type: `'fix_flip' \| 'rental'` | `'fix_flip' \| 'rental' \| 'new_construction'` |
| 2-column TabsList | 3-column TabsList |
| 2 TabsContent (fix_flip, rental) | 3 TabsContent (add new_construction) |

Add new construction filtering and counts:
```typescript
const newConstructionProjects = getFilteredProjects('new_construction');
const newConstructionCounts = getStatusCounts('new_construction');
```

Add tab with icon:
```tsx
<TabsTrigger value="new_construction" className="gap-2">
  <Building2 className="h-4 w-4" />
  New Construction ({newConstructionCounts.total})
</TabsTrigger>
```

Update empty state messaging for new construction.

---

**File: `src/components/dashboard/ProjectCard.tsx`**

Add display logic for new construction projects:
- Icon: `Building2` (same as project modal)
- Budget progress: Show similar to fix_flip (tracked budget)
- Type label in stats: "New Build"

```typescript
const isNewConstruction = project.projectType === 'new_construction';

// Icon selection
{isNewConstruction ? (
  <Building2 className="h-4 w-4 text-muted-foreground" />
) : isRental ? (
  <Home className="h-4 w-4 text-muted-foreground" />
) : (
  <Hammer className="h-4 w-4 text-muted-foreground" />
)}
```

New construction will show budget progress like fix & flips since builds have budgets.

---

**File: `src/components/NewProjectModal.tsx`**

Update to 3-column grid with new tab:
```tsx
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="fix_flip" className="gap-2">
    <Hammer className="h-4 w-4" />
    Fix & Flip
  </TabsTrigger>
  <TabsTrigger value="rental" className="gap-2">
    <Home className="h-4 w-4" />
    Rental
  </TabsTrigger>
  <TabsTrigger value="new_construction" className="gap-2">
    <Building2 className="h-4 w-4" />
    New Build
  </TabsTrigger>
</TabsList>
```

Update placeholder text for new construction:
```typescript
placeholder={
  projectType === 'new_construction' 
    ? "Lot 45 Custom Home, Lakeside Estates..." 
    : projectType === 'fix_flip' 
      ? "Oak Cliff Flip..." 
      : "Rental Property 1..."
}
```

---

### UI Layout Change

**Projects Page Tabs:**

```text
BEFORE:
┌─────────────────────┬─────────────────────┐
│   Fix & Flips (1)   │    Rentals (1)      │
└─────────────────────┴─────────────────────┘

AFTER:
┌───────────────┬───────────────┬───────────────────┐
│ Fix & Flips(1)│  Rentals (1)  │ New Construction(0)│
└───────────────┴───────────────┴───────────────────┘
```

---

### Empty State for New Construction

When no new construction projects exist:
```tsx
<p className="text-muted-foreground mb-4">
  No new construction projects yet
</p>
<Button onClick={() => setModalOpen(true)} className="gap-2">
  <Plus className="h-4 w-4" />
  Create Your First Build
</Button>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| Database | Add migration for enum value |
| `src/types/index.ts` | Add `new_construction` to ProjectType |
| `src/pages/Projects.tsx` | Add 3rd tab, filtering, counts, empty state |
| `src/components/dashboard/ProjectCard.tsx` | Add Building2 icon, new construction display logic |
| `src/components/NewProjectModal.tsx` | Add 3rd tab option with Building2 icon |

