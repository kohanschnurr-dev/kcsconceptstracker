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
   - Add: `"site work" → misc`, `"lumber package" → framing`, `"drywall package" → drywall`, `"drywall labor" → drywall`, `"roofing" → roofing`, `"exterior doors" → doors`, `"garage door" → garage`, `"termite treatment" → pest_control`, `"punch out" → final_punch`, `"final clean" → cleaning`, `"driveway" / "concrete work" → driveway_concrete`, `"survey" → misc` (or a soft cost category), `"energy" → inspections`, `"structural" / "civil engineering" → permits`
   - Smarter partial matching: tokenize the name and check if any token matches a keyword, not just substring containment

4. **Aggregate duplicate categories before showing the map step**:
   - When multiple lines map to the same category (e.g., "Drywall Package" and "Drywall Labor" both → drywall), optionally show them individually but pre-aggregate in the final output (already done, just confirming)

5. **Pre-clean pasted text**:
   - Strip dollar signs, handle tab-separated columns with headers like `$/SQFT`, `TOTAL COST`, `QUANTITY`, `NOTES`
   - Detect and skip header rows more aggressively (look for column header patterns)

### Files touched
- `src/components/budget/ImportBudgetModal.tsx` (~60 lines changed in parsing logic)
