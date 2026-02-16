

## Fix Budget Save (Upsert) and Restore Deal Parameters

### Problem 1: Duplicate Name Error
When saving a budget with an existing name, the system always does an `INSERT`, causing a database error instead of updating the existing record.

### Problem 2: Purchase Price, ARV, SQFT Not Restored
When clicking a saved budget from the template picker, `purchasePrice`, `arv`, and `sqft` are NOT restored. The `handleSelectTemplate` function sets the budget name and description but skips these three fields (even though `loadDefaultTemplate` correctly restores them).

---

### Fix 1: Upsert Logic in `handleSave`

**File: `src/pages/BudgetCalculator.tsx`** (~lines 333-359)

Before inserting, query for an existing template with the same name and user. If found, update that row. If not, insert a new one. Also recalculate `total_budget` on save.

```
Logic:
1. Query budget_templates WHERE user_id = user.id AND name = trimmedName
2. If a match exists -> UPDATE that row
3. If no match -> INSERT new row
4. Update currentTemplateName on success
```

### Fix 2: Restore PP/ARV/SQFT in `handleSelectTemplate`

**File: `src/pages/BudgetCalculator.tsx`** (~lines 232-234)

Add the three missing lines to restore deal parameters from the template object (same as `loadDefaultTemplate` already does):

```
setPurchasePrice(template.purchase_price?.toString() || '');
setArv(template.arv?.toString() || '');
setSqft(template.sqft?.toString() || '');
```

These fields are already saved in the database columns (`purchase_price`, `arv`, `sqft`) by `handleSave`, so no changes needed on the save side for this fix.

---

### Files Changed
- `src/pages/BudgetCalculator.tsx` only (two edits)

