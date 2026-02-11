

## Fix Janky Vendor Contact Card Close Animation

The "janky" close behavior comes from the default `DialogContent` animation using `zoom-out-95` combined with `slide-out` transforms, which creates a jarring effect when clicking off the card.

### Changes

**File: `src/pages/Vendors.tsx`**

Update the vendor contact card `DialogContent` to use a smoother, simpler close animation by overriding the default classes:

- Remove the zoom and slide animations on close
- Use a clean fade-out only for the content, paired with the existing overlay fade
- Add `duration-150` for a snappier, less janky feel

The specific change is adding custom animation classes to the `DialogContent` for the vendor contact card:

```tsx
<DialogContent className="sm:max-w-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-100 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[50%] duration-150">
```

This replaces the default `zoom-out-95` (which causes the shrink effect) with `zoom-out-100` (no shrink) so the dialog simply fades out smoothly instead of shrinking and sliding awkwardly.

No other files are affected.

