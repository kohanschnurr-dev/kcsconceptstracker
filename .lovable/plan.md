

## Fix Loan Calculator Save Persistence

### Root Cause
In `handleSave` (line 268-271), the code sets `hasUserEdited.current = false` and then awaits `queryClient.invalidateQueries`. However, the invalidation triggers a re-render where the `useEffect` (line 184) runs with the **old** prop values (they haven't updated yet from the refetch), resetting the state back to stale values.

### Fix in `src/components/project/HardMoneyLoanCalculator.tsx`

1. **Keep `hasUserEdited` true until props actually reflect saved values**: Instead of resetting the flag immediately in `handleSave`, store the "last saved" values in a ref. Then in the reset `useEffect`, compare incoming initial props against the saved values — only clear the dirty flag and allow syncing once the props match what was saved.

2. **Simpler alternative (preferred)**: Don't reset `hasUserEdited` in `handleSave` at all. Instead, only reset it when the component receives new `initialLoanAmount` / `initialInterestRate` props that match the current local state (meaning the server round-trip completed successfully).

### Technical Detail

**Change 1 — `handleSave` (line 268-273):** Remove `hasUserEdited.current = false` from the success block. Instead, store the just-saved values in a ref:

```typescript
const lastSavedValues = useRef<{ loanAmount: number; interestRate: number } | null>(null);

// In handleSave success:
lastSavedValues.current = { loanAmount, interestRate };
await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
```

**Change 2 — Reset `useEffect` (lines 184-192):** After syncing state from props, check if the incoming values match `lastSavedValues`. If so, clear both `hasUserEdited` and `lastSavedValues`:

```typescript
useEffect(() => {
  if (hasUserEdited.current) {
    // Check if props now reflect our saved values
    if (lastSavedValues.current &&
        initialLoanAmount === lastSavedValues.current.loanAmount &&
        initialInterestRate === lastSavedValues.current.interestRate) {
      hasUserEdited.current = false;
      lastSavedValues.current = null;
    }
    return;
  }
  setLoanAmount(initialLoanAmount ?? (editablePurchasePrice * 0.75));
  setInterestRate(initialInterestRate);
  // ... rest of resets
}, [initialLoanAmount, initialInterestRate, ...]);
```

This ensures local state is never overwritten until the server-confirmed values arrive via props.

