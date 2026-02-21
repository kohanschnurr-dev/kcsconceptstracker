

## Keep Formula Open Until Enter is Pressed

### Problem

When typing a formula (e.g. `=50000-12000`), clicking away from the input (blur) immediately evaluates and clears the formula. If you need to check another website for a number, you lose your work-in-progress formula.

### Solution

Remove the `resolveFormula()` call from the `handleBlur` handler. The formula will only evaluate when the user explicitly presses **Enter**. The formula text stays visible in the input even after switching tabs or clicking elsewhere.

### Changes

**`src/components/ui/formula-input.tsx`** (line 65-71)

Update `handleBlur` to simply pass through to the parent `onBlur` without resolving the formula:

```tsx
const handleBlur = useCallback(
  (e: React.FocusEvent<HTMLInputElement>) => {
    // Don't resolve formula on blur -- keep it open until Enter
    onBlur?.(e);
  },
  [onBlur],
);
```

Also add **Escape** key support in `handleKeyDown` to let users cancel a formula without evaluating:

```tsx
if (e.key === 'Escape' && isFormulaMode) {
  e.preventDefault();
  setIsFormulaMode(false);
  setLocalValue('');
  return;
}
```

### Files Changed
- `src/components/ui/formula-input.tsx` -- remove blur-to-resolve, add Escape to cancel
