

## Plan: Scroll to top on Pricing page load

**File**: `src/pages/Pricing.tsx`

Add a `useEffect` that scrolls to the top of the page when the component mounts:

```tsx
useEffect(() => {
  window.scrollTo(0, 0);
}, []);
```

This ensures that navigating to `/pricing` from any scroll position on another page always starts at the top. Simple one-line addition inside the existing component.

