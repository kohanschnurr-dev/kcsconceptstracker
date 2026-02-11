
## Change Budget Progress Bar Color to Theme Color

### Problem
The budget progress bar on the Project Card turns bright red (`bg-destructive`) when over 100%, which clashes with the overall theme aesthetic.

### Fix

**File: `src/components/dashboard/ProjectCard.tsx`** (line 26)

Update the `getProgressColor` function to use `bg-primary` (the theme's orange accent) instead of `bg-destructive` (red) for the over-budget state:

```
Before:  if (percentSpent > 100) return 'bg-destructive';
After:   if (percentSpent > 100) return 'bg-primary';
```

This single-line change makes the over-budget bar match the app's orange theme color instead of the harsh red.
