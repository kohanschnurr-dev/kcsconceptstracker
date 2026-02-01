

## Plan: Fix Matching Issues & Add Manual Transaction Selection

### Problem 1: Matching Failed Despite Same Amount

The receipt and transaction both show $111.48 but didn't match. Looking at the `match-receipts` edge function, matching requires:

1. **Exact amount match** (within $0.01) 
2. **Date within range** (receipt date -2 to +5 days of transaction date)
3. **Vendor similarity > 0.3** (fuzzy name matching)

Possible failure reasons:
- Receipt date vs transaction date might be outside the 2-day before / 5-day after window
- Vendor name extraction from the parsed receipt might differ significantly

**Solution**: Add debug logging in the match modal showing WHY a match failed, so you can see which criterion wasn't met.

---

### Problem 2: Manual Transaction Selection (New Feature)

Add a dropdown in the "Awaiting Bank Transaction" section that lets you manually select a QuickBooks transaction for any pending receipt. The workflow:

1. For each pending receipt (In-Store Purchase, Amazon, Pro in your screenshot), add a "Link Transaction" button
2. When clicked, shows a dropdown of all pending QuickBooks transactions (like the Home Depot $111.48 below)
3. Selecting one creates a manual match, opening the split import modal
4. Debug info displayed showing why auto-match failed

---

### Technical Implementation

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. **Add state for manual transaction selection**
   - `availableQbExpenses`: List of pending QuickBooks transactions
   - `manualLinkingReceiptId`: Track which receipt is being manually linked

2. **Fetch pending QB transactions** (already available from QuickBooks integration)
   - Pass `pendingExpenses` from `useQuickBooks` hook as a prop
   - OR fetch directly from `quickbooks_expenses` table where `is_imported = false`

3. **Add "Link Transaction" dropdown to each pending receipt card**
   ```text
   ┌─────────────────────────────────────────────────────────┐
   │ 📷 In-Store Purchase                                   │
   │ $111.48 • Jan 28, 2026 • 11 items parsed               │
   │ [Link Transaction ▾]                          🗑️       │
   └─────────────────────────────────────────────────────────┘
   
   Dropdown shows:
   ┌─────────────────────────────────────────────────────┐
   │ Home Depot - $111.48 - Jan 28, 2026               │
   │ PayPal CentralMech - $374.50 - Jan 27, 2026       │
   │ ...                                                │
   └─────────────────────────────────────────────────────┘
   ```

4. **Manual match function**
   - When a QB transaction is selected, create a `MatchedExpense` object manually
   - Call `acceptMatch()` to open the split import modal
   - Include debug info showing the match was manual

5. **Debug information display**
   - In the match modal header, show match source: "Auto (92% confidence)" or "Manual link"
   - Optionally show why auto-match failed for manual links

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add manual transaction linking UI and logic |

---

### UI Changes Summary

1. Each pending receipt card gets a "Link Transaction" dropdown
2. Dropdown shows all pending QB transactions with vendor, amount, date
3. Selecting a transaction manually creates the match and opens the import modal
4. Match modal shows whether match was automatic or manual (for debugging)

---

### Data Flow

```text
Pending Receipt (waiting)
    │
    ├── [Auto] Find Matches → Match found? → Open Import Modal
    │
    └── [Manual] Link Transaction dropdown
                    │
                    └── Select QB Transaction → Open Import Modal
                                                  │
                                                  └── Assign project & Import
```

