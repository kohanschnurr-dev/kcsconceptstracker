

## Fix Pricing Toggle Button

The toggle knob's positioning is off — it overlaps the "Annual" text when toggled right because `translate-x-7` pushes it too far, and the toggle track may be too narrow.

### Change in `src/pages/Pricing.tsx` (lines 101-113)

- Increase toggle width from `w-14` to `w-12` (or keep `w-14` but fix the knob offset)
- Fix `translate-x-7` to `translate-x-[1.625rem]` so the knob stays within bounds
- Add `left-0` to anchor the knob properly

```tsx
<button
  onClick={() => setAnnual(!annual)}
  className={`relative w-14 h-7 rounded-full transition-colors ${
    annual ? "bg-primary" : "bg-secondary"
  }`}
  aria-label="Toggle annual billing"
>
  <span
    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
      annual ? "translate-x-7" : "translate-x-0"
    }`}
  />
</button>
```

Key fixes:
- Change `top-0.5` + positional to use `left-0.5` as base anchor
- Change inactive state from `translate-x-0.5` to `translate-x-0` (the `left-0.5` handles the offset)
- Add `shadow` for better visibility of knob

