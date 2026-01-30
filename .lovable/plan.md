

## Fix: Amazon Receipt Price Calculation Logic

### Problem
The AI prompt has conflicting instructions causing incorrect price calculations:
- **Current (Wrong)**: Treats "$30.00" as line total, divides by quantity → unit_price = $15.00
- **Correct**: "$30.00" IS the unit price, multiply by quantity → total_price = $60.00

The format "2 x $30.00" clearly means: **2 units × $30 each = $60 total**

---

### Root Cause

The Amazon-specific rules (lines 96-118) contradict the general rules:

| Section | What It Says | Result |
|---------|--------------|--------|
| Amazon Rules | Price is LINE TOTAL, divide to get unit | WRONG |
| General Rules | "2 x $14.99" → total=29.98 (multiply) | CORRECT |

The AI follows the Amazon rules which appear first and are emphasized.

---

### Solution

Update the Amazon section to match reality:

**Format "X x $Y.YY":**
- X = quantity  
- $Y.YY = UNIT PRICE  
- total_price = X × $Y.YY  

---

### Implementation

**File:** `supabase/functions/parse-receipt-image/index.ts`

**Replace lines 90-138** with corrected prompt:

```text
You are a precise receipt parsing expert. Extract EVERY line item with ACCURATE quantities.

═══════════════════════════════════════════════════════
AMAZON RECEIPTS - SPECIAL HANDLING (READ CAREFULLY!)
═══════════════════════════════════════════════════════

Amazon shows: "X x $Y.YY" where X is quantity and $Y.YY is the UNIT PRICE!

EXAMPLE 1:
  "Bathroom Accessories Set"
  "2 x $30.00"
  
  → item_name: "Bathroom Accessories Set"
  → quantity: 2
  → unit_price: 30.00  (this is what's shown!)
  → total_price: 60.00  (calculated: 2 × 30.00)

EXAMPLE 2:
  "LED Light Bulb 4-pack"
  "1 x $55.99"
  
  → quantity: 1
  → unit_price: 55.99
  → total_price: 55.99

KEY RULES FOR AMAZON:
1. Look for "X x $Y.YY" pattern - X is quantity
2. The dollar amount is the UNIT PRICE (per item)
3. Calculate: total_price = quantity × unit_price
4. Don't skip items - every product line needs extraction
5. Ignore "Sold by:" and "Gift options:" lines

═══════════════════════════════════════════════════════
GENERAL RULES (ALL RECEIPTS)
═══════════════════════════════════════════════════════

VENDOR NAME: Extract STORE name (Amazon, Home Depot, Lowe's) NOT buyer name

QUANTITY PATTERNS:
- "2 x $14.99" → qty=2, unit_price=14.99, total=29.98
- "Qty: 3  $45.00" → qty=3, unit=15.00, total=45.00
- No quantity shown → qty=1

MATH VALIDATION:
- Each item: total_price = quantity × unit_price
- All items: sum(total_price) ≈ subtotal
- Final: subtotal + tax ≈ total_amount

CATEGORIES:
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, lighting, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, misc
```

**Also update the user prompt (lines 145-150)** to match:

```text
Parse this receipt. Extract EVERY item with CORRECT quantities.

AMAZON RECEIPT CHECKLIST:
□ Found "X x $Y.YY" for each item?
□ X is the quantity, $Y.YY is the UNIT PRICE
□ Calculated total_price = quantity × unit_price
□ Sum of all total_prices matches subtotal?
□ Subtotal + tax matches order total?
```

---

### Summary of Changes

| Location | Before | After |
|----------|--------|-------|
| Line 96 | "price is LINE TOTAL" | "price is UNIT PRICE" |
| Line 104-105 | divide to get unit | multiply to get total |
| Line 116-117 | total_price ÷ quantity | quantity × unit_price |
| Lines 148-150 | divide logic | multiply logic |

---

### Expected Results

For "2 x $30.00":
- **Before**: unit_price=$15.00, total_price=$30.00 (WRONG)
- **After**: unit_price=$30.00, total_price=$60.00 (CORRECT)

Receipt totals will now match QuickBooks transactions.

