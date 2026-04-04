

## Plan: Smarter Budget Import Parser

The current parser is too naive — it doesn't filter out summary rows, subtotals, section headers, formula descriptions, or percentage values. When pasting a full construction cost estimator, it picks up junk rows and mismatches categories.

### Changes

**File: `src/components/budget/ImportBudgetModal.tsx`**

1. **Smarter row filtering in `parseCSVText`**:
   - Skip rows containing summary keywords: "SUBTOTAL", "ALL-IN TOTAL", "TOTALS", "PROJECT INPUTS", "FINANCING COSTS", "EBT", "ROI", "ARV", "LTC", "Delivery", "Sale ($/sqft)"
   - Skip rows where the "amount" is actually a percentage (contains `%`)
   - Skip rows that are clearly formulas/notes (e.g., "Formula:", lines with no real amount)
   - Skip $/sqft-only rows (amounts under ~$10 that look like per-unit costs when a larger total exists on the same row)

2. **Smarter amount extraction**:
   - When multiple numeric columns exist, prefer the largest value (the total) over $/sqft or per-unit costs
   - Handle negative amounts (refunds/credits)
   - Ignore numbers that look like quantities (small integers next to "Quantity" headers)

3. **Better auto-matching with expanded aliases**:
   - Add: `"site work" → misc`, `"lumber package" → framing`, `"drywall package/labor" → drywall`, `"exterior doors" → doors`, `"garage door" → garage`, `"termite treatment" → pest_control`, `"punch out" → final_punch`, `"final clean" → cleaning`, `"driveway"/"concrete work" → driveway_concrete`, `"survey" → permits`, `"energy" → inspections`, `"structural/civil engineering" → permits`, `"architecture/plans" → permits`
   - Tokenized matching: split the name into words and check if any word matches a keyword

4. **Pre-clean pasted text**:
   - Detect and skip header rows more aggressively (look for column header patterns like "$/SQFT", "TOTAL COST", "QUANTITY", "NOTES", "COST CATEGORY")
   - Strip dollar signs and handle multi-column tab-separated data

### Files touched
- `src/components/budget/ImportBudgetModal.tsx` (~60 lines changed in parsing logic)

