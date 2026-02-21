

## Add Scanning Loading Animation

### What Changes

When a user clicks "Scan Receipt" (for photos, PDFs, or documents), the current UI just shows a spinner with "Scanning..." text on the button. This plan replaces that with a polished, full-section loading animation that fills the scan area -- showing progressive status messages and an animated progress bar to give the feel of a real document scan.

### Changes to `src/components/QuickExpenseModal.tsx`

**1. Replace the simple button spinner with a full scanning overlay**

When `isParsingImage` is true, instead of showing the file preview + disabled "Scanning..." button, render an animated scanning state that fills the entire scan section area:

- A pulsing document icon (or the file preview dimmed with an overlay)
- An animated progress bar that simulates scan progress over time (e.g., 0% to 90% over ~8 seconds, then holds until complete)
- Rotating status messages that cycle every ~2 seconds:
  - "Reading document..."
  - "Extracting line items..."
  - "Identifying categories..."
  - "Matching vendors..."
  - "Finalizing..."

**2. Simulated progress with `useEffect` timer**

Add a progress state and a `useEffect` that runs when `isParsingImage` becomes true:
- Starts at 0, increments smoothly toward 90% using an interval
- Jumps to 100% when parsing completes (when `isParsingImage` flips to false)
- Status message index cycles based on progress thresholds

**3. Visual design**

The scanning animation will:
- Use the existing `Progress` component from `src/components/ui/progress.tsx`
- Show the file name below the animation so the user knows what's being scanned
- Use subtle `animate-pulse` on the icon and a gradient shimmer on the progress bar
- Match the existing primary color scheme (golden/amber tones from the screenshot)

### Technical Details

**New state variables:**
```typescript
const [scanProgress, setScanProgress] = useState(0);
const [scanMessage, setScanMessage] = useState('');
```

**Progress simulation effect:**
```typescript
useEffect(() => {
  if (!isParsingImage) { setScanProgress(0); return; }
  setScanProgress(5);
  const messages = [
    'Reading document...',
    'Extracting line items...',
    'Identifying categories...',
    'Matching vendors...',
    'Finalizing...',
  ];
  let progress = 5;
  const interval = setInterval(() => {
    progress += Math.random() * 8 + 2;
    if (progress > 90) progress = 90;
    setScanProgress(Math.round(progress));
    const msgIdx = Math.min(Math.floor(progress / 20), messages.length - 1);
    setScanMessage(messages[msgIdx]);
  }, 800);
  return () => clearInterval(interval);
}, [isParsingImage]);
```

**Scanning UI (replaces file preview area when scanning):**
```
[Scan Receipt section border]
  [Pulsing Sparkles icon]
  [Progress bar: 0% -> 90%]
  [Status: "Extracting line items..."]
  [File name: "The Home Depot.pdf"]
[/section]
```

When `isParsingImage` completes, the progress jumps to 100%, then the breakdown UI appears.

### Files Changed
- `src/components/QuickExpenseModal.tsx` -- add scanning animation states, progress effect, and animated UI
