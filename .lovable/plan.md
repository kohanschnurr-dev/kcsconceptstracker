

## Plan: Update StatsRow metrics

### Change in `src/components/landing/StatsRow.tsx`

Replace the first two stats:

| Current | New |
|---------|-----|
| `12+` Modules in One Platform | `1000+` Projects Tracked |
| `30%` Average Budget Savings | `5` min to start → keep as-is, but swap positions |

Actually, since the user wants "1,000+ Projects Tracked" as one stat, I'll replace "12+ Modules" with that, and replace "30% Average Budget Savings" with a strong second stat like **"$2M+ Budgets Managed"** or keep the 30% but reframe it. Given the user said to change both, I'll use:

1. **1,000+** → "Projects Tracked"
2. **$2M+** → "In Budgets Managed"
3. Keep "5 min" and "$0" as-is

### Specific edit in `stats` array (lines 3-8):

```tsx
const stats = [
  { value: 1000, prefix: "", suffix: "+", label: "Projects Tracked" },
  { value: 2, prefix: "$", suffix: "M+", label: "In Budgets Managed" },
  { value: 5, prefix: "", suffix: " min", label: "To Start Tracking Today!" },
  { value: 0, prefix: "$", suffix: "", label: "To Get Started" },
];
```

This gives a trust/scale feel with "1,000+ Projects Tracked" and a financial credibility signal with "$2M+ In Budgets Managed."

