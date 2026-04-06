
The issue is not the compact critical-path card anymore; that already uses `text-foreground`. The remaining unreadable red text is in the full `DealCard` view.

Implementation plan:
1. Update `src/components/calendar/DealCard.tsx` in the non-compact card styles.
2. Replace both remaining critical-path text classes:
   - icon badge: `text-red-950` → `text-foreground`
   - “Critical Path” pill: `text-red-950` → `text-foreground`
3. Keep the red background, red border, and dark-mode red text as-is so the critical-path status still looks red, but the light-mode label becomes truly black/readable.

Why this will fix it:
- The screenshot matches the non-compact card/pill styling, not the compact row.
- There are exactly two leftover `text-red-950` critical-path usages in `DealCard.tsx`, so this is a small targeted fix.

Files to change:
- `src/components/calendar/DealCard.tsx`

Technical detail:
```tsx
// before
'bg-red-200 dark:bg-red-500/20 text-red-950 dark:text-red-400 border-red-500'

// after
'bg-red-200 dark:bg-red-500/20 text-foreground dark:text-red-400 border-red-500'
```
