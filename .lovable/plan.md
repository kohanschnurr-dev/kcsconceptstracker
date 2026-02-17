

## Redesign Operation Rules as Permanent Guidelines

### What's Changing
Rules are being transformed from a "checklist you complete" into **permanent operating principles** -- lessons learned from past mistakes that should always be followed. Think of them like company commandments, not a to-do list.

### Key Changes

1. **Remove checkboxes and completion logic entirely**
   - No more checking off rules or marking them "done"
   - Remove the "View Completed" collapsible history section
   - Remove the `onToggleRule` prop and all completion-related code

2. **Add a description field for context ("the why")**
   - Each rule gets an optional description explaining the lesson behind it (e.g., "We lost $5K by skipping foundation inspection")
   - The `description` column already exists in the database, so no migration needed
   - The add-rule form gets a second input for the description
   - The `onAddRule` callback is updated to accept `{ title, category, description }`

3. **Pinned banner visual style**
   - Each rule displays as a prominent card with a left accent border (orange/primary)
   - Title is bold/medium weight, description shows below in muted text
   - An AlertTriangle or Shield icon on each rule reinforces the "permanent guideline" feel
   - Delete button remains (rules can still be removed if no longer relevant)

4. **Widget summary update**
   - The compact Rules widget text changes from showing completed counts to just showing total rule count per group
   - The small colored dots at the bottom of the widget change to always show as active (no more green = done / gray = pending distinction)

### Technical Details

**Files to modify:**

**`src/components/ops/RulesPopout.tsx`**
- Remove `Checkbox` import, `onToggleRule` prop, `historyOpen` state, `completedRules` filter
- Remove the completed/active split -- all rules are just "rules"
- Update `renderRuleCard` to show a left-border accent card with Shield icon, bold title, and muted description below
- Update the add-rule form to include a Textarea for description
- Update `onAddRule` type to include optional `description` field

**`src/components/ops/CompactDashboardWidgets.tsx`**
- Remove `onToggleRule` from props interface and destructuring
- Update the Rules widget dot indicators to all use the same active color (no completed/active distinction)
- Simplify `rulesSummary` to just show total count

**`src/pages/BusinessExpenses.tsx`**
- Remove the `onToggleRule` handler
- Update `onAddRule` to pass `description` to the insert
- Keep `onDeleteRule` and `onUpdateRuleCategory` as-is

### Visual Preview

```text
+----------------------------------------------+
| Operation Rules                    [gear] [x] |
+----------------------------------------------+
|                                                |
| Order of Operations                            |
|                                                |
| | Foundation First                             |
| | Never skip foundation inspection --          |
| | we lost $5K learning this lesson.    [trash] |
|                                                |
| | Permits Before Demo                          |
| | Always pull permits before starting          |
| | any demolition work.                 [trash] |
|                                                |
| Vendor Requirements                            |
|                                                |
| | Insurance Verification                       |
| | Verify all vendor insurance certs            |
| | before allowing on-site work.        [trash] |
|                                                |
| [+ Add New Rule]                               |
+------------------------------------------------+
```

Each rule card has a left primary-colored border accent to give the "pinned banner" feel, with the title prominent and description underneath in smaller muted text.
