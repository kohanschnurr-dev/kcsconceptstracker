

## Plan: Make Critical Path Text Black

**Problem**: Critical path tasks use `text-red-950` which appears washed out and unreadable, same issue as the category colors we already fixed.

### Change

**`src/components/calendar/DealCard.tsx`** — Line 80: Replace `text-red-950` with `text-foreground` in the critical path compact card styling:

```
// Before
'bg-red-200 dark:bg-red-500/30 text-red-950 dark:text-red-300 border-red-500'

// After  
'bg-red-200 dark:bg-red-500/30 text-foreground dark:text-red-300 border-red-500'
```

The red background + red border + alert icon already clearly convey "critical path" — the text itself should be black for readability, consistent with all other task cards.

