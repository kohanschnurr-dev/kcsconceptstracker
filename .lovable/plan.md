

## Plan: Fix stats row formatting and animation timing

### Changes to `src/components/landing/StatsRow.tsx`:

1. **Add comma formatting** — Format 10000 as "10,000" using `toLocaleString()`
2. **Stagger animations** — Each stat starts its count-up with an increasing delay (e.g., 0ms, 200ms, 400ms, 600ms) so they cascade rather than all landing simultaneously
3. **Update stat #3** — Change from `{ value: 3, suffix: " min", label: "To Set Up" }` to `{ value: 5, suffix: " min", label: "To Start Tracking Today!" }`

### Implementation details
- Add `delay` based on `index * 200` before starting the `requestAnimationFrame` loop
- Use `value.toLocaleString()` in the render to add commas to large numbers
- Keep existing IntersectionObserver + easeOutQuart animation

