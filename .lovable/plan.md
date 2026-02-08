

## Plan: Reduce Cover Photo Size on Project Cards

### Overview
The cover photo currently takes up too much space on the project card. This change will reduce the photo height to create a more balanced card layout.

---

### Current vs. Proposed

| Aspect | Current | Proposed |
|--------|---------|----------|
| Photo Height | `aspect-video` (16:9 ratio) | Fixed height of `h-32` (128px) |
| Visual Balance | Photo dominates the card | Photo serves as a subtle header |

---

### Change

**File: `src/components/dashboard/ProjectCard.tsx`**

Line 63 - Change from:
```tsx
<div className="aspect-video w-full overflow-hidden">
```

To:
```tsx
<div className="h-32 w-full overflow-hidden">
```

This changes the photo container from a 16:9 aspect ratio to a fixed height of 128px, making it more like a compact banner rather than a hero image.

---

### Visual Result

```text
┌─────────────────────────────────────────┐
│ [Cover Photo - compact 128px height]    │
├─────────────────────────────────────────┤
│ 🔨 Wales Rental               [active]  │
│ 📍 5441 Wales Ave.                      │
│                                         │
│ Budget Progress                  97.9%  │
│ ████████████████████░░░░░░░░░░░░░░░░░░ │
│ $59,319 spent           $60,586 total  │
│ ─────────────────────────────────────  │
│ Remaining           Start Date          │
│ $1,267              📅 Jan 15, 2026    │
└─────────────────────────────────────────┘
```

The card content will now be more prominent while still showing the cover photo as a visual accent at the top.

