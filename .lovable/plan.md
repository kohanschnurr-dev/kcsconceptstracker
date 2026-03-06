

## Center the Bouncing Arrow

The ping/glow circles and the chevron icon are inside a `relative flex items-center justify-center` div, but the div has no explicit dimensions — so the absolutely-positioned circles expand outside it without affecting layout, causing a visual misalignment.

### `src/components/landing/Hero.tsx` (line 61)
- Give the inner container a fixed size matching the glow circles: `w-14 h-14` so the absolute children align symmetrically within it.

Change:
```tsx
<div className="relative flex items-center justify-center">
```
To:
```tsx
<div className="relative flex items-center justify-center w-14 h-14">
```

This anchors the ping ring and chevron to the same explicit bounding box, centering everything visually.

