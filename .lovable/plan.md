

## Plan: Darken Category Group Heading Colors in New Event Dropdown

**Problem**: The group headings ("ROUGH-INS", "INSPECTIONS", etc.) in the New Event category dropdown use `-950` text colors that appear faint/washed-out against the white popover background. The user cannot read them.

**Root cause**: `text-amber-950`, `text-purple-950`, `text-yellow-950` etc. are extremely dark near-black shades that lose their color identity on white. They need to be replaced with mid-range saturated colors that are both readable AND clearly colored.

### Changes

**1. `src/lib/calendarCategories.ts`** — Replace `textClass` with stronger, more saturated mid-tone colors:
- `acquisition_admin`: `text-blue-950` → `text-blue-700 dark:text-blue-200`
- `structural_exterior`: `text-red-950` → `text-red-700 dark:text-red-200`
- `rough_ins`: `text-amber-950` → `text-amber-700 dark:text-amber-200`
- `inspections`: `text-purple-950` → `text-purple-700 dark:text-purple-200`
- `interior_finishes`: `text-emerald-950` → `text-emerald-700 dark:text-emerald-200`
- `milestones`: `text-yellow-950` → `text-yellow-700 dark:text-amber-200`

The `-700` shades are saturated and bold — clearly readable as their respective colors on white backgrounds, while still dark enough to be legible.

**2. `src/components/calendar/DealCard.tsx`** — Already uses `text-foreground` (black) for task card text, so no changes needed there.

**Files**: `src/lib/calendarCategories.ts` (6 line changes)

