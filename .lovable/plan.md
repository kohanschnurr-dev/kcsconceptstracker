## Plan: Project card budget progress uses construction spent

The project card's "Budget Progress" currently sums every category's `actualSpent` (showing $175,379 / 114.5%), which doesn't match the project's own "Construction Budget" tile ($157,677.65 / 102.9%).

### Change
**`src/components/dashboard/ProjectCard.tsx`**
- Replace `totalSpent = sum(categories.actualSpent)` with `project.constructionSpent` (the same value already piped in from `Projects.tsx` and used in the profit calc below).
- Fall back to the category sum only when `constructionSpent` is undefined (defensive, for any caller that doesn't supply it).
- The `Budget Progress` bar, `% used`, and `$X spent` line all read from this new value, so they'll match the construction tile on the detail page.

### Result
- The card on `/projects` will read **$157,678 spent / 102.9%** for 2808 Old North Rd, in sync with the project detail page.
- No backend / data changes; this is presentation-only.
