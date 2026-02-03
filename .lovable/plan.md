

## Plan: Add Wholesaling Project Type

### Overview

Add "Wholesaling" as a fourth project type alongside Fix & Flips, Rentals, and New Builds. This includes database schema updates, TypeScript types, UI tabs, filtering logic, and project creation support.

---

### Changes Summary

| Area | Files | Change |
|------|-------|--------|
| Database | New migration | Add `wholesaling` to `project_type` enum |
| Types | `src/types/index.ts` | Add `wholesaling` to `ProjectType` union |
| Projects Page | `src/pages/Projects.tsx` | Add Wholesaling tab with icon and filtering |
| New Project Modal | `src/components/NewProjectModal.tsx` | Add Wholesaling option in type selector |
| Dashboard | `src/pages/Index.tsx` | Update type assertion to include wholesaling |
| Main Layout | `src/components/layout/MainLayout.tsx` | Update type assertion |

---

### Technical Details

#### 1. Database Migration

Add `wholesaling` value to the existing `project_type` enum:

```sql
ALTER TYPE project_type ADD VALUE 'wholesaling';
```

---

#### 2. Update TypeScript Types

**File: `src/types/index.ts`**

Update the `ProjectType` union type (line 2):

```typescript
// Before
export type ProjectType = 'fix_flip' | 'rental' | 'new_construction';

// After  
export type ProjectType = 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling';
```

---

#### 3. Update Projects Page

**File: `src/pages/Projects.tsx`**

**3a. Add Handshake icon import (line 3):**

```typescript
import { Plus, Search, FolderKanban, Home, Hammer, Building2, Handshake } from 'lucide-react';
```

**3b. Update mainTab state type (line 25):**

```typescript
const [mainTab, setMainTab] = useState<'fix_flip' | 'rental' | 'new_construction' | 'wholesaling'>('fix_flip');
```

**3c. Add wholesaling projects filter (after line 126):**

```typescript
const wholesalingProjects = getFilteredProjects('wholesaling');
```

**3d. Add wholesaling counts (after line 139):**

```typescript
const wholesalingCounts = getStatusCounts('wholesaling');
```

**3e. Update renderProjectGrid to handle wholesaling (line 142):**

```typescript
const renderProjectGrid = (filteredProjects: Project[], type: ProjectType) => {
  const counts = type === 'fix_flip' ? fixFlipCounts 
    : type === 'rental' ? rentalCounts 
    : type === 'new_construction' ? newConstructionCounts 
    : wholesalingCounts;
  const typeLabel = type === 'fix_flip' ? 'fix & flip' 
    : type === 'rental' ? 'rental' 
    : type === 'new_construction' ? 'new construction'
    : 'wholesaling';
  const createLabel = type === 'fix_flip' ? 'Flip' 
    : type === 'rental' ? 'Rental' 
    : type === 'new_construction' ? 'Build'
    : 'Deal';
  // ... rest of function
};
```

**3f. Update tabs from 3 columns to 4 columns (line 232):**

```tsx
<TabsList className="grid w-full max-w-2xl grid-cols-4">
  <TabsTrigger value="fix_flip" className="gap-2">
    <Hammer className="h-4 w-4" />
    Fix & Flips ({fixFlipCounts.total})
  </TabsTrigger>
  <TabsTrigger value="rental" className="gap-2">
    <Home className="h-4 w-4" />
    Rentals ({rentalCounts.total})
  </TabsTrigger>
  <TabsTrigger value="new_construction" className="gap-2">
    <Building2 className="h-4 w-4" />
    New Builds ({newConstructionCounts.total})
  </TabsTrigger>
  <TabsTrigger value="wholesaling" className="gap-2">
    <Handshake className="h-4 w-4" />
    Wholesaling ({wholesalingCounts.total})
  </TabsTrigger>
</TabsList>
```

**3g. Add TabsContent for wholesaling (after line 257):**

```tsx
<TabsContent value="wholesaling" className="mt-6">
  {renderProjectGrid(wholesalingProjects, 'wholesaling')}
</TabsContent>
```

