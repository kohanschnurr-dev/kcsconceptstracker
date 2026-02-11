

## Reorder Settings Cards: Account Above Company Branding

Move the Account card above the Company Branding card in `src/pages/Settings.tsx`.

### Technical Change

**File: `src/pages/Settings.tsx`**

Reorder the cards in the grid so they appear in this order:
1. Account (currently 3rd)
2. Company Branding (currently 1st)
3. Manage Sources (currently 2nd)
4. Legal (currently 4th)

This is a simple cut-and-paste of the Account card JSX block above the Company Branding card block. No logic changes needed.

