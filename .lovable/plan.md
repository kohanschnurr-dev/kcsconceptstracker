

## Plan: Enhance Receipt Parsing AI for Accurate Price Extraction

### Problem Analysis

The receipt parser is reading unit prices incorrectly for Home Depot receipts. Looking at the screenshot:
- **Cantex 1 in. PVC Male Terminal Adapter**: Shows `1 × $0.86 = $0.86`
- **Commercial Electric 3/4 in. x 60 ft. Tape**: Shows `2 × $1.79 = $3.58`

These prices appear suspiciously low for Home Depot products. The AI is likely:
1. **Reading from the wrong column** - Home Depot receipts have multiple price columns (Unit Price, Discount, Net Price, Extended Price)
2. **Confusing quantity with price** - Some SKU numbers or pack quantities may be misread as unit prices
3. **Missing items entirely** - Only 14 items parsed when there may be more

From the logs, the AI consistently produces:
- Line items total: ~$192-213
- Expected total: $288.22
- Missing: ~$75-96

### Solution: Three-Tier Approach

#### 1. Enhanced AI Prompt with Store-Specific Column Detection

Rewrite the system prompt with explicit column position guidance for major retailers:

**Home Depot Receipt Format:**
```text
DESCRIPTION          QTY  PRICE   SAVINGS   NET EA    AMOUNT
────────────────────────────────────────────────────────────
2" PVC Coupling       2   $3.98              $1.99     $3.98
                                                     ^^^^^^
                                              USE THIS COLUMN
```

**Key instruction**: The RIGHTMOST numeric column before tax is the actual line item total. Use that, NOT the middle columns.

#### 2. Stricter Validation Rules

Add explicit validation in the AI prompt:
- If total parsed < receipt subtotal - 5%, flag as incomplete
- Each line item total should be >= $0.50 (almost nothing at hardware stores is under $0.50)
- If unit_price < $0.25, likely a parsing error

#### 3. Robust Post-Processing in Edge Function

Add server-side corrections:
- Detect when sum of line items is dramatically different from receipt subtotal
- Log detailed warnings for manual review
- Scale line items proportionally when close match is detected

---

### Technical Changes

**File: `supabase/functions/parse-receipt-image/index.ts`**

#### Change 1: Upgrade AI Model (Line 88)

Use the more capable Gemini 2.5 Pro model for complex receipt parsing:

```typescript
// Before
model: "google/gemini-2.5-flash",

// After  
model: "google/gemini-2.5-pro",
```

#### Change 2: Rewrite System Prompt (Lines 91-152)

Replace the current system prompt with a clearer, more structured version:

```typescript
content: `You are a receipt OCR specialist. Your job is to extract EVERY line item with EXACT prices.

═══════════════════════════════════════════════════════════════
HOME DEPOT / LOWE'S RECEIPT COLUMN LAYOUT
═══════════════════════════════════════════════════════════════

Home Depot receipts have 5-6 columns. USE THE RIGHTMOST PRICE COLUMN (before tax):

DESCRIPTION              QTY   UNIT    SAVE    NET EA    TOTAL
──────────────────────────────────────────────────────────────
2" PVC Coupling           2   $3.98           $1.99     $3.98
Electrical Tape 3pk       1   $5.47                     $5.47
──────────────────────────────────────────────────────────────

EXTRACTION RULES:
• quantity = QTY column (the small number, usually 1-10)
• total_price = RIGHTMOST dollar amount on the line (TOTAL or AMOUNT column)
• unit_price = total_price / quantity
• If SAVE column has a value, the item was discounted - total_price is already NET

COMMON MISTAKES TO AVOID:
✗ Do NOT use unit price column when a TOTAL column exists
✗ Do NOT confuse SKU numbers (like "042111" or "1-Gang") with prices
✗ Do NOT read pack sizes ("3pk", "10-ct") as quantities - those are part of the item name
✗ Hardware store items are almost NEVER under $0.50 - if you see $0.86, double-check!

═══════════════════════════════════════════════════════════════
AMAZON RECEIPT LAYOUT  
═══════════════════════════════════════════════════════════════

Look for "Qty: X" or "X x $Y.YY" patterns below item names.

═══════════════════════════════════════════════════════════════
VALIDATION CHECKLIST (VERIFY BEFORE RETURNING)
═══════════════════════════════════════════════════════════════

1. Sum of all line item total_price ≈ subtotal (within 5%)
2. Each item total_price >= $0.50 (flag if lower - likely wrong column)
3. total_price = quantity × unit_price (must be exact)
4. subtotal + tax ≈ total_amount

If validation fails, RE-READ the receipt and check column alignment.

═══════════════════════════════════════════════════════════════
CATEGORIES (use lowercase)
═══════════════════════════════════════════════════════════════
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, 
tile, light_fixtures, hardware, appliances, windows, doors, roofing, 
framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, 
garage, cleaning, misc`
```

