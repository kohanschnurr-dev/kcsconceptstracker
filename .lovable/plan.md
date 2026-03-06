

## Plan: Fix stats count-up animation

### Root cause
`hasAnimated` is in the `useEffect` dependency array. When the IntersectionObserver fires and calls `setHasAnimated(true)`, React re-renders, runs the cleanup function (`clearTimeout(timeoutId)`), and kills the animation before it begins.

### Fix in `src/components/landing/StatsRow.tsx`
- Replace `hasAnimated` state with a `useRef(false)` so setting it doesn't trigger a re-render or effect cleanup
- Remove `hasAnimated` from the dependency array
- Keep everything else the same (staggered delay, toLocaleString, easeOutQuart)

