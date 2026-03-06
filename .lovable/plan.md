

## Plan: Add distinct background to CostCalculator section

**File**: `src/components/landing/CostCalculator.tsx`

**Change**: Add a subtle distinct background to the outer `<section>` element to visually separate it from adjacent sections. Will use a slightly lighter/different tone — something like `bg-muted/30` or `bg-card/50` with a top/bottom border to create visual distinction while staying on-brand with the dark theme.

Specifically, update the section element from:
```tsx
<section className="py-20 sm:py-28">
```
to:
```tsx
<section className="py-20 sm:py-28 bg-muted/20 border-y border-border/40">
```

This adds a subtle tinted background and thin horizontal borders to distinguish it from the pure black sections above and below.

