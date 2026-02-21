
## Fix: Formula Input Not Accepting "=" in Number Fields

### Root Cause

When `<input type="number">` is rendered, the browser natively blocks non-numeric characters like `=` at the DOM level. The `onChange` event never fires, so `isFormulaMode` never activates, and the input never switches to `type="text"`.

### Solution

Intercept the `=` key in `onKeyDown` and proactively switch to formula mode before the browser blocks the character.

### Changes

**`src/components/ui/formula-input.tsx`**

Update `handleKeyDown` to detect when the user presses `=` while in a numeric (non-formula) input:

```tsx
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Intercept "=" on a number input to enter formula mode
    if (e.key === '=' && isNumeric && !isFormulaMode) {
      e.preventDefault();
      setIsFormulaMode(true);
      setLocalValue('=');
      return;
    }
    if (e.key === 'Enter' && isFormulaMode) {
      e.preventDefault();
      resolveFormula();
      return;
    }
    onKeyDown?.(e);
  },
  [isNumeric, isFormulaMode, resolveFormula, onKeyDown],
);
```

This is a single change in one file -- no other files affected.

### Files Changed
- `src/components/ui/formula-input.tsx` -- add `=` key interception in `handleKeyDown`
