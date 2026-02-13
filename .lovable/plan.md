

## Reset All Filters When Clicking a Cost-Type Card

### Problem
When clicking a cost-type card (e.g., "Holding Costs"), any previously active filters (like a specific category or date range) remain applied, which hides relevant expenses and creates confusion.

### Solution
Update `handleCardFilter` to reset all other filters (category, search, payment method, date range) back to defaults whenever a cost-type card is clicked. This ensures the user sees all expenses of that cost type without any leftover filters.

### Technical Change

**`src/pages/ProjectBudget.tsx` (lines 173-178)** -- Update `handleCardFilter`:

```typescript
const handleCardFilter = (costType: string) => {
  setSelectedCostType(prev => prev === costType ? 'all' : costType);
  // Reset all other filters so only the cost type filter is active
  setSearchQuery('');
  setSelectedCategory('all');
  setSelectedPaymentMethod('all');
  setDateRange('all');
  setTimeout(() => {
    expensesTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
};
```

This is a single, minimal change -- no other files are affected.

