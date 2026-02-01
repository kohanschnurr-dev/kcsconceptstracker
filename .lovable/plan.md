

## Plan: Clean Up Procurement Table

### Overview
Simplify the procurement table by removing clutter (model numbers and status column) and fixing the quantity input alignment.

### Changes

**File: `src/components/project/ProcurementTab.tsx`**

#### 1. Remove Model Number Display (lines 374-376)
Remove the `#{item.model_number}` text that appears under item names.

| Location | Change |
|----------|--------|
| Lines 374-376 | Delete the conditional model_number display |

#### 2. Fix Qty Input Alignment (lines 398-405)
Center the quantity input within the table cell.

| Location | Current | New |
|----------|---------|-----|
| Line 398 | `<TableCell className="text-right"` | `<TableCell className="text-center"` |
| Line 404 | `className="w-16 h-8 text-right text-sm"` | `className="w-16 h-8 text-center text-sm mx-auto"` |

#### 3. Remove Status Column
Delete the Status column from both the table headers and the row rendering.

**Table Headers (2 locations):**
- Lines 628 (phase view): Remove `<TableHead>Status</TableHead>`
- Lines 656 (default view): Remove `<TableHead>Status</TableHead>`

**Qty Header Alignment:**
- Lines 626 and 654: Change `<TableHead className="text-right">Qty</TableHead>` to `<TableHead className="text-center">Qty</TableHead>`

**Row Rendering (lines 410-424):**
Delete the entire status `<Select>` component wrapped in `<TableCell>`.

### Technical Summary
- Lines 374-376: Delete model number display
- Lines 398, 404: Update cell and input alignment for Qty column
- Lines 410-424: Delete status column cell in row render
- Lines 626, 654: Update Qty header alignment to center
- Lines 628, 656: Delete Status header

### Result
- Cleaner table without model numbers cluttering item names
- Properly centered quantity inputs
- Removed status dropdown column for a more streamlined view

