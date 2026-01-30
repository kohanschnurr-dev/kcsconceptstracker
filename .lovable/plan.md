

## Fix: Matched Receipts Not Disappearing After Delete

### Problem Identified
When you delete a matched receipt, the database delete succeeds (HTTP 204) but the receipt stays visible in the UI because of a state management bug.

---

### Root Cause

In `fetchPendingReceipts()`, the logic only updates `matchedReceipts` state under specific conditions:

```text
Current Logic (Buggy):
┌─────────────────────────────────────────────────┐
│ Fetch receipts                                  │
├─────────────────────────────────────────────────┤
│ IF receipts exist:                              │
│   ├── Set pendingReceipts                       │
│   └── IF matched receipts found:                │
│         └── Set matchedReceipts ← ONLY HERE     │
│                                                 │
│ ELSE (no receipts at all):                      │
│   ├── Set pendingReceipts = []                  │
│   └── Set matchedReceipts = []                  │
└─────────────────────────────────────────────────┘

Problem: If pending receipts exist BUT matched receipts = 0,
         matchedReceipts state is NEVER cleared!
```

---

### Solution

Add an `else` branch to clear `matchedReceipts` when no matched receipts exist:

| Line | Current Code | Fixed Code |
|------|--------------|------------|
| 178-179 | `setMatchedReceipts(matches);` followed by nothing | Add `} else { setMatchedReceipts([]); }` |

---

### Implementation

**File:** `src/components/SmartSplitReceiptUpload.tsx`

**Change location:** Lines 159-183

Add else clause to clear matched receipts state:

```typescript
// Check for matched receipts and fetch QB expenses
const matchedReceiptsData = receiptsWithItems.filter(r => r.status === 'matched' && r.matched_qb_id);
if (matchedReceiptsData.length > 0) {
  // ... existing fetch and set logic ...
  setMatchedReceipts(matches);
} else {
  // ADDED: Clear matched receipts when none exist
  setMatchedReceipts([]);
}
```

---

### Result

- Deleting a matched receipt will immediately remove it from the "Matches Ready for Import" section
- No stale UI state after deletions
- Same delete logic works for both pending and matched receipts

