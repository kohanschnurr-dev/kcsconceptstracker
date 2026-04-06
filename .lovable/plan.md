

## Plan: Add Hide Feature to QuickBooks Pending Expenses

The hide feature was added to the main Expenses page but not to the QuickBooks pending expenses panel you're looking at. This plan adds it there.

### Changes

**1. Database Migration**
- Add `is_hidden boolean default false` to `quickbooks_expenses` table

**2. `src/hooks/useQuickBooks.ts`**
- Update `fetchPendingExpenses` query to filter out `is_hidden = true` by default
- Add `hideExpense(id)` function that sets `is_hidden = true` and removes from local state
- Add `unhideExpense(id)` function that sets `is_hidden = false`
- Add `fetchHiddenExpenses()` to load hidden ones on demand
- Add `hiddenExpenses` state and `showHidden` toggle
- Expose all new functions/state in the return object

**3. `src/components/quickbooks/GroupedPendingExpenseCard.tsx`**
- Add `onHide` callback prop alongside existing `onDelete`
- Replace the trash icon button with an `EyeOff` hide button (same position, same styling)
- Keep delete available but make hide the primary action

**4. `src/components/QuickBooksIntegration.tsx`**
- Pass `onHide={hideExpense}` to `GroupedPendingExpenseCard`
- Add a small discrete "Hidden (N)" toggle button below the pending list (only visible when hidden expenses exist)
- When toggled on, show hidden expenses with an `Eye` (unhide) button on each

**5. `src/components/BusinessQuickBooksIntegration.tsx`**
- Same hide button treatment for the business expenses QuickBooks panel — the trash button in each pending expense card gets an `EyeOff` hide companion

### UI Details
- Hide button: `EyeOff` icon, ghost variant, appears next to the existing trash icon
- "View Hidden" toggle: small text button like `👁 Hidden (3)`, positioned below the pending list
- Hidden view shows expenses with a muted style and an `Eye` restore button

