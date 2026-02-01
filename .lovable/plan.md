

## Plan: Remove Cost-to-Complete Section

### Problem
The "Cost-to-Complete by Category" card in the Procurement tab is adding clutter to the interface.

### Solution
Remove the entire "Cost-to-Complete by Category" card component from the ProcurementTab.

### Changes

**File: `src/components/project/ProcurementTab.tsx`**

Delete lines 506-543 which contain:

```tsx
{/* Cost-to-Complete by Category */}
{categories.length > 0 && items.length > 0 && (
  <Card className="glass-card">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">Cost-to-Complete by Category</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {categories
          .filter(cat => totals.byCategoryId[cat.id]?.procured > 0 || cat.actualSpent > 0)
          .slice(0, 5)
          .map(cat => {
            // ... progress bar rendering
          })}
      </div>
    </CardContent>
  </Card>
)}
```

### Result
- The Procurement tab will have a cleaner layout
- The category budget tracking remains available in the Budget tab

