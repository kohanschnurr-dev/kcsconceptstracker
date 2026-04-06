

## Plan: Improve Calendar Event Card Text Readability

**Problem**: Event cards on the calendar have text that's too light/hard to read in light mode, especially critical path items and small compact cards.

### Changes

#### 1. `src/lib/calendarCategories.ts` — Darken light-mode text colors
Replace the `-800` shades with `-900` for stronger contrast:
- `text-blue-800` → `text-blue-900`
- `text-red-800` → `text-red-900`
- `text-orange-800` → `text-orange-900`
- `text-purple-800` → `text-purple-900`
- `text-emerald-800` → `text-emerald-900`
- `text-amber-800` → `text-amber-900`

Also darken backgrounds slightly for better visibility:
- `bg-blue-50` → `bg-blue-100`
- Same pattern for all other colors

#### 2. `src/components/calendar/DealCard.tsx` — Fix critical path compact styling
- Line 80: Change `text-red-300` → `text-red-900 dark:text-red-300` so critical path text is dark/readable in light mode
- Line 80: Change `bg-red-500/30` → `bg-red-100 dark:bg-red-500/30`

### Files
- `src/lib/calendarCategories.ts`
- `src/components/calendar/DealCard.tsx`

