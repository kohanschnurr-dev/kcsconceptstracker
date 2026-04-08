

## Integrate Loans Page Data into Project Loan Tab

### Problem
The project Loan tab currently shows a standalone calculator that saves to `projects` columns (`hm_*`). The user wants it to display real loan data from the `loans` table, with a selector to link/unlink loans.

### Design

The Loan tab will be restructured into three states:

1. **No loan linked** — Show a selector to pick from the user's existing loans (or a link to create one on the Loans page). Keep the calculator as a fallback estimator below.

2. **Loan linked** — Replace the calculator with an embedded loan detail view (reusing patterns from `LoanDetail.tsx`): summary stats, overview cards, amortization table, draw schedule, and payment history. Include a button to unlink and a link to view the full loan detail page.

3. **Multiple loans** — If multiple loans share this `project_id`, list them all.

### Technical Changes

**File: `src/pages/ProjectDetail.tsx`**
- Replace the `HardMoneyLoanCalculator` in the `loan` `TabsContent` with a new `ProjectLoanTab` component
- Pass `projectId` as prop

**New file: `src/components/project/ProjectLoanTab.tsx`**
- Fetch all loans for this project using `useLoans` (filter by `project_id`)
- Fetch user's unlinked loans for the selector dropdown
- **Loan Selector**: Dropdown of user's loans + "Link to Project" button. Uses `updateLoan` mutation to set `project_id`.
- **Unlink button**: Sets `project_id` to `null` on the loan
- **Linked loan display** (per loan):
  - Summary stat cards (Original Amount, Balance, Rate, Monthly Payment, Remaining Term, Interest Paid) — same layout as `LoanDetail.tsx`
  - Tabs: Overview, Amortization, Draws, Payments — reusing `AmortizationTable`, `DrawScheduleTracker`, `PaymentHistoryTab` components directly
  - "View Full Details" link to `/loans/{id}`
  - "Edit" button opening `AddLoanModal`
- Uses `useLoanDetail` hook for each linked loan to get draws/payments
- **Keep the calculator collapsed** at the bottom as "Quick Estimate Calculator" accordion for users who haven't created a formal loan yet

**File: `src/hooks/useLoans.ts`**
- Add a query for fetching user's unlinked loans (where `project_id IS NULL`) for the selector

### UI Flow
```text
┌─────────────────────────────────────────────┐
│ Loan Tab                                     │
│                                              │
│ [If no loans linked]                         │
│  ┌─ Link a Loan ─────────────────────────┐  │
│  │ Select loan: [▼ Lender - $200K      ] │  │
│  │              [Link to Project]         │  │
│  │  or  Go to Loans page to create one   │  │
│  └────────────────────────────────────────┘  │
│  ┌─ Quick Estimate Calculator (accordion) ┐  │
│                                              │
│ [If loan linked]                             │
│  ┌─ ABC Capital - Hard Money ──── [Unlink]┐  │
│  │ Stats Row: Amount | Balance | Rate ... │  │
│  │ Tabs: Overview | Amortization | Draws  │  │
│  │       | Payments                       │  │
│  │ [View Full Details →]                  │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Existing Components Reused (no changes needed)
- `AmortizationTable` — takes a `Loan` object
- `DrawScheduleTracker` — takes draws array + callbacks
- `PaymentHistoryTab` — takes payments array + callbacks
- `AddLoanModal` — for editing
- `LoanStatusBadge`, `LoanTypeBadge` — for badges
- `useLoanDetail` hook — for fetching draws/payments

