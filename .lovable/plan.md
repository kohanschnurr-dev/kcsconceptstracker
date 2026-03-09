

## Speed Up Stats Count-Up Animation

The count-up animation in `StatsRow.tsx` currently takes 1500ms per stat with staggered 250ms delays between each (up to 750ms delay for the last stat). This makes the section feel sluggish.

**Changes in `src/components/landing/StatsRow.tsx`:**
- Reduce animation duration from 1500ms to 800ms
- Reduce stagger delay from 250ms to 100ms per stat
- This brings total animation time from ~2250ms down to ~1100ms

