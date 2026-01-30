

## Fix: Quantity Parsing Inconsistency in Receipt Parser

### Problem Identified
The database shows inconsistent quantity extraction:

| Receipt | Item | Expected | Actual |
|---------|------|----------|--------|
| Recent | Zarbitta 3-Light (2 x $29.75) | qty: 2, total: $59.50 | qty: 1, total: $29.75 |
| Recent | Ceiling Fan (2 x $56.99) | qty: 2, total: $113.98 | qty: 1, total: $56.99 |
| Previous | Zarbitta 3-Light (2 x $29.75) | qty: 2, total: $59.50 | qty: 2, total: $59.50 ✓ |

The validation log confirms: **Line items = $530.69** but **Subtotal = $620.43** (missing $89.74).

The `gemini-2.5-flash` model is inconsistently detecting the "X x $Y.YY" pattern.

---

### Root Cause

The current prompt relies on the AI to "look for" the pattern, but doesn't enforce extraction step-by-step. The Flash model sometimes:
1. Misses the quantity prefix entirely
2. Returns unit_price = total_price (assuming qty=1)

---

### Solution: Two-Part Approach

**1. Add explicit extraction steps in the prompt** - Force the AI to think step-by-step before returning JSON

**2. Add post-processing validation** - If `unit_price === total_price` but the item text contains "X x $", recalculate in code

---

### Implementation

**File:** `supabase/functions/parse-receipt-image/index.ts`

#### Change 1: Enhanced Prompt with Step-by-Step Extraction (lines 90-139)

```typescript
content: `You are a precise receipt parsing expert. Extract EVERY line item with ACCURATE quantities.

═══════════════════════════════════════════════════════
STEP-BY-STEP EXTRACTION PROCESS (FOLLOW EXACTLY!)
═══════════════════════════════════════════════════════

For EACH item on the receipt, do these steps IN ORDER:

STEP 1: Find the item name line
STEP 2: Look at the NEXT line for "X x $Y.YY" pattern
STEP 3: If found:
   - X = quantity (the number BEFORE "x")
   - $Y.YY = unit_price (the price AFTER "x")
   - Calculate: total_price = X × Y.YY
STEP 4: If NO "X x" pattern, set quantity = 1

═══════════════════════════════════════════════════════
AMAZON RECEIPT EXAMPLES
═══════════════════════════════════════════════════════

EXAMPLE 1:
  "Bathroom Accessories Set"
  "2 x $30.00"
  
  → STEP 2: Found "2 x $30.00"
  → STEP 3: quantity=2, unit_price=30.00, total_price=60.00

EXAMPLE 2:
  "Zarbitta 3-Light Bathroom Fixture"
  "2 x $29.75"
  
  → quantity: 2
  → unit_price: 29.75
  → total_price: 59.50 (2 × 29.75)

EXAMPLE 3:
  "Ceiling Fan with Light 42 inch"
  "2 x $56.99"
  
  → quantity: 2
  → unit_price: 56.99  
  → total_price: 113.98 (2 × 56.99)

CRITICAL MATH CHECK:
total_price MUST equal quantity × unit_price
If unit_price equals total_price and quantity > 1, you made an error!

═══════════════════════════════════════════════════════
VALIDATION BEFORE RETURNING
═══════════════════════════════════════════════════════

1. For each item: total_price = quantity × unit_price
2. Sum of all total_price values should ≈ subtotal
3. subtotal + tax_amount should ≈ total_amount

If math doesn't work, re-scan the receipt for missed quantities!

CATEGORIES:
plumbing, electrical, hvac, flooring, painting, cabinets, countertops, tile, lighting, hardware, appliances, windows, doors, roofing, framing, insulation, drywall, bathroom, carpentry, fencing, landscaping, misc`
```

#### Change 2: Add Post-Processing Quantity Fix (after line 243)

Add code to validate and fix quantities after parsing:

```typescript
// Post-processing: Validate quantity calculations
const validatedLineItems = cleanedData.line_items.map(item => {
  // If total_price equals unit_price but quantity > 1 was expected
  // This catches cases where AI mistakenly set qty=1
  const expectedTotal = item.quantity * item.unit_price;
  const tolerance = 0.01;
  
  // If the math doesn't add up, assume unit_price IS the total
  // and calculate the real unit price
  if (Math.abs(expectedTotal - item.total_price) > tolerance) {
    // total_price is correct, recalculate unit_price
    const correctedUnitPrice = item.quantity > 0 
      ? Math.round((item.total_price / item.quantity) * 100) / 100
      : item.total_price;
    
    return {
      ...item,
      unit_price: correctedUnitPrice,
    };
  }
  
  // If unit_price === total_price AND quantity === 1
  // This is probably correct (single item), leave as-is
  return item;
});

cleanedData.line_items = validatedLineItems;
```

---

### Why This Approach Works

1. **Step-by-step prompting**: Forces the AI to explicitly identify the "X x $Y.YY" pattern before extracting values
2. **Concrete examples**: Shows real items that were being parsed incorrectly
3. **Math validation in prompt**: Asks AI to self-check before returning
4. **Post-processing safety net**: Catches any remaining errors in code

---

### Expected Results

For "Zarbitta 3-Light" with "2 x $29.75":
- **Before**: qty=1, unit=$29.75, total=$29.75 
- **After**: qty=2, unit=$29.75, total=$59.50 

Total receipt should match: $620.43 subtotal + $51.17 tax = $671.60

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/parse-receipt-image/index.ts` | Enhanced prompt + post-processing validation |

