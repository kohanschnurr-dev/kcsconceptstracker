
## Fix Target Input — Allow Full Deletion While Typing

### Root Cause

In `ContractorMarginGauge.tsx`, line 153:
```tsx
onChange={(e) => setTempTarget(parseFloat(e.target.value) || marginTarget)}
```

When the user clears the field, `parseFloat('')` returns `NaN`. The `|| marginTarget` fallback immediately resets it back to `20`, making it impossible to delete the value and type a fresh number.

### Fix

Change `tempTarget` from `number` to `string` so the raw input value (including empty string) is preserved while typing. Only parse to a number at commit time (on blur or ✓ click).

**Before:**
```tsx
const [tempTarget, setTempTarget] = useState(marginTarget); // number
// ...
onChange={(e) => setTempTarget(parseFloat(e.target.value) || marginTarget)}
onBlur={() => { onMarginTargetChange(tempTarget); setIsEditingTarget(false); }}
onClick={() => { onMarginTargetChange(tempTarget); setIsEditingTarget(false); }}
```

**After:**
```tsx
const [tempTarget, setTempTarget] = useState(String(marginTarget)); // string

// On open:
onClick={() => { setTempTarget(String(marginTarget)); setIsEditingTarget(true); }}

// On change — just store the raw string:
onChange={(e) => setTempTarget(e.target.value)}

// On commit — parse then clamp, fall back to current marginTarget if invalid:
onBlur={() => {
  const parsed = parseFloat(tempTarget);
  const valid = !isNaN(parsed) ? Math.min(99, Math.max(1, parsed)) : marginTarget;
  onMarginTargetChange(valid);
  setIsEditingTarget(false);
}}
```

The input's `value` prop stays as the raw string, so typing "3", "30", or clearing fully works without interference.

### Files to Modify

| File | Change |
|---|---|
| `src/components/budget/ContractorMarginGauge.tsx` | Change `tempTarget` to `string` state. Update `onChange` to store raw string. Parse only on blur/confirm with clamp + fallback. |

One file, four-line change. No props, no logic elsewhere.
