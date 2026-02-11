

## Fix Priority Badge Readability Across Themes

### Problem
Priority badges (High, Urgent, Medium) use hardcoded Tailwind colors with `dark:` variants that never activate because the app uses CSS-variable-based palettes rather than a `dark` class. On light themes, the badges look faded; on dark themes, light backgrounds clash with the dark UI.

### Solution
Replace hardcoded color classes with theme-aware CSS variable classes that work universally across all palettes.

### File: `src/types/task.ts`

Update `TASK_PRIORITY_COLORS` to use semantic, theme-compatible classes:

```
low:    'bg-muted text-muted-foreground'              (no change)
medium: 'bg-blue-500/15 text-blue-600 border border-blue-500/20'
high:   'bg-orange-500/15 text-orange-600 border border-orange-500/20'
urgent: 'bg-red-500/15 text-red-600 border border-red-500/20'
```

This uses transparent overlays (e.g., `bg-red-500/15`) which adapt to any background -- they're subtle on light themes and still visible on dark themes. The text colors (`text-red-600`, `text-orange-600`) have enough contrast on both light and dark backgrounds.

### Why This Works
- `/15` opacity backgrounds blend with whatever the underlying card/background color is
- `text-*-600` shades are mid-range and readable on both light (white-ish) and dark (slate-ish) surfaces
- No `dark:` prefix needed since the opacity approach is inherently adaptive

### No Other Files Need Changes
All 5 consumer files reference `TASK_PRIORITY_COLORS` from the single source in `task.ts` -- updating the constants fixes everything everywhere.

