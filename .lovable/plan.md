

## Plan: Make Critical Path Card Icons Black

**Problem**: The compact critical-path cards on the monthly calendar show orange/red icons (warning triangle + category icon) instead of black text. The title text is already `text-foreground` (black), but the icons remain colored.

### Change

**`src/components/calendar/DealCard.tsx`** — Line 85: Change the `AlertTriangle` icon from `text-red-400` to `text-foreground` so it renders black in light mode.

Additionally, ensure the category icon also renders black for critical path items by adding a `text-foreground` override on line 86 when `isCriticalPath` is true.

```tsx
// Line 85: before
{task.isCriticalPath && <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />}

// Line 85: after
{task.isCriticalPath && <AlertTriangle className="h-3 w-3 text-foreground shrink-0" />}
```

**Files**: `src/components/calendar/DealCard.tsx` (1 line edit)

