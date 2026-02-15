

## Fix Loan Calculator: Remove Presets, Simplify Save

### Problem
The preset system (built-in presets, user presets, default preset auto-loading, "To Date" auto-override) constantly fights with user-saved values. Every time the component re-renders or props update, effects stomp on what you just saved. The dirty-tracking patches have not been sufficient because there are too many competing effects.

### Solution
Strip out the entire preset system and simplify the component so that:
- Values initialize from the project's saved data (props) on mount
- User edits stay put in local state
- Clicking Save writes to the database and that's it -- no re-initialization, no auto-overrides
- The "To Date" term selector remains as a manual button the user can click, not something that auto-fires

### Changes to `src/components/project/HardMoneyLoanCalculator.tsx`

**1. Remove all preset-related code (~400 lines eliminated):**
- Remove `BUILT_IN_PRESETS`, `LoanPreset` interface
- Remove all preset state variables (`userPresets`, `savePresetOpen`, `presetName`, `savingPreset`, `editPresetOpen`, `editingPreset`, `editPresetName`, `editInterestRate`, `editLoanTermMonths`, `editPoints`, `editClosingCostsPercent`, `editInterestOnly`, `updatingPreset`, `deletePresetOpen`, `deletingPreset`, `presetsOpen`)
- Remove `handleClearDefaultPreset`, `handleSetDefaultPreset`, `handleSavePreset`, `handleDeletePreset`, `handleUpdatePreset`, `loadPreset`, `openEditDialog`
- Remove the preset-fetch `useEffect` (lines 209-264) -- this is the main culprit that auto-loads defaults and forces "To Date"
- Remove the entire Collapsible presets panel UI (lines 632-722)
- Remove the Save Preset dialog, Edit Preset dialog, and Delete Preset AlertDialog (lines 1175-1302)
- Remove the "Presets" button from the header

**2. Simplify state initialization:**
- Initialize state from props once on mount using `useState` defaults (already done)
- Remove `hasUserEdited` ref and `lastSavedValues` ref -- no longer needed
- Remove the sync `useEffect` (lines 185-206) entirely. State initializes from props via `useState` on mount; after that, only user input or Save changes it

**3. Simplify `handleSave`:**
- Just save to DB and show toast. Remove `lastSavedValues` tracking
- After successful save, invalidate the query (keeps parent in sync) but do NOT reset any local state -- local state is already correct since the user just set it

**4. Keep "To Date" as a manual action only:**
- The "To Date" button in the term selector stays, but it only fires when the user clicks it -- no auto-selection on mount or after preset load

### What stays the same
- All calculation logic (monthly payment, total interest, effective APR, etc.)
- All UI for inputs (loan amount, interest rate, term selector, points, closing costs, interest-only toggle)
- Rate sensitivity table, payoff timeline, daily interest display
- Term presets settings (the custom month slots, not loan presets)
- The Save button behavior

### Files to Change
- `src/components/project/HardMoneyLoanCalculator.tsx` -- Major cleanup removing ~400 lines of preset code and ~30 lines of sync/dirty-tracking logic

