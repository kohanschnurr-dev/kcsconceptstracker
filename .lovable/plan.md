

## Adjust Slider Ranges to Center Defaults

The current slider max values make the defaults look low. Reduce the max on each slider so the defaults sit near the midpoint.

### Change in `src/components/landing/CostCalculator.tsx`

| Slider | Current Range | New Range | Default (midpoint) |
|--------|--------------|-----------|-------------------|
| Hourly Rate | 20–150 | 20–75 | $45 |
| Hours/Week | 1–20 | 1–12 | 6 |
| Active Projects | 1–10 | 1–4 | 2 |

