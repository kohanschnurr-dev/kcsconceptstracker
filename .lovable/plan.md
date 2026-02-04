
## Plan: Enhance Expenses Search to Include Amount, Project, Category, etc.

### Current State
The search bar currently only filters by:
- Vendor name
- Description

### Enhancement
Expand the search to also match:
- **Amount** (e.g., typing "$500" or "500" finds expenses with that amount)
- **Project name** (resolved from project ID)
- **Category label** (resolved from category ID)  
- **Notes**
- **Payment method** (cash, card, check, transfer)

---

### Technical Changes

**File: `src/pages/Expenses.tsx`**

Update the `filteredExpenses` useMemo to include additional search fields:

```typescript
const filteredExpenses = useMemo(() => {
  return expenses.filter((expense) => {
    const searchLower = search.toLowerCase().replace(/[$,]/g, ''); // Strip $ and commas for amount search
    
    // Get resolved names for searching
    const projectName = getProjectName(expense.project_id).toLowerCase();
    const categoryLabel = getCategoryLabel(expense.category_id, expense.project_id).toLowerCase();
    const amountStr = expense.amount.toString();
    
    const matchesSearch = 
      !search || // If no search, match everything
      (expense.vendor_name?.toLowerCase() || '').includes(searchLower) ||
      (expense.description?.toLowerCase() || '').includes(searchLower) ||
      (expense.notes?.toLowerCase() || '').includes(searchLower) ||
      (expense.payment_method?.toLowerCase() || '').includes(searchLower) ||
      projectName.includes(searchLower) ||
      categoryLabel.includes(searchLower) ||
      amountStr.includes(searchLower);
    
    // ... rest of filters remain the same
  });
}, [expenses, search, projectFilter, categoryFilter, dateRange, projects]);
```

Also update the placeholder text to indicate expanded search capabilities:

```typescript
<Input
  placeholder="Search vendor, amount, project..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="pl-9"
/>
```

---

### Search Behavior Examples

| Search Term | Matches |
|-------------|---------|
| `home depot` | Vendor name contains "home depot" |
| `500` | Amount contains "500" ($500.00, $5,000, etc.) |
| `$3,200` | Amount 3200 (strips $ and comma) |
| `wales` | Project name "Wales Rental" |
| `hvac` | Category "HVAC" |
| `cash` | Payment method "Cash" |
| `bathroom` | Category "Bathroom" |
| `insurance` | Vendor or category containing "insurance" |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Expenses.tsx` | Expand `matchesSearch` logic to include amount, project name, category, notes, and payment method |

---

### Notes
- The amount search strips `$` and `,` characters so users can type "$500" or "500" and get the same results
- Project and category names are resolved using existing helper functions before matching
- All matches are case-insensitive
