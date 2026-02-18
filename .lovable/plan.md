
## Fix: Word-Boundary Truncation on Task Titles

### Problem

In `ProjectTasks.tsx`, task titles use Tailwind's `truncate` class (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`). This clips text at the exact character boundary, producing mid-word cuts like **"Tell Jose, Garage, Patio, Finis…"**.

### Root Cause

`truncate` (and CSS `text-overflow: ellipsis`) operates at the character level — it cuts wherever the text hits the container boundary, regardless of word boundaries.

### Fix

Replace `truncate` with `line-clamp-1` on the title `<p>`. Tailwind's `line-clamp-1` applies `-webkit-line-clamp: 1` which:
- Breaks only at word boundaries
- Ensures `…` always appears after the last **complete** word
- Keeps the text on a single line (same visual result, just cleaner truncation)

```tsx
// Before
<p className={cn(
  "text-sm font-medium truncate",
  task.status === 'completed' && "line-through text-muted-foreground"
)}>

// After
<p className={cn(
  "text-sm font-medium line-clamp-1",
  task.status === 'completed' && "line-through text-muted-foreground"
)}>
```

### Files to Modify

| File | Line | Change |
|---|---|---|
| `src/components/project/ProjectTasks.tsx` | 215 | `truncate` → `line-clamp-1` |

One word change. No logic, no other files.
