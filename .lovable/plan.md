
## Clean Up ContractorMarginGauge — Remove Inline Target, Match Header Style, Edit via Progress Bar

### What changes

**Three precise changes to `src/components/budget/ContractorMarginGauge.tsx`:**

---

#### 1. Remove the target sub-row from Gross Margin block

Delete the `● Target [input] %` row entirely from under the `80.0%` number. The Gross Margin block becomes clean — just the label + the number, exactly like the other three stat blocks.

```
Before:                          After:
GROSS MARGIN                     GROSS MARGIN
80.0%                            80.0%
● Target [20] %     ←remove
```

Also bump the font size from `text-2xl` → `text-lg` to match Contract Value, Job Cost, and Gross Profit (all use `text-lg font-bold font-mono`).

---

#### 2. Make the progress bar target label inline-editable

The center label below the bar currently reads `20% target` (static text). Change this to an **editable inline field** triggered by a pencil emoji:

**Normal state** (not editing):
```
20% target ✏️
```

**Editing state** (click ✏️):
```
[  20  ] % target ✓
```

Implementation:
- Add `isEditingTarget` local state (`useState(false)`)
- Add `tempTarget` local state to hold the in-progress value
- When not editing: render `{marginTarget}% target` + a `✏️` button that sets `isEditingTarget(true)`
- When editing: render a small `<input>` (pre-filled with `marginTarget`) + `✓` button that calls `onMarginTargetChange(tempTarget)` and sets `isEditingTarget(false)`
- On blur of the input, also commit + close

```tsx
{isEditingTarget ? (
  <>
    <input
      autoFocus
      type="number"
      value={tempTarget}
      onChange={(e) => setTempTarget(parseFloat(e.target.value) || marginTarget)}
      onBlur={() => { onMarginTargetChange(tempTarget); setIsEditingTarget(false); }}
      className="w-10 h-4 text-xs font-mono text-center rounded border border-input bg-background px-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
      min={1} max={99}
    />
    <span>% target</span>
    <button onClick={() => { onMarginTargetChange(tempTarget); setIsEditingTarget(false); }}>✓</button>
  </>
) : (
  <>
    <span className={marginColor}>{marginTarget}% target</span>
    <button onClick={() => { setTempTarget(marginTarget); setIsEditingTarget(true); }}>✏️</button>
  </>
)}
```

---

#### 3. Add React `useState` import

The component currently has no imports from React. Add:
```tsx
import { useState } from 'react';
```

---

### Files to Modify

| File | Change |
|---|---|
| `src/components/budget/ContractorMarginGauge.tsx` | Remove target sub-row. Match `text-lg` font size. Make bar center label editable via ✏️ pencil. Add `useState`. |

No prop changes. No other files touched.
