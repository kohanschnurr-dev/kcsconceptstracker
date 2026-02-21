
## Replace Scanning Progress Bar with Indeterminate Loading Animation

### Problem

The fake progress bar races through percentages that don't correspond to actual work, making the UI feel dishonest. Since we have no way to know how long the AI parsing will take, a determinate progress bar is the wrong pattern.

### Changes to `src/components/QuickExpenseModal.tsx`

**1. Remove `scanProgress` state and the progress simulation `useEffect` (lines 95, 107-137)**

Delete the `scanProgress` state variable and the entire `useEffect` that simulates progress increments. Keep only `scanMessage` for cycling status text.

**2. Replace the `useEffect` with a simple message cycler**

Instead of faking progress, cycle through the status messages on a timer while `isParsingImage` is true:

```typescript
useEffect(() => {
  if (!isParsingImage) {
    setScanMessage('');
    return;
  }
  const messages = [
    'Reading document...',
    'Extracting line items...',
    'Identifying categories...',
    'Matching vendors...',
    'Finalizing...',
  ];
  let idx = 0;
  setScanMessage(messages[0]);
  const interval = setInterval(() => {
    idx = (idx + 1) % messages.length;
    setScanMessage(messages[idx]);
  }, 3000);
  return () => clearInterval(interval);
}, [isParsingImage]);
```

**3. Replace the `<Progress>` bar with an indeterminate animated bar (lines 447-452)**

Swap the `<Progress value={scanProgress} ...>` component and the percentage text for a simple indeterminate bar using a CSS animation -- a small bar that slides back and forth continuously:

```tsx
<div className="w-full space-y-2">
  <div className="h-2.5 bg-muted rounded-full overflow-hidden relative">
    <div className="absolute h-full w-1/3 bg-gradient-to-r from-primary to-accent rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" />
  </div>
  <span className="text-primary font-medium text-xs transition-all duration-300">{scanMessage}</span>
</div>
```

**4. Add the `indeterminate` keyframe to `tailwind.config.ts`**

Add a keyframe that slides the bar from left to right and back:

```typescript
"indeterminate": {
  "0%": { transform: "translateX(-100%)" },
  "50%": { transform: "translateX(200%)" },
  "100%": { transform: "translateX(-100%)" },
}
```

**5. Update the rendering condition (line 441)**

Change `isParsingImage || scanProgress === 100` to just `isParsingImage`, since there's no longer a completion state to show.

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- remove progress state/effect, add message cycler, replace Progress bar with indeterminate animation
- `tailwind.config.ts` -- add `indeterminate` keyframe
