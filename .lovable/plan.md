

## Make Calendar Card Text Black on Light Theme

### Problem
Calendar event card labels (e.g., "Drywall", "Painting") use colored text like `text-blue-700` or `text-emerald-700` on light theme. The user wants plain black text on light backgrounds for better readability.

### Solution
Update `src/lib/calendarCategories.ts` to change every group's `textClass` from a colored light-mode value to `text-foreground` (which resolves to black/dark on light theme), keeping the colored text for dark mode.

**File: `src/lib/calendarCategories.ts`**

| Group | Current `textClass` | Updated `textClass` |
|-------|---------------------|---------------------|
| acquisition_admin | `text-blue-700 dark:text-blue-400` | `text-foreground dark:text-blue-400` |
| structural_exterior | `text-red-700 dark:text-red-400` | `text-foreground dark:text-red-400` |
| rough_ins | `text-orange-700 dark:text-orange-400` | `text-foreground dark:text-orange-400` |
| inspections | `text-purple-700 dark:text-purple-400` | `text-foreground dark:text-purple-400` |
| interior_finishes | `text-emerald-700 dark:text-emerald-400` | `text-foreground dark:text-emerald-400` |
| milestones | `text-amber-700 dark:text-amber-400` | `text-foreground dark:text-amber-400` |

Single file change -- propagates to all calendar cards, legend, and category pills via `getCategoryStyles()`.

