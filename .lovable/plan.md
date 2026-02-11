

## Bring Operation Rules UI to Match Goals UI

### What Changes

The Rules popout currently has a minimal UI -- just checkboxes with no ability to toggle completion, delete rules, or see completed history. The Goals popout has a richer UI with edit, complete, uncomplete, and delete actions. This plan brings the same patterns over.

### File Changes

**1. `src/components/ops/RulesPopout.tsx`** -- Major UI overhaul:
- Add `onToggleRule` prop to toggle `is_completed` (checkbox becomes functional)
- Add `onDeleteRule` prop with trash icon button on each rule
- Move the add form below the rules list with an "Add New Rule" outline button (matching Goals' layout)
- Remove the `+`/`X` toggle from the header
- Add a completed rules collapsible history section (matching Goals' "View Completed" pattern) using `Collapsible` + `ChevronDown`
- Split rules into active (not completed) and completed, grouped by category
- Add `Trash2`, `ChevronDown` icons
- Use the same card styling (`p-3 rounded-lg bg-muted/20`) and action button layout as Goals
- Dialog uses `max-h-[80vh] overflow-y-auto` like Goals instead of ScrollArea

**2. `src/components/ops/CompactDashboardWidgets.tsx`** -- Add new props:
- Add `onToggleRule` and `onDeleteRule` to the props interface
- Destructure and pass them through to `RulesPopout`

**3. `src/pages/BusinessExpenses.tsx`** -- Add handlers:
- `onToggleRule`: Updates `is_completed` on the `operation_codes` table and updates local state
- `onDeleteRule`: Deletes the row from `operation_codes` and removes from local state

### Technical Details

**RulesPopout new props:**
```typescript
interface RulesPopoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: OperationCode[];
  onAddRule?: (rule: { title: string; category: string }) => Promise<void>;
  onToggleRule?: (ruleId: string, completed: boolean) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
}
```

**Rule card layout** (matching Goals):
- Left: functional checkbox (calls `onToggleRule`)
- Center: rule title (with strikethrough if completed)
- Right: delete button (Trash2 icon, destructive color)

**Completed history section:**
- Active rules shown at top, grouped by category
- Collapsible "View Completed (N)" section at bottom with completed rules
- Completed rules show a reopen button (RotateCcw icon) to uncomplete them

**BusinessExpenses handlers:**
```typescript
onToggleRule={async (ruleId, completed) => {
  await supabase.from('operation_codes')
    .update({ is_completed: completed })
    .eq('id', ruleId);
  setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_completed: completed } : r));
}}
onDeleteRule={async (ruleId) => {
  await supabase.from('operation_codes').delete().eq('id', ruleId);
  setRules(prev => prev.filter(r => r.id !== ruleId));
}}
```

