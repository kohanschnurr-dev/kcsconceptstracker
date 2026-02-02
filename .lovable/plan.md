

## Plan: Add Rehab Budget Field with Auto-Update + Manual Override

### Overview

Add a "Rehab Budget" input field in the left sidebar after ARV. This field will:
1. Automatically sync with the total calculated from all category budgets
2. Allow manual entry for fast underwriting (when user doesn't want to fill in every category)
3. When manually edited, distribute the value evenly across categories (optional behavior)

---

### UI Changes

**Left Sidebar - New Field Order:**

| Field | Behavior |
|-------|----------|
| Purchase Price | Manual input |
| After Repair Value (ARV) | Manual input |
| **Rehab Budget** (NEW) | Auto-updates from category total OR manual entry |

---

### Implementation Details

**File: `src/components/CreateBudgetModal.tsx`**

1. **Add new state for manual override mode**
   - Track whether user is manually editing the Rehab Budget vs auto-syncing
   - `rehabBudgetOverride`: string (manual value when user types directly)
   - `isRehabBudgetManual`: boolean (tracks if user is in manual mode)

2. **Add Rehab Budget input after ARV field**
   - Shows calculated `totalBudget` by default
   - When user types, switches to manual mode
   - Small "sync" button to reset back to auto-calculated value

3. **Behavior Logic**
   - Default: Field displays the sum of all category budgets (read-only appearance but editable)
   - On manual edit: User types a value, this becomes the "override" 
   - When user edits categories: If in auto mode, Rehab Budget updates; if in manual mode, stays fixed
   - Optional: "Distribute" button spreads manual Rehab Budget evenly across categories

4. **Update form reset logic**
   - Reset manual override state when modal opens/closes
   - Load rehab budget from template when editing

---

### Visual Design

```
After Repair Value (ARV)
┌─────────────────────────┐
│ $  350000               │
└─────────────────────────┘

Rehab Budget
┌─────────────────────────┐
│ $  85000          [↻]   │  ← Auto-synced (or manual with reset button)
└─────────────────────────┘
```

The field will have a subtle indicator showing whether it's auto-calculated or manually set, with a reset/sync icon to return to auto mode.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/CreateBudgetModal.tsx` | Add Rehab Budget field with dual-mode logic (auto-sync + manual override) |

---

### Edge Cases Handled

- **Editing existing template**: Load the stored total as the initial Rehab Budget value
- **Manual then category edit**: If user manually sets Rehab Budget, then edits a category, the Rehab Budget stays fixed (manual mode)
- **Reset to auto**: User can click sync icon to return to auto-calculated mode
- **Empty state**: Shows $0 when no categories have values

