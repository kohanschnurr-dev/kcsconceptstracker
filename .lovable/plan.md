

## Fix: Split Receipt Import by Category

### Problem
The SmartSplit system shows individual line items with their categories, but when you click "Match & Import", it creates **one expense record** using only the first category. All items get lumped together under "Bathroom" instead of being split into separate expenses per category.

---

### Root Cause

In `SmartSplitReceiptUpload.tsx`, the `finalizeImport` function (lines 404-495) does this:

```typescript
// Line 416-418: Only uses the FIRST category
const primaryCategory = (editableCategories[0] || 
  selectedMatch.receipt.line_items?.[0]?.suggested_category || 
  'misc') as BudgetCategory;

// Line 456-468: Creates ONE expense record with that category
await supabase.from('quickbooks_expenses').update({
  is_imported: true,
  category_id: categoryId,  // Single category for entire $671.60
  ...
})
```

---

### Solution

**Group line items by category**, then create **multiple expense records** - one for each category with its proportional share of the total amount.

Example for your $671.60 Amazon receipt:
| Category | Items | Amount |
|----------|-------|--------|
| Bathroom | Accessories Set, Towel Bars | $120.00 |
| Electrical | Light Switch, Outlet Covers | $89.97 |
| Hardware | Door Hinges, Screws | $45.00 |
| Lighting | LED Bulbs | $55.99 |
| ... | ... | ... |

Each category becomes a **separate row** in `quickbooks_expenses`.

---

### Implementation

**File:** `src/components/SmartSplitReceiptUpload.tsx`

#### Step 1: Add helper to group items by category

```typescript
// Group line items by their assigned category
const groupByCategory = (lineItems: LineItem[], categories: Record<number, string>) => {
  const groups: Record<string, { items: LineItem[], total: number }> = {};
  
  lineItems.forEach((item, idx) => {
    const category = categories[idx] || item.suggested_category || 'misc';
    if (!groups[category]) {
      groups[category] = { items: [], total: 0 };
    }
    groups[category].items.push(item);
    groups[category].total += item.total_price;
  });
  
  return groups;
};
```

#### Step 2: Modify `finalizeImport` to create multiple expense records

Replace the single-category logic with:

```typescript
const finalizeImport = async () => {
  if (!selectedMatch || !selectedProject) return;
  setIsImporting(true);

  try {
    // Group line items by category
    const categoryGroups = groupByCategory(
      selectedMatch.receipt.line_items || [],
      editableCategories
    );

    // Calculate tax per category (proportional)
    const subtotal = selectedMatch.receipt.subtotal || 
      selectedMatch.receipt.line_items?.reduce((sum, i) => sum + i.total_price, 0) || 0;
    const taxAmount = selectedMatch.receipt.tax_amount || 0;

    // Track the original QB expense ID
    const originalQbExpenseId = selectedMatch.qbExpense.id;
    const originalQbId = selectedMatch.qbExpense.qb_id;

    // Create expense record for each category
    for (const [category, group] of Object.entries(categoryGroups)) {
      // Calculate proportional tax
      const proportion = subtotal > 0 ? group.total / subtotal : 0;
      const categoryTax = Math.round(taxAmount * proportion * 100) / 100;
      const categoryAmount = group.total + categoryTax;

      // Build notes from items in this category
      const itemNotes = group.items
        .map(item => `${item.item_name} (${item.quantity}x)`)
        .join(', ');

      // Find or create project_category
      const { data: existingCategory } = await supabase
        .from('project_categories')
        .select('id')
        .eq('project_id', selectedProject)
        .eq('category', category)
        .maybeSingle();

      let categoryId: string;
      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const { data: newCategory, error } = await supabase
          .from('project_categories')
          .insert({ project_id: selectedProject, category, estimated_budget: 0 })
          .select('id')
          .single();
        if (error) throw error;
        categoryId = newCategory.id;
      }

      // Create a new expense record for this category
      // First one updates the original, rest are inserts
      if (Object.keys(categoryGroups).indexOf(category) === 0) {
        // Update original QB expense
        await supabase
          .from('quickbooks_expenses')
          .update({
            is_imported: true,
            amount: categoryAmount,
            category_id: categoryId,
            project_id: selectedProject,
            expense_type: expenseType,
            notes: itemNotes,
            receipt_url: selectedMatch.receipt.receipt_image_url,
          })
          .eq('id', originalQbExpenseId);
      } else {
        // Insert additional expense records
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('quickbooks_expenses')
          .insert({
            user_id: user!.id,
            qb_id: `${originalQbId}_split_${category}`,
            vendor_name: selectedMatch.qbExpense.vendor_name,
            amount: categoryAmount,
            date: selectedMatch.qbExpense.date,
            description: selectedMatch.qbExpense.description,
            is_imported: true,
            project_id: selectedProject,
            category_id: categoryId,
            expense_type: expenseType,
            notes: itemNotes,
            receipt_url: selectedMatch.receipt.receipt_image_url,
          });
      }
    }

    // Mark receipt as imported
    await supabase
      .from('pending_receipts')
      .update({ status: 'imported' })
      .eq('id', selectedMatch.receipt.id);

    toast({
      title: 'Expenses imported!',
      description: `Split ${Object.keys(categoryGroups).length} categories across project.`,
    });

    // Cleanup and refresh...
  } catch (error) { ... }
};
```

---

### Visual Flow

```text
Before Import:
┌─────────────────────────────────────────┐
│ QuickBooks: Amazon $671.60              │
└─────────────────────────────────────────┘

After Import (Current - WRONG):
┌─────────────────────────────────────────┐
│ Expense: Amazon | Bathroom | $671.60    │
└─────────────────────────────────────────┘

After Import (Fixed - CORRECT):
┌─────────────────────────────────────────┐
│ Expense: Amazon | Bathroom  | $120.00   │
├─────────────────────────────────────────┤
│ Expense: Amazon | Electrical| $89.97    │
├─────────────────────────────────────────┤
│ Expense: Amazon | Hardware  | $45.00    │
├─────────────────────────────────────────┤
│ Expense: Amazon | Lighting  | $55.99    │
├─────────────────────────────────────────┤
│ ... (more categories)                   │
└─────────────────────────────────────────┘
```

---

### Edge Cases Handled

1. **Tax Distribution**: Tax is split proportionally across categories
2. **Single Category**: If all items have same category, creates one expense (no change)
3. **Missing Categories**: Falls back to 'misc'
4. **QB ID Uniqueness**: Split records get `{original_id}_split_{category}` to avoid conflicts

---

### Summary of Changes

| Location | Change |
|----------|--------|
| Lines 403-406 | Add `groupByCategory` helper function |
| Lines 404-495 | Rewrite `finalizeImport` to loop through category groups |
| New logic | Calculate proportional tax per category |
| New logic | Create multiple QB expense records (update first, insert rest) |

---

### Expected Results

- Each category from the receipt becomes a separate expense row
- Budget breakdown shows accurate spending per category
- Tax is distributed proportionally
- All expenses link back to the same receipt image

