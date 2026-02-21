

## Upgrade Receipt Text Parsing to Match Image Parsing Quality

### Problem
The "Paste Receipt Text" parser uses a simple generic prompt that returns basic fields (vendor, date, amount, description). It lacks the construction-specific intelligence, category mapping, and validation that the image parser has. Users who paste receipt text get a much weaker experience than those who upload a photo.

### Changes

**1. Upgrade `supabase/functions/parse-receipt-text/index.ts`**

- Switch model from `gemini-3-flash-preview` to `gemini-2.5-pro` for better extraction accuracy
- Rewrite the system prompt to include the same construction-category-aware intelligence as the image parser (all BudgetCategory enum values)
- Expand the tool schema to return `suggested_category` (mapped to real category values like `plumbing`, `electrical`, etc.) and `expenseType` (`product` or `labor`)
- Add date year-correction logic (same as image parser -- correct years outside current year range)
- Add 429/402 error handling with proper CORS headers (already present but verify consistency)

**2. Update `src/components/QuickExpenseModal.tsx` -- `handleParseReceiptText`**

- After parsing, auto-fill the `selectedCategory` field using the new `suggested_category` response
- Auto-fill the `expenseType` field using the new `expenseType` response
- Update the success toast to show more detail (e.g. "Extracted: Home Depot - $476.60")

### Technical Details

**Edge function prompt upgrade:**
The system prompt will include:
- Full list of valid categories matching the BudgetCategory enum (appliances, bathroom, cabinets, cleaning, electrical, flooring, plumbing, etc.)
- Instructions to identify vendor type (retailer = product, contractor = labor)
- Construction-bookkeeper persona for DFW real estate context
- Date normalization rules (YYYY-MM-DD, correct year to current if off)

**Tool schema additions:**
```
suggested_category: { type: "string", enum: [...all budget categories...] }
expenseType: { type: "string", enum: ["product", "labor"] }
```

**Frontend auto-fill additions (QuickExpenseModal lines ~103-113):**
- `if (parsed.suggested_category) setSelectedCategory(parsed.suggested_category)`
- `if (parsed.expenseType) setExpenseType(parsed.expenseType)`

### Files Changed
- `supabase/functions/parse-receipt-text/index.ts` -- prompt + schema upgrade
- `src/components/QuickExpenseModal.tsx` -- auto-fill category + expense type from parsed result
