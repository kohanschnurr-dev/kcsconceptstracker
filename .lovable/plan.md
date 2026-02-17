
## Open Add Expense Modal Inline on Project Budget Page

### What's Changing
The "+ Add Expense" button on the Project Budget page currently navigates to `/expenses`, requiring an extra click. This update makes it open the `QuickExpenseModal` directly on the page instead.

### Technical Detail

**File: `src/pages/ProjectBudget.tsx`**

1. Import `QuickExpenseModal` from `@/components/QuickExpenseModal`.
2. Add state: `const [expenseModalOpen, setExpenseModalOpen] = useState(false);`
3. Change the button's `onClick` from `navigate('/expenses')` to `setExpenseModalOpen(true)`.
4. Render `<QuickExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />` at the bottom of the component JSX.
5. To auto-refresh expense data after adding, call the existing query refetch in the modal's close handler (refetch when modal closes and was previously open).

### Files
- **Edit**: `src/pages/ProjectBudget.tsx` -- Replace navigation with inline modal state and render QuickExpenseModal
