
## Plan: Remove Dashboard Charts Section

### Overview
Remove the "Spending by Category" donut chart and "Last 7 Days" spending trend chart from the main dashboard to create a cleaner, more focused view.

---

### Current State
The dashboard currently shows two large charts at the bottom:
- **Spending by Category** - Donut chart showing expense breakdown
- **Last 7 Days** - Area chart showing daily spending trend

These take up significant space and duplicate information available in other pages (Expenses, Project Budget).

---

### Changes

**`src/pages/Index.tsx`**

1. **Remove unused imports** (lines 7-8):
   - `SpendingDonutChart`
   - `SpendingTrendChart`

2. **Remove unused variables** (lines 197-205):
   - `allCategories` - no longer needed
   - `chartExpenses` - no longer needed

3. **Remove the charts section** (lines 303-312):
   ```tsx
   {/* Charts Section */}
   {expenses.length > 0 && (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <SpendingDonutChart ... />
       <SpendingTrendChart ... />
     </div>
   )}
   ```

---

### Result

The dashboard will focus on:
- Tasks Due Today banner
- Quick Task Input
- Stats cards (This Month + Total Budget)
- Active Projects grid

This creates a cleaner, action-oriented dashboard without redundant charts.
