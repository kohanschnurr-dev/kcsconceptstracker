
## Keep Deal Parameters When Applying a Template

### Problem
When selecting a template from the Template Picker, the `handleSelectTemplate` function overwrites Purchase Price, ARV, and Square Footage with the template's saved values. This prevents the user from testing different rehab budgets against the same deal parameters.

### Change in `src/pages/BudgetCalculator.tsx`

**Update `handleSelectTemplate` to skip deal parameter fields.**

Remove these lines from the function:
```
setPurchasePrice(template.purchase_price?.toString() || '');
setArv(template.arv?.toString() || '');
setSqft(template.sqft?.toString() || '');
```

Keep only:
- `setBudgetName(template.name)` -- so the user knows which template is loaded
- `setBudgetDescription(template.description || '')`
- `setCurrentTemplateName(template.name)`
- Category budgets loading (the `newBudgets` loop)

This way, Purchase Price, ARV, and Square Footage remain whatever the user has already entered, and only the rehab category budgets swap out when picking a different template.

### What stays the same
- The default template auto-load on mount still populates everything (including deal params) since that's the initial state.
- The "Clear All" button still resets everything.
- Saving a template still captures the current deal parameters for storage.
