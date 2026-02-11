

## Fix Calendar Card Text Readability on Light Backgrounds

### Problem
The calendar event cards use light-tinted text colors (e.g., `text-blue-400`, `text-emerald-400`) which are hard to read on light/white theme backgrounds. The colored card backgrounds should stay, but text needs to be dark on light themes.

### Solution
Update `src/lib/calendarCategories.ts` to use theme-responsive text colors. Each `textClass` will use a dark shade for light mode and the current light shade for dark mode.

**File: `src/lib/calendarCategories.ts`**

Update the `textClass` in each category group:

| Group | Current | Updated |
|-------|---------|---------|
| Acquisition/Admin | `text-blue-400` | `text-blue-700 dark:text-blue-400` |
| Structural/Exterior | `text-red-400` | `text-red-700 dark:text-red-400` |
| Rough-ins | `text-orange-400` | `text-orange-700 dark:text-orange-400` |
| Inspections | `text-purple-400` | `text-purple-700 dark:text-purple-400` |
| Interior Finishes | `text-emerald-400` | `text-emerald-700 dark:text-emerald-400` |
| Milestones | `text-amber-400` | `text-amber-700 dark:text-amber-400` |

This single file change propagates to every calendar card (DealCard compact + full, legend, category pills) since they all call `getCategoryStyles()`.

