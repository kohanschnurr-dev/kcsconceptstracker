

## Add Dollar Amount to Each Work Item Line

### What Changes

Each work item row (in Work Items, Also Included, and Exclusions) will gain an optional dollar amount input. This lets users assign a cost to individual line items. The PDF output will include the amount next to each item and show a subtotal per section.

### Details

- Add a `$` amount input (narrow, right-aligned) between the text input and the camera button on each row
- The amount displays as empty when zero, following the existing numeric input convention
- The PDF output formats each line as `"Item description — $X,XXX.XX"` when an amount is present, and shows a section subtotal

### Technical Details

**`src/components/vendors/WorkItemLines.tsx`**

1. Add `amount` field to the `WorkItem` interface:
   ```
   export interface WorkItem {
     text: string;
     amount: number;
     photos: string[];
   }
   ```

2. Add a narrow `$` Input (type="number", w-24) between the text input and camera button in each row

3. Update `addItem` to initialize `amount: 0`

4. Display a running total at the bottom of the section when any item has an amount > 0

**`src/components/vendors/ScopeOfWorkSheet.tsx`**

1. Update `handleGenerate` to include amounts in the PDF text:
   - Each line: `"Remove old water heater — $500.00"` (only if amount > 0)
   - Add subtotal line per section when amounts exist

2. Reset logic already handles the array clearing, no changes needed there

No database changes required.

