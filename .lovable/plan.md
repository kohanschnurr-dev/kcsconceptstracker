

## Plan: Auto-Match Receipts to QuickBooks Transactions

### Overview
Add automatic receipt-to-transaction matching that runs:
1. When the SmartSplitReceiptUpload component loads (on mount)
2. After a new receipt is uploaded and parsed
3. After QB expenses are synced

This eliminates the need to manually click "Find Matches" while still keeping the button as a fallback.

---

### Current Flow vs. Proposed Flow

| Scenario | Current | Proposed |
|----------|---------|----------|
| Component loads | User must click "Find Matches" | Auto-runs matching silently |
| After receipt upload | User must click "Find Matches" | Auto-runs matching after upload |
| After QB sync | User must click "Find Matches" | Auto-runs matching after sync |

---

### Changes

#### 1. SmartSplitReceiptUpload Component

**File: `src/components/SmartSplitReceiptUpload.tsx`**

**a) Add silent auto-match function**

Create a new `runAutoMatching` function that:
- Runs the same matching logic as `runMatching`
- Does NOT show toast for "no matches found" (silent when nothing to match)
- Only shows toast when matches ARE found
- Doesn't set loading state to avoid UI flickering

```tsx
// Silent auto-match - only shows toast on success
const runAutoMatching = async () => {
  if (isMatching) return; // Prevent concurrent runs
  
  try {
    const { data, error } = await supabase.functions.invoke('match-receipts');
    
    if (error) {
      console.log('Auto-match error:', error);
      return;
    }
    
    if (data.matches && data.matches.length > 0) {
      toast({
        title: 'Matches found!',
        description: `Auto-matched ${data.matches.length} receipt(s) to bank transactions`,
      });
      await fetchPendingReceipts();
    }
  } catch (error) {
    console.log('Auto-match failed silently:', error);
  }
};
```

**b) Trigger auto-match on component mount**

Add a useEffect that runs once when the component mounts and there are pending receipts:

```tsx
// Auto-match on mount when there are pending receipts
useEffect(() => {
  const pendingToMatch = pendingReceipts.filter(r => r.status === 'pending');
  if (pendingToMatch.length > 0 && pendingQBExpenses.length > 0) {
    runAutoMatching();
  }
}, [pendingReceipts.length, pendingQBExpenses.length]);
```

**c) Trigger auto-match after receipt upload**

In the `handleFileUpload` function, after `await fetchPendingReceipts()`:

```tsx
// After successful upload
await fetchPendingReceipts();
onReceiptProcessed?.();

// Auto-match the newly uploaded receipt
if (pendingQBExpenses.length > 0) {
  setTimeout(() => runAutoMatching(), 500); // Small delay to ensure data is fresh
}
```

---

### Matching Trigger Points

```text
┌──────────────────────┐
│  Component Mounts    │──→ Check if pending receipts + QB expenses exist
└──────────────────────┘    If yes → runAutoMatching()
            │
            ▼
┌──────────────────────┐
│  Receipt Uploaded    │──→ After parse complete
└──────────────────────┘    If QB expenses exist → runAutoMatching()
            │
            ▼
┌──────────────────────┐
│  "Find Matches" Btn  │──→ Manual trigger (kept as fallback)
└──────────────────────┘
```

---

### Behavior Summary

| Condition | Action |
|-----------|--------|
| No pending receipts | Do nothing (silent) |
| No QB expenses | Do nothing (silent) |
| Receipts + QB exist, no matches | Do nothing (silent) |
| Receipts + QB exist, matches found | Show toast + update UI |
| Manual button click | Always show result (even "no matches") |

---

### Technical Details

**Files to modify:**
- `src/components/SmartSplitReceiptUpload.tsx`

**New function:**
- `runAutoMatching()` - Silent version of matching

**Modified areas:**
- Add useEffect for mount-time matching
- Modify `handleFileUpload` to trigger auto-match after upload
- Keep existing `runMatching()` for manual "Find Matches" button

**No backend changes needed** - The existing `match-receipts` edge function handles the matching logic.

