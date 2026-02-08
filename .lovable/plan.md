

## Plan: Adjust Cover Photo to Squarer Aspect Ratio

### Overview
Change the cover photo from a thin banner (`h-32` = 128px) to a more square-like aspect ratio that shows more of the house exterior.

---

### Current vs. Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Photo Height | `h-32` (128px) - thin banner | `aspect-[4/3]` (4:3 ratio) |
| Visual Result | Wide crop, cuts off top/bottom | More boxed, shows full exterior |

---

### Change

**File: `src/components/dashboard/ProjectCard.tsx`**

Line 63 - Change from:
```tsx
<div className="h-32 w-full overflow-hidden">
```

To:
```tsx
<div className="aspect-[4/3] w-full overflow-hidden">
```

The `aspect-[4/3]` ratio creates a more boxed shape that's ideal for showing house exteriors - tall enough to capture the full facade while still being compact.

---

### Visual Comparison

```text
Current (h-32 - thin banner):
┌─────────────────────────────────────────┐
│▓▓▓▓▓ Cover Photo (128px) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Crops off roof/yard
├─────────────────────────────────────────┤

Proposed (aspect-[4/3] - boxed):
┌─────────────────────────────────────────┐
│                                         │
│      Cover Photo (4:3 ratio)            │  ← Shows full exterior
│                                         │
├─────────────────────────────────────────┤
```

---

### Why 4:3?

- **Better for exteriors**: Shows roof, facade, and front yard
- **Classic photo ratio**: Matches typical real estate photo composition  
- **Balanced**: Not as tall as a square (1:1), not as wide as video (16:9)
- **Responsive**: Scales proportionally with card width

