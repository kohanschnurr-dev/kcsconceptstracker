

## Plan: Reduce Cover Photo Aspect Ratio

### Overview
Decrease the cover photo height from the current `4:3` ratio to a slightly more compact `3:2` ratio. This gives a bit more breathing room while still showing the house exterior nicely.

---

### Aspect Ratio Options

| Ratio | Description | Use Case |
|-------|-------------|----------|
| `4:3` (current) | Tall, boxed | Full portraits |
| `3:2` (proposed) | Balanced | Real estate standard |
| `16:9` | Wide banner | Video thumbnails |

The `3:2` ratio is actually the standard for real estate photography - it's what most listing photos use. It's slightly wider than 4:3, making it a bit more compact on the card.

---

### Change

**File: `src/components/dashboard/ProjectCard.tsx`**

Line 63 - Change from:
```tsx
<div className="aspect-[4/3] w-full overflow-hidden">
```

To:
```tsx
<div className="aspect-[3/2] w-full overflow-hidden">
```

---

### Visual Comparison

```text
Current (4:3 - taller):
┌─────────────────────────┐
│                         │
│    Cover Photo          │  ~75% of width as height
│                         │
├─────────────────────────┤

Proposed (3:2 - slightly shorter):
┌─────────────────────────┐
│                         │
│    Cover Photo          │  ~67% of width as height
├─────────────────────────┤
```

This creates a photo that's about 10% shorter while still maintaining a balanced, boxed look that shows the house exterior well.

