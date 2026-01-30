

## Fix: Amazon Receipt Quantity Parsing

### Problem
The AI receipt parser is failing to extract correct quantities from Amazon receipts, causing mismatches between the parsed total and the actual receipt amount. Amazon uses specific formatting patterns that the current prompt doesn't adequately address.

---

### Root Cause Analysis

Amazon receipts have unique formatting that differs from typical retail receipts:

| Amazon Format | What AI Sees | What It Should Extract |
|---------------|--------------|------------------------|
| `Item Name` | Just the name | - |
| `Qty: 2` on separate line | Ignores it | quantity = 2 |
| `$29.98` | Treats as unit price | This is actually total_price |
| `$14.99 each` (sometimes shown) | May miss this | unit_price = 14.99 |

The current prompt has general quantity instructions but lacks **Amazon-specific parsing rules**.

---

### Solution

Update the AI prompt with Amazon-specific extraction logic:

1. **Amazon-Specific Format Detection**: Add explicit instructions for Amazon's unique receipt layout
2. **Multi-Line Item Parsing**: Handle cases where quantity appears on a separate line from the price
3. **Price Type Identification**: Distinguish between "per item" and "line total" prices
4. **Use Stronger Model**: Switch from `gemini-2.5-flash` to `gemini-2.5-pro` for better accuracy on complex receipts
5. **Post-Processing Validation**: Add server-side validation to flag when line items don't sum to subtotal

---

### Implementation Details

**File:** `supabase/functions/parse-receipt-image/index.ts`

#### Change 1: Upgrade to Pro Model for Better Accuracy
```typescript
// Line 86: Change model
model: "google/gemini-2.5-pro",  // More accurate for complex parsing
```

#### Change 2: Add Amazon-Specific Parsing Rules to System Prompt
```typescript
// Enhanced system prompt with Amazon-specific rules

AMAZON-SPECIFIC PARSING (CRITICAL):
Amazon receipts have a UNIQUE format. Follow these rules EXACTLY:

FORMAT A - Quantity on same line:
  "Item Name  Qty: 2  $29.98"
  → quantity=2, total_price=29.98, unit_price=14.99 (calculated)

FORMAT B - Quantity below item:
  "Item Name"
  "  Qty: 2  $29.98"
  → quantity=2, total_price=29.98, unit_price=14.99

FORMAT C - With unit price shown:
  "Item Name"
  "  Qty: 2 @ $14.99 each  $29.98"
  → quantity=2, unit_price=14.99, total_price=29.98

FORMAT D - Item with "Sold by" line:
  "Item Name"
  "  Sold by: Seller Name"
  "  Qty: 1  $25.00"
  → SKIP "Sold by" line, extract qty from Qty line

AMAZON PRICE RULES:
- The price shown NEXT TO "Qty: X" is the LINE TOTAL (not unit price)
- Calculate: unit_price = total_price / quantity
- Amazon often shows "Qty: 1" explicitly - don't assume qty=1
```

#### Change 3: Add Validation Step in User Prompt
```typescript
// Enhanced user prompt with validation checklist

AMAZON RECEIPT CHECKLIST:
□ Found "Qty:" for each item? (Amazon always shows this)
□ Price next to Qty is the LINE TOTAL, not unit price
□ Calculated unit_price = line_total / quantity
□ Sum of all line totals matches subtotal?
□ Subtotal + tax matches order total?

IF MISMATCH: Re-scan the receipt for missed items or quantities!
```

#### Change 4: Add Post-Processing Validation with Logging
```typescript
// After line 221, add validation logging
const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
const expectedSubtotal = cleanedData.subtotal;
const difference = Math.abs(lineItemsTotal - expectedSubtotal);

if (difference > 0.10) {
  console.warn(`VALIDATION WARNING: Line items total ($${lineItemsTotal.toFixed(2)}) differs from subtotal ($${expectedSubtotal.toFixed(2)}) by $${difference.toFixed(2)}`);
}

console.log(`Parsed receipt: ${cleanedData.vendor_name}, $${cleanedData.total_amount}, ${cleanedData.line_items.length} items (line items sum: $${lineItemsTotal.toFixed(2)})`);
```

---

### Updated System Prompt (Full)

```text
You are a precise receipt parsing expert. Extract EVERY line item with ACCURATE quantities.

═══════════════════════════════════════════════════════
AMAZON RECEIPTS - SPECIAL HANDLING (READ CAREFULLY!)
═══════════════════════════════════════════════════════

Amazon has a UNIQUE format. The price shown is the LINE TOTAL, not unit price!

EXAMPLE 1:
  "Southwire 14/2 NM-B Wire 50ft"
  "  Qty: 3                    $89.97"
  
  → item_name: "Southwire 14/2 NM-B Wire 50ft"
  → quantity: 3
  → total_price: 89.97  (this is what's shown!)
  → unit_price: 29.99   (calculated: 89.97 ÷ 3)

EXAMPLE 2:
  "LED Light Bulb 4-pack  Qty: 2  $19.98"
  
  → quantity: 2
  → total_price: 19.98
  → unit_price: 9.99

KEY RULES FOR AMAZON:
1. Look for "Qty: X" - this is your quantity
2. The dollar amount near Qty is the LINE TOTAL
3. Calculate: unit_price = total_price ÷ quantity
4. Don't skip items - every product line needs extraction
5. Ignore "Sold by:" and "Gift options:" lines

═══════════════════════════════════════════════════════
GENERAL RULES (ALL RECEIPTS)
═══════════════════════════════════════════════════════

VENDOR NAME: Extract STORE name (Amazon, Home Depot, Lowe's) NOT buyer name

QUANTITY PATTERNS:
- "2 x $14.99" → qty=2, unit_price=14.99, total=29.98
- "Qty: 3  $45.00" → qty=3, total=45.00, unit=15.00
- No quantity shown → qty=1

MATH VALIDATION:
- Each item: total_price = quantity × unit_price
- All items: sum(total_price) ≈ subtotal
- Final: subtotal + tax ≈ total_amount

CATEGORIES:
plumbing, electrical, hvac, flooring, painting, cabinets, 
countertops, tile, lighting, hardware, appliances, windows, 
doors, roofing, framing, insulation, drywall, bathroom, 
carpentry, fencing, landscaping, misc
```

---

### Summary of Changes

| Location | Change |
|----------|--------|
| Line 86 | Model: `gemini-2.5-flash` → `gemini-2.5-pro` |
| Lines 89-117 | Enhanced system prompt with Amazon-specific rules |
| Lines 124-149 | Enhanced user prompt with validation checklist |
| After line 221 | Add validation logging for debugging |

---

### Expected Results

After implementation:
- Amazon receipts will parse with correct quantities
- Line items will sum to match the subtotal
- Logs will show validation warnings if there's still a mismatch
- More accurate parsing due to upgraded model

