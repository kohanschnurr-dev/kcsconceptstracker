
## Fix: Calendar Card Text Still Colored on Light Palettes

### Root Cause
The `<html>` element has `class="dark"` hardcoded in `index.html`, and Tailwind is configured with `darkMode: ["class"]`. This means `dark:text-blue-400` (and all other `dark:` text color variants) are **always active**, overriding the `text-foreground` we set previously. The light palettes (Ivory, Pearl, Linen) change CSS variables but never remove the `dark` class.

### Solution
Remove the `dark:` color variants from `textClass` entirely in `src/lib/calendarCategories.ts`. Since all palettes use CSS variables for theming (not Tailwind's dark mode), the `text-foreground` class alone will correctly resolve to dark text on light palettes and light text on dark palettes -- because `--foreground` is set per-palette.

### Technical Changes

**File: `src/lib/calendarCategories.ts`**

Update every group's `textClass` to just `text-foreground` (removing the `dark:text-*` variants):

| Group | Current | Updated |
|-------|---------|---------|
| acquisition_admin | `text-foreground dark:text-blue-400` | `text-foreground` |
| structural_exterior | `text-foreground dark:text-red-400` | `text-foreground` |
| rough_ins | `text-foreground dark:text-orange-400` | `text-foreground` |
| inspections | `text-foreground dark:text-purple-400` | `text-foreground` |
| interior_finishes | `text-foreground dark:text-emerald-400` | `text-foreground` |
| milestones | `text-foreground dark:text-amber-400` | `text-foreground` |

This is a single file, 6-line change. Calendar cards will now show black/dark text on Ivory, Pearl, and Linen, and light text on dark palettes like Ember, Graphite, etc. -- all driven by the `--foreground` CSS variable per palette.
