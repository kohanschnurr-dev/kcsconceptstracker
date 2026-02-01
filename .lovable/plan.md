

## Plan: Fix SmartSplit Amount Calculation Bug

### Problem Identified

SmartSplit is creating expense records with amounts based on the **receipt's line item totals** instead of proportionally distributing the **QuickBooks transaction amount**.

**Example from the data:**
- Original QB transaction: `purchase_801` = **$111.48** (the real bank charge)
- Receipt parsed with line items totaling: $201.31 (subtotal) + $20.04 (tax) = $221.35
- SmartSplit created:
  - Carpentry: $111.48 (from receipt line items)
  - Drywall: $15.04
  - Painting: $69.44
  - Hardware: $25.39
  - **Total: $221.35** ← Exceeds the actual QB transaction!

### Root Cause

In `SmartSplitReceiptUpload.tsx` lines 570-573:
```typescript
const proportion = subtotal > 0 ? group.total / subtotal : 0;
const categoryTax = Math.round(taxAmount * proportion * 100) / 100;
const categoryAmount = Math.round((group.total + categoryTax) * 100) / 100;
```

The code uses `group.total` (receipt line item total) instead of scaling to the QB transaction amount.

### Solution

Scale each category's amount proportionally to the QB transaction amount:

```typescript
// Get the actual QB transaction amount
const qbTransactionAmount = selectedMatch.qbExpense.amount;

// For each category, calculate its proportion and scale to QB amount
const proportion = subtotal > 0 ? group.total / subtotal : 0;
const categoryAmount = Math.round(qbTransactionAmount * proportion * 100) / 100;
```

### Technical Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

| Location | Change |
|----------|--------|
| ~Line 559 | Add `const qbTransactionAmount = selectedMatch.qbExpense.amount;` |
| Lines 570-573 | Calculate proportional amounts based on QB transaction amount, not receipt totals |

**Before:**
```typescript
const proportion = subtotal > 0 ? group.total / subtotal : 0;
const categoryTax = Math.round(taxAmount * proportion * 100) / 100;
const categoryAmount = Math.round((group.total + categoryTax) * 100) / 100;
```

**After:**
```typescript
// Calculate proportion of this category relative to receipt subtotal
const proportion = subtotal > 0 ? group.total / subtotal : 0;
// Scale to actual QB transaction amount (which includes tax already)
const categoryAmount = Math.round(qbTransactionAmount * proportion * 100) / 100;
```

### Data Fix Required

The existing incorrectly-split records need to be corrected. For `purchase_801`:
- Current total: $221.35 (sum of all 4 records)
- Should be: $111.48 (the actual QB transaction)
- Each split amount should be scaled down by ratio: $111.48 / $221.35 = 0.5035

**Corrected amounts:**
| Category | Current | Corrected (proportional to $111.48) |
|----------|---------|-------------------------------------|
| Carpentry | $111.48 | $56.11 (50.35% of $111.48) |
| Drywall | $15.04 | $7.57 |
| Painting | $69.44 | $34.95 |
| Hardware | $25.39 | $12.78 |
| **Total** | $221.35 | **$111.41** (rounding) |

### Summary

1. Fix the SmartSplit calculation to use QB transaction amount
2. Update the validation warning to catch mismatches between receipt total and QB total
3. Consider adding a database migration or manual fix for existing incorrect data

