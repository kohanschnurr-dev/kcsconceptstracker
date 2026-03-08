

## Plan: Remove "Tracking change orders" and reorder pain points

### Changes in `src/pages/GetStarted.tsx`

**PAIN_POINTS array (lines 18-27)** — Remove "Tracking change orders & scope creep" and move "Managing subs and schedules" to the bottom:

```typescript
const PAIN_POINTS = [
  "Tracking budgets & expenses",
  "Coordinating multiple rehabs at once",
  "Scattered docs and photos",
  "Estimating rehab costs accurately",
  "Staying on timeline",
  "Knowing my true project profit",
  "Managing subs and schedules",
];
```

**PAIN_FEATURE_MAP (line 54)** — Remove the "Tracking change orders & scope creep" entry.

