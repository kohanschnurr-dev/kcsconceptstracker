

## Simplify Receipt Matching: Amount + Date Only

### Current Problem

The current matching algorithm requires **all three criteria**:
1. Exact amount match (within $0.01)
2. Date within range (-2 to +5 days)
3. Vendor similarity > 30%

This is too strict. The Home Depot receipt ($111.48) didn't match because the vendor name extracted from the receipt likely differs from what QuickBooks shows.

---

### New Matching Logic

**Primary Match: Amount + Date = Enough**

If the amount matches exactly AND the date is within range, that's a match. Vendor name becomes a "bonus" for confidence scoring, not a blocker.

```text
BEFORE:
  Amount match? → Date in range? → Vendor > 30%? → Match ✓
                                           ↓
                                      No match ✗

AFTER:
  Amount match? → Date in range? → Match ✓ (vendor adds to confidence)
```

---

### Technical Changes

**File: `supabase/functions/match-receipts/index.ts`**

**1. Remove Vendor Blocking Logic (lines 178-181)**

```typescript
// BEFORE: Vendor mismatch blocks the match
if (vendorScore < 0.3) {
  continue;  // ← REMOVE THIS
}

// AFTER: Vendor score only affects confidence, doesn't block
```

**2. Adjust Confidence Calculation**

```typescript
// BEFORE: Amount=50%, Date=20%, Vendor=30%
const confidence = 0.5 + 0.2 + (vendorScore * 0.3);

// AFTER: Amount=60%, Date=30%, Vendor=10% (bonus)
const confidence = 0.6 + 0.3 + (vendorScore * 0.1);
// Minimum confidence with 0% vendor match = 90%
// With vendor match = up to 100%
```

**3. Lower Minimum Confidence Threshold**

```typescript
// BEFORE: Required 70% confidence
if (bestMatch && bestConfidence >= 0.7) {

// AFTER: Required 85% (since amount+date now gives 90% base)
if (bestMatch && bestConfidence >= 0.85) {
```

**4. Add Debug Logging**

```typescript
console.log(`Receipt ${receipt.id}: amount=${receiptAmount}, date=${receipt.purchase_date}, vendor="${receipt.vendor_name}"`);
console.log(`  vs QB ${qbExpense.qb_id}: amount=${qbAmount}, date=${qbExpense.date}, vendor="${qbExpense.vendor_name}"`);
console.log(`  → Amount diff: ${Math.abs(receiptAmount - qbAmount)}, Date in range: ${dateMatch}, Vendor score: ${vendorScore}`);
```

---

### Updated Matching Summary

| Criteria | Weight | Required? |
|----------|--------|-----------|
| Exact amount (±$0.01) | 60% | **Yes** |
| Date in range (-2/+5 days) | 30% | **Yes** |
| Vendor name similarity | 10% | No (bonus) |

**Result**: Amount + Date match = 90% confidence = Auto-match ✓

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/match-receipts/index.ts` | Remove vendor blocking, adjust confidence weights |

---

### Summary

The fix removes the vendor name requirement from the matching algorithm. Since exact amount + date within range is already very reliable (unlikely to have two transactions for $111.48 within the same week), we don't need vendor matching to block. Vendor name becomes a bonus for confidence scoring instead.

