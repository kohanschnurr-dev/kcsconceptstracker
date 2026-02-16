

## Disable Scroll-Wheel on Number Inputs

### Problem
When scrolling through the Deal Parameters sidebar, the mouse wheel changes values in number input fields (e.g., Monthly Rent, Vacancy Rate). This is a common browser behavior for `type="number"` inputs that causes accidental data changes.

### Solution
Add an `onWheel` handler to the shared `Input` component that prevents scroll-wheel interaction when the input is a number type. This fixes the issue globally across the entire app -- every number input in the sidebar and elsewhere will be protected.

### Technical Details

**File: `src/components/ui/input.tsx`**
- Add `onWheel` handler that calls `e.currentTarget.blur()` when `type === "number"`, preventing the scroll from changing the value
- This is a single-line addition inside the `<input>` element

```tsx
onWheel={(e) => {
  if (type === "number") e.currentTarget.blur();
}}
```

One file, one small change. All number inputs across the app benefit immediately.
