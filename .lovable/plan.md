
## Change Rough-ins Color from Amber to Orange

The "Rough-ins" group currently uses `amber` which is too close to the "Milestones" group's `yellow/amber`. Switching Rough-ins to `orange` provides clear visual separation.

### Change

**`src/lib/calendarCategories.ts`** — Update the `rough_ins` entry in `CATEGORY_GROUPS` (lines 36-43):

- `color`: `'amber'` → `'orange'`
- `bgClass`: `bg-amber-200 dark:bg-amber-500/20` → `bg-orange-200 dark:bg-orange-500/20`
- `swatchClass`: `bg-amber-600` → `bg-orange-600`
- `textClass`: `text-amber-700 dark:text-amber-400` → `text-orange-700 dark:text-orange-400`
- `borderClass`: `border-amber-400 dark:border-amber-500/30` → `border-orange-400 dark:border-orange-500/30`

One file, six class value swaps. No other files affected.
