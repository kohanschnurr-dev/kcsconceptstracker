
## Fix: Receipt Parser to Handle Discounts

### The Problem
The Home Depot receipt has a **Discount** column that the AI parser ignores:

| Column | Example Value | What AI Extracts | What We Need |
|--------|---------------|------------------|--------------|
| Unit Price | $6.78 | $6.78 | - |
| Discount | $5.29 | (ignored) | - |
| Net Unit Price | $1.49 | (ignored) | $1.49 |
| Pre Tax Amount | $1.49 | (ignored) | $1.49 |

**Result**: Split total shows $127.10 instead of the correct $102.98 subtotal (difference = $15.62 discount)

---

### Solution Overview

Update the receipt parsing AI prompt to:
1. Detect receipts with discount columns (Home Depot, Lowe's, etc.)
2. Use **Net Unit Price** or **Pre Tax Amount** instead of Unit Price
3. Extract the total discount as a separate field
4. Add validation: line items should sum to subtotal (after discounts)

---

### Technical Changes

**File: `supabase/functions/parse-receipt-image/index.ts`**

**1. Update ReceiptData Interface**

Add a discount field to track total discounts:

```typescript
interface ReceiptData {
  vendor_name: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  discount_amount: number;  // NEW: Total discount applied
  purchase_date: string;
  line_items: {
    item_name: string;
    quantity: number;
    unit_price: number;      // Should be NET price (after discount)
    total_price: number;     // Should be NET total
    discount: number;        // NEW: Discount per line item
    suggested_category: string;
  }[];
}
```

**2. Update AI System Prompt**

Add specific instructions for discount handling:

```text
═══════════════════════════════════════════════════════
DISCOUNT HANDLING (HOME DEPOT, LOWE'S, ETC.)
═══════════════════════════════════════════════════════

Many receipts have DISCOUNT columns. ALWAYS use the AFTER-DISCOUNT price!

HOME DEPOT RECEIPT COLUMNS:
| Item | Qty | Unit Price | Discount | Net Unit Price | Pre Tax Amount |
|------|-----|------------|----------|----------------|----------------|
| Board| 1   | $6.78      | $5.29    | $1.49          | $1.49          |

EXTRACTION RULE:
- unit_price = "Net Unit Price" column (NOT "Unit Price")
- total_price = "Pre Tax Amount" column
- discount = value from "Discount" column (per item)

If receipt shows:
  Subtotal: $102.98
  Discount: -$15.62
  Tax: $8.50
  Total: $111.48

Then:
- subtotal = 102.98 (the discounted subtotal)
- discount_amount = 15.62
- tax_amount = 8.50
- total_amount = 111.48
- Sum of line item total_price values MUST equal 102.98

VALIDATION: 
subtotal + tax_amount = total_amount (discount already subtracted)
```

**3. Update User Prompt JSON Schema**

```json
{
  "vendor_name": "THE HOME DEPOT",
  "total_amount": 111.48,
  "tax_amount": 8.50,
  "subtotal": 102.98,
  "discount_amount": 15.62,
  "purchase_date": "2026-01-28",
  "line_items": [
    {
      "item_name": "1 in. x 4 in. x 12 ft. Ground Contact Board",
      "quantity": 1,
      "unit_price": 1.49,
      "total_price": 1.49,
      "discount": 5.29,
      "suggested_category": "framing"
    }
  ]
}
```

**4. Add Post-Processing Validation**

Add logic to detect and warn about discount issues:

```typescript
// Validate discount detection
const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
const expectedSubtotal = cleanedData.subtotal;
const difference = Math.abs(lineItemsTotal - expectedSubtotal);

// If difference matches discount_amount, the AI used wrong price column
if (cleanedData.discount_amount > 0 && Math.abs(difference - cleanedData.discount_amount) < 1) {
  console.warn("AI may have used pre-discount prices. Attempting correction...");
  // Scale down line items proportionally
  const scaleFactor = expectedSubtotal / lineItemsTotal;
  cleanedData.line_items = cleanedData.line_items.map(item => ({
    ...item,
    unit_price: Math.round(item.unit_price * scaleFactor * 100) / 100,
    total_price: Math.round(item.total_price * scaleFactor * 100) / 100,
  }));
}
```

---

### Data Flow After Fix

```text
Receipt Image → AI Parser
                    ↓
              Detects discount columns
                    ↓
              Uses Net Unit Price (not Unit Price)
                    ↓
              Returns: subtotal=$102.98, discount=$15.62
                    ↓
              SmartSplit shows: Split Total = $102.98 + $8.50 tax = $111.48 ✓
```

---

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/parse-receipt-image/index.ts` | Update ReceiptData interface, AI prompt, and validation logic |

---

### Summary

The fix updates the AI receipt parser to:
1. Recognize discount columns on Home Depot/Lowe's receipts
2. Extract the **net price** (after discount) instead of the original unit price
3. Track the total discount amount separately
4. Add fallback correction if the AI uses wrong price column

This ensures split totals match the actual transaction amount.
