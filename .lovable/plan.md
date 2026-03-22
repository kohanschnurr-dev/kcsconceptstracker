

## Plan: Fix Refi Loan Amount & Equity in Property Scaling

### Problem
The "Refi Loan Amount" and "Equity in Property" values use a fixed `text-xl` size that doesn't scale for larger dollar amounts, causing them to look misaligned or overflow their containers.

### Change

**`src/components/project/CashFlowCalculator.tsx`** (lines 599-622)

- Add `flex flex-col items-center justify-center` to all three refi stat boxes so content is properly centered vertically and horizontally
- Change the value text from `text-xl` to `text-lg sm:text-xl` for better scaling on smaller viewports
- Add `truncate` to the value `<p>` tags to prevent overflow on very large numbers
- Apply `min-h-[80px]` to all three boxes so they stay equal height even when the "Cash Out at Refi" box has the extra "money left in deal" subtitle

This is a ~6-line class update in one file.

