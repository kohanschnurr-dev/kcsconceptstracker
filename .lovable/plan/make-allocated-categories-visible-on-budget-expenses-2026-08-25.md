# Make Allocated Categories Visible on Budget & Expenses

## What's happening

For 2102 Columbia Dr the allocations already exist: 32 of 55 categories carry budget, totaling $88,050 — exactly the project's total budget. They aren't visible because the "Budget by Category" section on the Budget & Expenses tab is collapsed by default, and the Total Budget card reads "Manual override" instead of telling you the money is fully allocated.

## Changes

1. **Open the category breakdown by default.** The "Budget by Category" section starts expanded so the allocated list is visible on load. Collapse state is remembered per project so it stays how you leave it.

2. **Make the Total Budget card report allocation.** Replace the bare "Manual override" caption with an allocation summary, e.g. "32 of 55 categories allocated - $88,050 assigned" and, when the allocated total differs from the total budget, a short "$X unallocated" note in the warning color.

3. **Click-through.** Clicking that caption scrolls to and expands the Budget by Category section.

4. **Sort and filter stay as-is** — allocated categories first by budget size, zero-budget/zero-spend categories still hidden behind the existing "N unallocated" pill.

## Technical notes

- All edits in `src/pages/ProjectBudget.tsx`.
- `categorySectionOpen` initial state becomes `true`, persisted to `localStorage` under a key scoped by project id.
- Allocation summary derives from existing `categoryTotal`, `categories.length`, and the count of categories with `estimated_budget > 0` — no new queries or schema changes.
- Add a ref on the category card for the scroll-into-view behavior.
