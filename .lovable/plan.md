

## Plan: Add Sales Tax Toggle to SmartSplit

### Overview
Add a toggle switch in the SmartSplit modal to exclude sales tax from the split total calculation. When tax is included on the receipt but the QuickBooks transaction is the final amount, users can turn off the tax to avoid the mismatch warning.

---

### Current Behavior
- Receipt line items + tax are summed to create "Split Total"
- If Split Total ≠ QB Transaction amount → shows warning
- In the screenshot: $89.15 (line items) + $9.15 (tax) = $98.30 vs $89.15 → mismatch warning

### New Behavior
- Toggle switch appears next to Sales Tax row
- When OFF: Tax is excluded from Split Total calculation
- Split Total = $89.15 (matches QB transaction) → no warning

---

### UI Changes

**Tax Row with Toggle:**

```text
Before:
┌───────────────────────────────────────────────────────────┐
│  Sales Tax                          [Tax]       $9.15    │
│  Applied to purchase                                      │
└───────────────────────────────────────────────────────────┘

After:
┌───────────────────────────────────────────────────────────┐
│  Sales Tax                    [Switch] [Tax]    $9.15    │
│  Applied to purchase    Include in total                  │
└───────────────────────────────────────────────────────────┘
```

When toggle is OFF:
- Tax row gets muted/grayed out styling
- Split Total excludes tax amount
- Badge changes to strikethrough or dimmed "Tax"

---

### Technical Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

1. **Add state for tax toggle:**
   ```typescript
   const [includeTax, setIncludeTax] = useState(true);
   ```

2. **Import Switch component:**
   ```typescript
   import { Switch } from '@/components/ui/switch';
   ```

3. **Update Tax Line Item row (lines ~1187-1201):**
   - Add Switch component with `checked={includeTax}` and `onCheckedChange={setIncludeTax}`
   - Apply conditional styling when tax is excluded (opacity, strikethrough)
   - Add label "Include in total"

4. **Update Split Total calculation (lines ~1206-1210):**
   ```typescript
   // Change from:
   const splitTotal = lineItemsTotal + (selectedMatch.receipt.tax_amount || 0);
   
   // Change to:
   const splitTotal = lineItemsTotal + (includeTax ? (selectedMatch.receipt.tax_amount || 0) : 0);
   ```

5. **Reset state when modal closes or new match selected:**
   - Add `setIncludeTax(true)` in the resetModal/close logic

---

### Visual States

| State | Tax Row Appearance | Split Total |
|-------|-------------------|-------------|
| Toggle ON (default) | Normal amber styling | Includes tax |
| Toggle OFF | Muted/dimmed, opacity-50 | Excludes tax |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SmartSplitReceiptUpload.tsx` | Add includeTax state, import Switch, update tax row UI, modify split total calculation, reset on modal close |

---

### Expected Result
- Users can toggle off sales tax when the receipt total already includes tax but the QB transaction is the final amount
- Split Total updates dynamically as toggle changes
- Mismatch warning disappears when totals align

