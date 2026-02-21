

## Slow Down Scanning Progress Animation

### Problem

The progress bar races to 90% in about 8 seconds (incrementing 10-18% every 800ms), then sits frozen at 90% for the remainder of the actual AI parsing -- which can take 15-30+ seconds for PDFs. This makes the animation feel broken.

### Fix

Replace the linear-ish increment with a **decelerating curve** that spreads the 0-90% range across ~25-30 seconds. The trick: as progress increases, the increment size shrinks dramatically, so early progress feels fast (good feedback) but later progress crawls to match the real backend time.

### Changes to `src/components/QuickExpenseModal.tsx`

**Replace the interval logic (lines 127-134) with a decelerating curve:**

```typescript
let progress = 5;
const interval = setInterval(() => {
  // Decelerate: big jumps early, tiny increments as we approach 90%
  const remaining = 90 - progress;
  const increment = Math.max(0.5, remaining * 0.06 + Math.random() * 0.8);
  progress = Math.min(progress + increment, 90);
  setScanProgress(Math.round(progress));
  const msgIdx = Math.min(Math.floor(progress / 20), messages.length - 1);
  setScanMessage(messages[msgIdx]);
}, 600);
```

This gives roughly:
- 0-50% in first ~6 seconds (feels responsive)
- 50-75% over next ~10 seconds
- 75-90% over next ~15+ seconds (crawls to match backend)

The interval fires every 600ms for smoother visual updates, and each tick adds a fraction of the remaining distance (6% of what's left + a tiny random), so it naturally decelerates without ever truly stalling.

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- replace progress increment formula with decelerating curve

