

## Plan: Remove Phase 9, Add Rename/Delete/Add Phase Controls

### Changes

#### 1. `src/lib/budgetTimelinePhases.ts`
- Remove Phase 9 (Final Systems) from `TIMELINE_PHASES` array; move `utilities` to Phase 10 (Closeout)
- Expand `TimelineCustomization` to also store custom phase metadata:
  - Add a new type `TimelinePhaseConfig` with `{ phases: PhaseOverride[], categoryMap: Record<string, string[]> }` where `PhaseOverride = { key, label, iconName }`
  - Export a `PHASE_CONFIG_STORAGE_KEY` for the phase structure customizations
  - Add helper: `getCustomPhases()` returns merged default + custom phase list (respecting renames, deletions, additions)
  - Add helper: `getIconByName(name: string)` maps icon name strings to Lucide components (needed for serialization since icons can't be stored in localStorage)
- Update `buildTimelineGroups` to accept the custom phase config, skipping deleted phases, using renamed labels, and including user-added phases

#### 2. `src/components/budget/BudgetCanvas.tsx`

**New state:**
- `customPhases` — stores the user's phase structure overrides (renames, deletions, added phases) in localStorage

**Settings dialog enhancements (timeline mode only):**
- Add a **rename input** at the top of the phase settings dialog — an editable text field pre-filled with the phase name
- Add a **"Delete Phase"** button (destructive, bottom of dialog) — moves all items to "Other" and removes the phase
- Confirmation prompt before delete

**Toolbar addition (timeline mode only):**
- Add a **"+ Add Phase"** button next to the view toggle (or at the bottom of the phase list)
- Opens a small dialog/popover: name input + icon picker (dropdown of ~10 Lucide icons)
- Creates a new empty phase that the user can then populate via the existing "Add item" flow

**Icon picker:**
- Simple Select dropdown with the ~10 construction-relevant Lucide icons already imported (ClipboardList, Shovel, Home, Zap, Layers, Trees, Paintbrush, CookingPot, Wrench, CheckCircle2, Package)

### Files
- `src/lib/budgetTimelinePhases.ts` — remove Phase 9, add phase config types and helpers
- `src/components/budget/BudgetCanvas.tsx` — rename/delete/add phase UI

