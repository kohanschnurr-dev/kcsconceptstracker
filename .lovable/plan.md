

## Reorderable Project Type Tabs

### Overview

Allow users to drag-and-drop the project type tabs (Fix & Flips, Rentals, New Builds, Wholesaling) into their preferred order. The order persists in the database so it's remembered across sessions.

### Database Change

Add a `project_tab_order` column to the `profiles` table to store the user's preferred tab ordering as a JSON array.

- **Column**: `project_tab_order` (type `jsonb`, nullable, default `null`)
- **Default behavior**: When null, use the current order: `['fix_flip', 'rental', 'new_construction', 'wholesaling']`
- RLS already exists on the profiles table, so no new policies needed.

### Frontend Changes

**1. Define tab config array (`src/pages/Projects.tsx`)**

Create a static array of tab definitions (value, label, icon) and derive the rendered order from the user's saved preference or the default.

**2. Make tabs draggable**

Use `@dnd-kit/core` and `@dnd-kit/sortable` (already installed) to wrap the `TabsList` with drag-and-drop support. Each `TabsTrigger` becomes a sortable item.

**3. Save order on drop**

When the user finishes reordering, save the new order to `profiles.project_tab_order` via Supabase and update local state. The first tab in the order auto-selects as the default when the page loads.

**4. Load saved order on mount**

Fetch the user's profile on mount; if `project_tab_order` exists, use it to set both the tab rendering order and the initial active tab.

### Technical Details

**Tab config structure:**
```typescript
const TAB_CONFIG = [
  { value: 'fix_flip', label: 'Fix & Flips', icon: Hammer },
  { value: 'rental', label: 'Rentals', icon: Home },
  { value: 'new_construction', label: 'New Builds', icon: Building2 },
  { value: 'wholesaling', label: 'Wholesaling', icon: Handshake },
];
```

**Drag-and-drop approach:**
- Wrap `TabsList` with `DndContext` and `SortableContext` (horizontal strategy)
- Each tab trigger uses `useSortable` for drag handles
- On `DragEnd`, reorder the array and persist to the database
- A subtle drag indicator (grip dots or cursor change) signals reorderability

**Profile hook update (`src/hooks/useProfile.ts`):**
- Extend the `Profile` interface to include `project_tab_order: string[] | null`
- Extend `updateProfile` (or add a separate mutation) to save the tab order

**Files modified:**
- `src/pages/Projects.tsx` -- draggable tabs, load/save order
- `src/hooks/useProfile.ts` -- expose tab order field
- Migration SQL -- add `project_tab_order` column to `profiles`

