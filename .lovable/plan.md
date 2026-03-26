

## Plan: Customizable Timeline Phases — Add/Move Items + Drag Reorder

### Problem
1. Some categories (e.g., "Foundation") land in "Other" because they're not mapped to a phase
2. Users can't move items between phases or reorder items within a phase

### Approach
Add two capabilities to the Timeline View's per-phase settings dialog:

**A. "Add Items" section** — A dropdown of all categories NOT currently in this phase, letting users pull items from other phases (or "Other") into the current one. When an item is added to Phase X, it's removed from its previous phase.

**B. Drag-to-reorder** — In the "Show / Hide Items" list, make rows draggable (using `@dnd-kit/sortable`, already installed) so users can set the display order within a phase.

Both customizations are persisted to `localStorage` (key: `budget-timeline-custom`) and optionally synced to the `profiles` table. The `buildTimelineGroups` function will accept these overrides.

### Changes

#### 1. `src/lib/budgetTimelinePhases.ts`
- Export a type `TimelineCustomization = Record<string, string[]>` — maps phase keys to ordered category arrays
- Update `buildTimelineGroups` to accept an optional customization parameter
- When customizations exist: override each phase's categories with the custom list, then compute "Other" from whatever's left unassigned
- Categories added to a phase via customization are removed from their default phase automatically

#### 2. `src/components/budget/BudgetCanvas.tsx`

**State:**
- Add `timelineCustom` state (`Record<string, string[]>`) loaded from localStorage key `budget-timeline-custom`
- Pass it into `buildTimelineGroups(categories, timelineCustom)`

**Settings Dialog — Timeline mode enhancements:**
- Add a new "Add Items" section below "Show / Hide Items" with a Select dropdown listing all categories not in the active phase. An "+ Add" button moves the selected category into the phase.
- A "Remove" button (small X or minus icon) on each item lets users send it back to its default phase (or "Other").
- Wrap the "Show / Hide Items" list in `<DndContext>` + `<SortableContext>` with `verticalListSortingStrategy`. Each row gets a grip handle (`GripVertical` icon) for drag reorder. On `DragEnd`, reorder the phase's category array using `arrayMove`.
- These additions only appear when `viewMode === 'timeline'`.

**Save logic:**
- On save, persist the updated phase category assignments (order + membership) to `timelineCustom` in localStorage
- The existing presets + hidden categories save logic remains unchanged

#### 3. No schema changes needed
localStorage persistence is sufficient. If the user wants cross-device sync later, we can add a JSONB column.

### UI Sketch (settings dialog in timeline mode)
```text
+------------------------------------------+
| Phase 2 — Site Work & Foundation Settings|
|                                          |
| Presets                                  |
|   (existing preset UI)                   |
|                                          |
| Items in this phase          (drag)      |
|   ≡  Foundation Repair         👁  ✕    |
|   ≡  Demolition                👁  ✕    |
|   ≡  Concrete                  👁  ✕    |
|   ≡  Drain Line Repair         👁  ✕    |
|                                          |
| + Add item from another phase            |
|   [ Select item...        v ] [+ Add]   |
|                                          |
|              [Cancel]  [Save]            |
+------------------------------------------+
```

### Files
- `src/lib/budgetTimelinePhases.ts` — add customization parameter
- `src/components/budget/BudgetCanvas.tsx` — add/move UI, drag reorder, persist custom phase assignments

