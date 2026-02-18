
## Fix Due Date Column Alignment in Pipeline Tasks

### Root Cause

The screenshot reveals the problem clearly: "Due Feb 18" and "Due Feb 17" don't start at the same horizontal position because the content inside the `w-[100px]` div is **left-aligned** by default. Since `flex-1` on the title expands and flex gap spacing is consistent, the *start* of the 100px box is consistent — but the content inside it is left-aligned, meaning visually the text appears in different spots row-to-row when it's a different length (though "Due Feb 18" vs "Due Feb 17" should be similar length).

More critically, the **icon + text** are left-aligned inside the box, but the box visually appears "floating" in the middle of a long row, making it feel misaligned against the badges.

The real fix is twofold:
1. **Right-align the due date content** within its fixed box so it always sits flush against the badge group — `justify-end` on the flex container
2. **Increase the width** slightly to `w-[105px]` to ensure "Due Feb 18" always fits without wrapping

### The Fix

In `src/components/project/ProjectTasks.tsx`, change line 142:

**Before:**
```tsx
<div className="w-[100px] shrink-0 flex items-center gap-1">
```

**After:**
```tsx
<div className="w-[105px] shrink-0 flex items-center justify-end gap-1">
```

Adding `justify-end` pushes the calendar icon + "Due Feb 18" text to the **right edge** of the fixed-width column, so it always appears immediately to the left of the priority badge — perfectly aligned row over row regardless of title length.

### Visual Result

```
[ ☐ ] [ Tell Jose, Garage, Patio… ─── flex-1 ]  [📅 Due Feb 18] [High][ⓘ]
[ ☐ ] [ Garage Studs etc, situation ─── flex-1 ] [             ] [High][ⓘ]
[ ☐ ] [ Tell him about Concrete… ─── flex-1 ]   [📅 Due Feb 17] [Med ][ⓘ]
[ ☐ ] [ Adding 2x4s by patio ─────── flex-1 ]   [             ] [Med ][ⓘ]
                                                   ↑ right-aligned inside fixed 105px box
```

### File to Modify

| File | Change |
|------|--------|
| `src/components/project/ProjectTasks.tsx` | Add `justify-end` to due date wrapper div (line 142) |
