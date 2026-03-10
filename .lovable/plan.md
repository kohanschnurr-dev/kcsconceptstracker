

## Plan: Make Unit Prices Editable in SmartSplit Review

### What
Add an editable price input next to each line item's quantity so users can fix AI parsing mistakes before import.

### Changes in `src/components/SmartSplitReceiptUpload.tsx`

1. **Add state** (next to line 92):
   ```ts
   const [editablePrices, setEditablePrices] = useState<Record<number, number>>({});
   ```

2. **Initialize in `acceptMatch`** (near line 633, alongside quantities):
   ```ts
   const initialPrices: Record<number, number> = {};
   receipt.line_items.forEach((item: LineItem, idx: number) => {
     initialPrices[idx] = item.unit_price;
   });
   setEditablePrices(initialPrices);
   ```

3. **Update `computeScaleFactor`** (line 656): Accept `prices: Record<number, number>` param, use `prices[idx] ?? item.unit_price` instead of `item.unit_price`.

4. **Update `groupByCategory`** (line 667): Accept `prices: Record<number, number>` param, use `prices[idx] ?? item.unit_price` instead of `item.unit_price`.

5. **Update all call sites** of `computeScaleFactor` and `groupByCategory` (~lines 735-748, 1307-1310) to pass `editablePrices`.

6. **Update line item UI** (line 1347-1364): Replace static `× $X.XX` with an editable input:
   ```tsx
   const editedPrice = editablePrices[idx] ?? item.unit_price;
   const scaledPrice = Math.round(editedPrice * sf * 100) / 100;
   const editedTotal = editedQty * scaledPrice;
   // ...
   <span>×</span>
   <span>$</span>
   <Input
     type="number"
     step="0.01"
     min="0"
     value={editedPrice}
     onChange={(e) => setEditablePrices(prev => ({
       ...prev,
       [idx]: parseFloat(e.target.value) || 0
     }))}
     className="w-16 h-5 px-1 text-xs text-center"
   />
   ```

The scale factor will automatically recalculate based on edited prices, keeping the total aligned with the QB transaction amount.

