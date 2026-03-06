

## Plan: Default to Annual billing

**File**: `src/pages/Pricing.tsx`

Change the initial state of `annual` from `false` to `true` so the toggle defaults to annual billing selected.

```tsx
const [annual, setAnnual] = useState(true);
```

One-line change.

