

## Remove Ordered/Received Card from Project Procurement Tab

### Change
Remove the "Ordered/Received" stat card (lines 472-484) from `src/components/project/ProcurementTab.tsx`. This leaves just two stat cards: "Cart Total" and "Items Assigned".

### File: `src/components/project/ProcurementTab.tsx`
- Delete the entire `<Card>` block for "Ordered/Received" (lines 472-484)
- The surrounding grid will automatically adjust with the remaining 2 cards