**3h. Update onValueChange type assertion (line 231):**

```typescript
onValueChange={(v) => { 
  setMainTab(v as 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling'); 
  setStatusTab('all'); 
}}
```

---

#### 4. Update New Project Modal

**File: `src/components/NewProjectModal.tsx`**

**4a. Add Handshake icon import (line 2):**

```typescript
import { Building2, MapPin, DollarSign, Calendar, Hammer, Home, Handshake } from 'lucide-react';
```

**4b. Update TabsList to 4 columns (line 134):**

```tsx
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="fix_flip" className="gap-1 text-xs">
    <Hammer className="h-4 w-4" />
    <span className="hidden sm:inline">Fix & Flip</span>
  </TabsTrigger>
  <TabsTrigger value="rental" className="gap-1 text-xs">
    <Home className="h-4 w-4" />
    <span className="hidden sm:inline">Rental</span>
  </TabsTrigger>
  <TabsTrigger value="new_construction" className="gap-1 text-xs">
    <Building2 className="h-4 w-4" />
    <span className="hidden sm:inline">New Build</span>
  </TabsTrigger>
  <TabsTrigger value="wholesaling" className="gap-1 text-xs">
    <Handshake className="h-4 w-4" />
    <span className="hidden sm:inline">Wholesale</span>
  </TabsTrigger>
</TabsList>
```

**4c. Update placeholder text logic (line 155):**

```typescript
placeholder={
  projectType === 'new_construction' 
    ? "Lot 45 Custom Home, Lakeside Estates..." 
    : projectType === 'fix_flip' 
      ? "Oak Cliff Flip, Downtown Bungalow..." 
      : projectType === 'wholesaling'
        ? "123 Main St Contract, Quick Assignment..."
        : "Rental Property 1, Main St Duplex..."
}
```

---

#### 5. Update Dashboard

**File: `src/pages/Index.tsx`**

Update type assertion for projectType (line 125):

```typescript
projectType: p.project_type as 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling',
```

Update active projects sorting to prioritize fix & flips first (lines 180-186):

```typescript
const activeProjects = projects
  .filter(p => p.status === 'active')
  .sort((a, b) => {
    // Priority order: fix_flip > wholesaling > new_construction > rental
    const priority = { fix_flip: 0, wholesaling: 1, new_construction: 2, rental: 3 };
    return (priority[a.projectType] ?? 4) - (priority[b.projectType] ?? 4);
  });
```

---

#### 6. Update Main Layout

**File: `src/components/layout/MainLayout.tsx`**

Update type assertion (line 34):

```typescript
projectType: p.project_type as 'fix_flip' | 'rental' | 'new_construction' | 'wholesaling',
```

---

### Visual Result

**Projects Page Tabs (Updated):**

```text
┌─────────────┬──────────┬─────────────┬──────────────┐
│ 🔨 Fix &    │ 🏠       │ 🏗️ New      │ 🤝          │
│ Flips (1)   │ Rentals  │ Builds (1)  │ Wholesaling │
│             │ (1)      │             │ (0)         │
└─────────────┴──────────┴─────────────┴──────────────┘
```

**New Project Modal Type Selector:**

```text
┌───────────┬─────────┬───────────┬───────────┐
│ 🔨        │ 🏠      │ 🏗️        │ 🤝        │
│ Fix&Flip  │ Rental  │ New Build │ Wholesale │
└───────────┴─────────┴───────────┴───────────┘
```

---

### Files to Modify

| File | Changes |
|------|---------|
| Database migration (new) | Add `wholesaling` to enum |
| `src/types/index.ts` | Add `wholesaling` to ProjectType |
| `src/pages/Projects.tsx` | Add tab, filtering, counts for wholesaling |
| `src/components/NewProjectModal.tsx` | Add wholesaling option in type picker |
| `src/pages/Index.tsx` | Update type assertions |
| `src/components/layout/MainLayout.tsx` | Update type assertions |

