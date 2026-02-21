
## Enhance "Adjusted" Tooltip with Scaling Details

### What Changes
Update the tooltip that appears when hovering over the "Adjusted" badge to show specific numbers explaining what happened: the raw parsed total, the bank transaction target, and the scale factor applied.

### Technical Details

**File: `src/components/SmartSplitReceiptUpload.tsx`** (lines 1315-1317)

Replace the generic tooltip text with a dynamic message that includes:
- The raw total the AI parsed (e.g., "$440.28")
- The target total from the bank transaction (e.g., "$440.28" adjusted or "$476.60")
- The percentage adjustment applied (e.g., "+0.6%")

The `computeScaleFactor` already returns `sf` and `rawTotal`/`targetTotal` can be computed inline. We'll compute these values alongside `sf` and `wasScaled` (around line 1291-1298) and pass them into the tooltip content.

**Example tooltip content:**
> "The AI parsed line items totaling $437.31, but the transaction subtotal is $440.28. Prices were scaled up by 0.7% so the split matches exactly."

For cases where tax is excluded from scaling:
> "The AI parsed line items totaling $437.31, but the transaction total (minus $36.32 tax) is $440.28. Prices were scaled up by 0.7% so the split matches exactly."

### Implementation Steps

1. Refactor `computeScaleFactor` to also return `rawTotal` and `targetTotal` (not just the factor) so the tooltip can display them
2. Update the tooltip content (line 1316) to use a template with the raw total, target total, and percentage difference
3. Format numbers as currency and percentage for clarity
