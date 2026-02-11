

## Persist Budget Category Presets to the Database

### Problem

Currently, budget category presets (the $/sqft rates you customize in the Edit Presets dialog) are saved only in your browser's local storage. This means they can be lost if you clear your browser data, switch devices, or use a different browser.

### Solution

Save presets to the database tied to your user account so they persist permanently across sessions, devices, and browsers.

### What Changes

1. **Database**: Add a `budget_presets` JSONB column to the `profiles` table to store your preset configurations
2. **BudgetCanvas**: Update the Edit Presets dialog to load/save presets from the database instead of localStorage, falling back to localStorage if no database record exists (one-time migration of your current presets)
3. **TemplatePicker and BudgetCalculator**: Update the two other files that read presets from localStorage to instead accept presets as a prop from BudgetCanvas (or read from the same database source)

### Technical Details

**Database Migration:**
- Add `budget_presets` (JSONB, nullable) column to `profiles` table

**File: `src/components/budget/BudgetCanvas.tsx`**
1. On mount, fetch presets from the `profiles` table for the current user. If null, check localStorage for existing presets (migration) and save those to the database. If neither exists, use defaults.
2. Update `handleSavePresets` to write to the `profiles.budget_presets` column instead of (or in addition to) localStorage
3. Keep localStorage as a write-through cache so TemplatePicker and BudgetCalculator can still read from it without refactoring

**Files: `src/components/budget/TemplatePicker.tsx` and `src/pages/BudgetCalculator.tsx`**
- No changes needed -- they read from localStorage which will stay in sync as a cache

**Flow:**
1. User opens Budget Calculator -- BudgetCanvas loads presets from database
2. Also writes them to localStorage (cache for other components)
3. User edits presets and clicks Save -- writes to both database and localStorage
4. Days later, user returns -- presets load from database, always up to date
