

## Plan: Fix Tooltip Text Visibility in Spending Donut Chart

### Overview

The tooltip in the "Spending by Category" donut chart has unreadable text because the text color isn't being properly applied. The tooltip needs `itemStyle` and `labelStyle` properties to ensure the text is visible against the dark background.

---

### Current Issue

The tooltip has:
- Dark background: `backgroundColor: 'hsl(220, 18%, 13%)'`
- `color` in `contentStyle` which doesn't affect the actual tooltip text items
- Missing `itemStyle` and `labelStyle` properties that control the text colors

---

### Technical Implementation

**File: `src/components/dashboard/SpendingDonutChart.tsx`**

Update the Tooltip component (lines 101-109) to include proper text styling:

```tsx
// BEFORE:
<Tooltip
  formatter={(value: number) => formatCurrency(value)}
  contentStyle={{
    backgroundColor: 'hsl(220, 18%, 13%)',
    border: '1px solid hsl(220, 15%, 22%)',
    borderRadius: '8px',
    color: 'hsl(210, 20%, 95%)',
  }}
/>

// AFTER:
<Tooltip
  formatter={(value: number) => formatCurrency(value)}
  contentStyle={{
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
  }}
  itemStyle={{
    color: 'hsl(var(--foreground))',
  }}
  labelStyle={{
    color: 'hsl(var(--foreground))',
  }}
/>
```

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/dashboard/SpendingDonutChart.tsx` | Add `itemStyle` and `labelStyle` with proper text color, use CSS variables for theme consistency |

---

### Result

The tooltip text will be clearly visible with proper contrast against the dark background, using the app's theme-aware CSS variables for consistent styling across light/dark modes.