#### Change 3: Update User Prompt (Lines 156-192)

Simplify and focus on column detection:

```typescript
text: `Extract ALL items from this receipt. 

COLUMN DETECTION:
1. First, identify how many columns the receipt has
2. Find the RIGHTMOST price column (the line total)
3. Use THAT column for total_price, then calculate unit_price = total/qty

SANITY CHECK YOUR RESULTS:
• Hardware store items are rarely under $1.00
• If most items show < $2.00, you may be reading the wrong column
• Sum of total_price values should match the receipt subtotal

Return ONLY valid JSON (no markdown, no explanation):
{
  "vendor_name": "HOME DEPOT",
  "total_amount": 288.22,
  "tax_amount": 21.75,
  "subtotal": 266.47,
  "discount_amount": 0,
  "purchase_date": "2026-02-03",
  "line_items": [
    {
      "item_name": "2 in. PVC Coupling",
      "quantity": 2,
      "unit_price": 1.99,
      "total_price": 3.98,
      "discount": 0,
      "suggested_category": "plumbing"
    }
  ]
}`
```

#### Change 4: Add Minimum Price Validation (After Line 276)

Add a sanity check for suspiciously low prices:

```typescript
// Flag items with suspiciously low prices (likely wrong column)
const suspiciousItems = cleanedData.line_items.filter(item => 
  item.total_price > 0 && item.total_price < 0.50
);

if (suspiciousItems.length > cleanedData.line_items.length * 0.3) {
  console.warn(`WARNING: ${suspiciousItems.length}/${cleanedData.line_items.length} items have total < $0.50. AI may be reading wrong column.`);
  console.warn("Suspicious items:", suspiciousItems.map(i => `${i.item_name}: $${i.total_price}`).join(', '));
}
```

#### Change 5: Improve Scaling Logic (Lines 314-331)

Make the scaling correction smarter - only apply when there's a clear proportional error:

```typescript
// If line items total is significantly less than subtotal
const lineItemsTotal = cleanedData.line_items.reduce((sum, item) => sum + item.total_price, 0);
const expectedSubtotal = cleanedData.subtotal;
const difference = expectedSubtotal - lineItemsTotal;
const percentDiff = (difference / expectedSubtotal) * 100;

// If items sum to less than half the subtotal, something is very wrong
if (lineItemsTotal > 0 && percentDiff > 50) {
  console.error(`CRITICAL: Line items ($${lineItemsTotal.toFixed(2)}) are ${percentDiff.toFixed(0)}% less than subtotal ($${expectedSubtotal.toFixed(2)})`);
  console.error("Possible causes: wrong column read, missing items, or OCR failure");
  // Don't scale - the data is too unreliable
} else if (difference > 1 && percentDiff > 5 && percentDiff < 50) {
  // Proportional scaling for moderate discrepancies (likely discount column issue)
  console.warn(`Scaling items to match subtotal (${percentDiff.toFixed(1)}% difference)`);
  const scaleFactor = expectedSubtotal / lineItemsTotal;
  cleanedData.line_items = cleanedData.line_items.map(item => ({
    ...item,
    unit_price: Math.round(item.unit_price * scaleFactor * 100) / 100,
    total_price: Math.round(item.total_price * scaleFactor * 100) / 100,
  }));
}
```

#### Change 6: Add Detailed Debug Logging

Add more informative logs for troubleshooting:

```typescript
// After receiving AI response, log a summary
console.log("=== Receipt Parse Summary ===");
console.log(`Vendor: ${cleanedData.vendor_name}`);
console.log(`Date: ${cleanedData.purchase_date}`);
console.log(`Items: ${cleanedData.line_items.length}`);
console.log(`Line Items Total: $${lineItemsTotal.toFixed(2)}`);
console.log(`Subtotal: $${cleanedData.subtotal.toFixed(2)}`);
console.log(`Tax: $${cleanedData.tax_amount.toFixed(2)}`);
console.log(`Total: $${cleanedData.total_amount.toFixed(2)}`);
console.log(`Difference: $${difference.toFixed(2)} (${percentDiff.toFixed(1)}%)`);
console.log("============================");
```

---

### Expected Outcome

After these changes:
1. **Better column detection** - AI will be explicitly instructed to use the RIGHTMOST price column
2. **Sanity checks** - Items under $0.50 will be flagged as suspicious  
3. **Clearer prompts** - Store-specific layouts with visual examples
4. **Improved model** - Using Gemini Pro for better accuracy on complex documents
5. **Better logging** - Easier to diagnose parsing issues

---

### Testing Recommendation

After implementation:
1. Re-upload the Home Depot receipt that showed the $5.08 mismatch
2. Verify that line items now sum to match the subtotal
3. Check that unit prices look realistic (most hardware items $1-50 range)

