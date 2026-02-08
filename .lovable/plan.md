

## Plan: Make Cover Photo More Compact

### Overview
Reduce the cover photo aspect ratio from `3:2` to `16:9` (widescreen) to create a more compact banner-style photo that allows 3 cards to fit comfortably in a row without excessive vertical scrolling.

---

### Aspect Ratio Comparison

| Ratio | Height vs Width | Description |
|-------|-----------------|-------------|
| `4:3` | 75% of width | Tall, boxed |
| `3:2` (current) | 67% of width | Standard photo |
| `16:9` (proposed) | 56% of width | Widescreen, compact |

Going from `3:2` to `16:9` reduces the photo height by about 16%, making cards noticeably more compact while still showing the house exterior in a cinematic format.

---

### Change

**File: `src/components/dashboard/ProjectCard.tsx`**

Line 63 - Change from:
```tsx
<div className="aspect-[3/2] w-full overflow-hidden">
```

To:
```tsx
<div className="aspect-video w-full overflow-hidden">
```

Note: `aspect-video` is Tailwind's built-in class for `16:9` ratio.

---

### Visual Comparison

```text
Current (3:2):
┌───────────────────────┐
│                       │
│     Cover Photo       │  67% height ratio
│                       │
├───────────────────────┤
│ Project Content       │
└───────────────────────┘

Proposed (16:9):
┌───────────────────────┐
│     Cover Photo       │  56% height ratio
├───────────────────────┤
│ Project Content       │
└───────────────────────┘
```

---

### Result

With 3 cards per row on desktop (`xl:grid-cols-3`), this more compact ratio will:
- Show more cards above the fold
- Reduce vertical scrolling
- Still display house exteriors in a cinematic widescreen format

