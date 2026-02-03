

## Plan: Reduce Table Row Border Brightness

### Problem

The table row divider lines in the Procurement table (and other tables using the shadcn Table component) appear too bright/white against the dark background. This is because the `TableRow` component uses `border-b` which applies the full `border` color without any opacity reduction.

---

### Solution

Reduce the brightness of table row borders by applying a lower opacity to the border, matching the subtle styling used in the custom `.data-table` class.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/ui/table.tsx` | Reduce border opacity on TableRow and TableHeader |

---

### Technical Details

**File: `src/components/ui/table.tsx`**

#### 1. Update TableHeader border (line 15)

**Current:**
```tsx
className={cn("[&_tr]:border-b", className)}
```

**New:**
```tsx
className={cn("[&_tr]:border-b [&_tr]:border-border/30", className)}
```

#### 2. Update TableRow border (line 37)

**Current:**
```tsx
className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
```

**New:**
```tsx
className={cn("border-b border-border/30 transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
```

---

### Visual Result

**Before:**
- Bright white/gray divider lines between table rows
- High contrast that draws too much attention

**After:**
- Subtle, understated divider lines at 30% opacity
- Lines are visible but don't dominate the visual hierarchy
- Matches the dark mode professional aesthetic

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/ui/table.tsx` | 15, 37 | Add `border-border/30` to reduce border brightness |

