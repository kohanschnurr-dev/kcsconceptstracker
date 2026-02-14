

## Move Export Button Next to Expense Summary

### Problem
The Export button sits in the page header far from the expense count/total summary, making it unclear what data is being exported.

### Changes

**`src/pages/Expenses.tsx`**

1. **Remove the Export button from the page header** (around line 250-253): Delete the Export button from the top-right button group, leaving only "Add Expense".

2. **Add the Export button next to the summary line** (around line 302-306): Place it inline with "54 expenses . $26,709.94" in the table header bar, just before the summary text.

The summary section currently looks like:
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
  <span>{filteredExpenses.length} expenses</span>
  <span>•</span>
  <span className="font-mono font-medium">{formatCurrency(totalExpenses)}</span>
</div>
```

It will become:
```tsx
<div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
  <span>{filteredExpenses.length} expenses</span>
  <span>•</span>
  <span className="font-mono font-medium">{formatCurrency(totalExpenses)}</span>
  <Button variant="ghost" size="sm" className="gap-1 h-7 ml-1" onClick={exportToCSV}>
    <Download className="h-3.5 w-3.5" />
    Export
  </Button>
</div>
```

This places the export action directly beside the data summary so users know exactly what they're exporting.
