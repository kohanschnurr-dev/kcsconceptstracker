

## Plan: Simplify Financials Tab

### Overview

Remove the "Spending by Category" chart and "Category Breakdown" table from the Financials tab, keeping only the Profit Calculator and Export Reports for a cleaner, less cluttered view.

### Current Layout

```
┌──────────────────────────────────────────────────────────┐
│                     Financials Tab                        │
├────────────────────────┬─────────────────────────────────┤
│   Profit Calculator    │   Spending by Category (chart)  │  ← REMOVE chart
├────────────────────────┴─────────────────────────────────┤
│                    Export Reports                         │
├──────────────────────────────────────────────────────────┤
│                  Category Breakdown (table)               │  ← REMOVE table
└──────────────────────────────────────────────────────────┘
```

### New Layout

```
┌──────────────────────────────────────────────────────────┐
│                     Financials Tab                        │
├──────────────────────────────────────────────────────────┤
│                    Profit Calculator                      │
├──────────────────────────────────────────────────────────┤
│                    Export Reports                         │
└──────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/pages/ProjectDetail.tsx`**

| Change | Lines |
|--------|-------|
| Remove SpendingChart import | Line 43 |
| Remove 2-column grid and SpendingChart | Lines 553-562 |
| Remove Category Breakdown Card | Lines 580-619 |
| Remove Table component import (if unused elsewhere) | Line 26 |

---

### Code Changes

1. **Remove import** (line 43):
   ```typescript
   // Remove this line
   import { SpendingChart } from '@/components/project/SpendingChart';
   ```

2. **Simplify Financials TabsContent** (lines 552-620):
   
   **Before:**
   ```typescript
   <TabsContent value="financials" className="space-y-6">
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <ProfitCalculator ... />
       <SpendingChart ... />
     </div>
     <ExportReports ... />
     <Card className="glass-card">
       {/* Category Breakdown table */}
     </Card>
   </TabsContent>
   ```
   
   **After:**
   ```typescript
   <TabsContent value="financials" className="space-y-6">
     <ProfitCalculator 
       projectId={id!}
       totalBudget={totalBudget}
       totalSpent={totalSpent}
       initialPurchasePrice={project.purchase_price || 0}
       initialArv={project.arv || 0}
     />
     <ExportReports 
       project={{...}}
       categories={categories}
       expenses={allExpensesForExport}
     />
   </TabsContent>
   ```

3. **Check Table import** - If no other tab uses `Table`, `TableBody`, etc., remove from imports (line 26). Otherwise keep it.

---

### Files Affected

| File | Change |
|------|--------|
| `src/pages/ProjectDetail.tsx` | Remove SpendingChart + Category Breakdown table |

### Result

The Financials tab will show only:
1. **Profit Calculator** - Purchase price, ARV, profit metrics
2. **Export Reports** - CSV download options

No more duplicate category information (chart + table).

