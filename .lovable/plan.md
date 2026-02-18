
## Move Delete Button Next to Edit Pencil

### Problem
The "Delete Project" button sits alone in the top-right corner (`<div className="flex items-start gap-2 shrink-0">` at line 869). When users go to click something in that area expecting project actions, they accidentally trigger the delete flow.

### Solution
Move the delete icon-only button to sit directly next to the pencil edit button in the title row (line 725–731), and remove the standalone top-right button entirely.

The delete button will:
- Be an **icon-only** button (just the `Trash2` icon, no label text) to keep it compact
- Match the pencil button's subtle styling: `p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors`
- Only appear when `!isEditing` (same condition as the pencil)
- Still trigger `setDeleteStep(1)` as before

### Layout After Change

```
Wales Rental  ✏️  🗑️  [active ▾]
```

The two icon buttons sit together as a small cluster next to the title, making their purpose (edit metadata / delete project) visually grouped and clearly separate from any tab action areas.

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**

1. **Lines 725–731** — After the pencil button block, add the trash icon button (also wrapped in `!isEditing`):
```tsx
{!isEditing && (
  <button
    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
    onClick={() => setDeleteStep(1)}
    aria-label="Delete project"
  >
    <Trash2 className="h-3.5 w-3.5" />
  </button>
)}
```

2. **Lines 869–879** — Remove the entire standalone delete button `<div>`:
```tsx
// DELETE THIS ENTIRE BLOCK:
<div className="flex items-start gap-2 shrink-0">
  <Button ... onClick={() => setDeleteStep(1)}>
    <Trash2 ... />
    Delete Project
  </Button>
</div>
```

No other changes needed — the delete dialog logic and `AlertDialog` components remain untouched.
