

## Add / Remove / Reorder Rule Groups in Operation Rules

### Overview
The rule groups ("Order of Operations", "Vendor Requirements") are currently hardcoded. This change makes them fully dynamic -- users can add new groups, delete groups, and drag to reorder them. The pattern follows the existing custom trade groups system used in the Budget Calculator.

### Storage
Rule groups will be persisted in localStorage (key: `custom-rule-groups`) following the same pattern as trade groups (`custom-trade-groups`). No database changes needed since the `operation_codes.category` column is already a free-form string.

### Changes

**New file: `src/lib/ruleGroups.ts`**
- Define default groups: `order_of_operations` ("Order of Operations") and `vendor_requirements` ("Vendor Requirements")
- `loadRuleGroups()` / `saveRuleGroups()` functions for localStorage persistence
- `loadRuleGroupOrder()` / `saveRuleGroupOrder()` for custom sort order
- Sync with settings via `triggerSettingsSync()` on save

**Modified file: `src/components/ops/RulesPopout.tsx`**
- Add a "Manage Groups" toggle/section at the top of the dialog (gear icon button next to the title)
- When in manage mode, show the list of groups with:
  - Drag handles (GripVertical icon) for reordering via `@dnd-kit/sortable` (already installed)
  - Delete button (Trash2 icon) on each group -- deleting a group reassigns its rules to the first remaining group
  - "Add Group" input at the bottom to create new groups
- Replace the hardcoded `SelectItem` list with the dynamic group list from `loadRuleGroups()`
- Render active rules dynamically by iterating over the ordered groups instead of hardcoded `activeOrderOfOps` / `activeVendorReqs`

### UI Flow
1. User opens Operation Rules dialog
2. A small gear icon next to "Operation Rules" title toggles group management mode
3. In manage mode: groups are listed with drag handles and delete buttons, plus an "Add Group" input
4. Back in normal mode: the category dropdown and section headers reflect the custom groups in the user's chosen order

### Technical Details

```text
RulesPopout
+-- [Gear icon] toggles manageMode state
+-- manageMode === true:
|   +-- DndContext + SortableContext (vertical list)
|   |   +-- Each group: [GripVertical] [Label] [Trash2]
|   +-- Input + "Add" button for new group
+-- manageMode === false:
    +-- Add rule form (category Select uses dynamic groups)
    +-- Active rules grouped by dynamic group order
    +-- Completed rules collapsible
```

- When a group is deleted, any rules with that category get updated to the first available group via `onUpdateRuleCategory` callback (new prop)
- Group keys are generated as snake_case from the label (e.g., "Safety Checks" becomes "safety_checks")
- The default two groups cannot be deleted if they are the only ones remaining (minimum 1 group required)

### Files
- **Create**: `src/lib/ruleGroups.ts`
- **Edit**: `src/components/ops/RulesPopout.tsx`
- **Edit**: `src/pages/BusinessExpenses.tsx` (pass new `onUpdateRuleCategory` prop)
