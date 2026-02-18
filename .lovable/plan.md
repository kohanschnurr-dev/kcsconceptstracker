
## Fix: "Open Budget Calculator" Navigation

### Problem
The button navigates to `/budget-calculator` which doesn't exist (causes a 404). The correct route defined in `App.tsx` is `/calculator`.

### Fix
**File: `src/pages/ProjectBudget.tsx`**, line 1032:

Change:
```tsx
onClick={() => navigate('/budget-calculator')}
```
To:
```tsx
onClick={() => navigate('/calculator')}
```

That's the only change needed.
