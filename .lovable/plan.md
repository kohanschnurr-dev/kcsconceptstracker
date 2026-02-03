
## Plan: Auto-populate Sqft on Template Switch + Default Template Star

### Overview
1. Add `sqft` and `is_default` columns to the `budget_templates` table
2. When switching budgets, auto-populate the sqft field from the saved template
3. Add a star icon to mark a template as the default startup budget
4. Auto-load the default template when the Budget Calculator page loads

---

### Database Changes

**Add to `budget_templates` table:**

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `sqft` | integer | null | Square footage saved with template |
| `is_default` | boolean | false | Whether this is the default startup template |

**Constraint**: Only one template per user can be `is_default = true`. When setting a new default, the old one must be unset.

---

### User Flow

**Setting Default:**
1. User hovers over a saved budget in the dropdown
2. A star icon appears next to the budget name
3. Click the star to set as default (filled star = default)
4. Only one default allowed per user

**On Page Load:**
1. Check if user has a default template
2. If yes, auto-load that template including sqft
3. If no, start blank

---

### UI Changes

**TemplatePicker Dropdown:**
```text
Your Saved Budgets
┌─────────────────────────────────────────┐
│ ★ High Level (1,800 sqft)      $48,150 │  ← Filled star = default
│ ☆ Standard Flip                $35,000 │  ← Empty star = not default
│ ☆ Light Refresh                $22,000 │
└─────────────────────────────────────────┘
```

---

### File Changes

| File | Changes |
|------|---------|
| `supabase/migrations/` | Add `sqft` and `is_default` columns to `budget_templates` |
| `src/pages/BudgetCalculator.tsx` | Save sqft with template, load sqft when selecting template, auto-load default on mount |
| `src/components/budget/TemplatePicker.tsx` | Display star icons, handle set default click |

---

### Technical Details

#### 1. Database Migration

```sql
-- Add sqft column
ALTER TABLE budget_templates ADD COLUMN sqft integer;

-- Add is_default column with constraint
ALTER TABLE budget_templates ADD COLUMN is_default boolean DEFAULT false;

-- Create function to ensure only one default per user
CREATE OR REPLACE FUNCTION ensure_single_default_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE budget_templates 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER ensure_single_default_budget_trigger
BEFORE INSERT OR UPDATE ON budget_templates
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_budget();
```

---

#### 2. BudgetCalculator.tsx Changes

**Update `handleSelectTemplate` to load sqft:**
```typescript
const handleSelectTemplate = (template: BudgetTemplate | null) => {
  if (!template) {
    handleClearAll();
    return;
  }

  setBudgetName(template.name);
  setBudgetDescription(template.description || '');
  setPurchasePrice(template.purchase_price?.toString() || '');
  setArv(template.arv?.toString() || '');
  setSqft(template.sqft?.toString() || '');  // ADD THIS
  setCurrentTemplateName(template.name);
  // ... rest unchanged
};
```

**Update `handleSave` to include sqft:**
```typescript
const templateData = {
  user_id: user.id,
  name: budgetName.trim(),
  description: budgetDescription.trim() || null,
  purchase_price: parseFloat(purchasePrice) || 0,
  arv: parseFloat(arv) || 0,
  sqft: parseInt(sqft) || null,  // ADD THIS
  category_budgets: getCategoryBudgetsObject(),
};
```

**Add auto-load default on mount:**
```typescript
useEffect(() => {
  const loadDefaultTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('budget_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (data) {
      handleSelectTemplate(data);
    }
  };

  loadDefaultTemplate();
}, []);
```

---

#### 3. TemplatePicker.tsx Changes

**Update BudgetTemplate interface:**
```typescript
interface BudgetTemplate {
  id: string;
  name: string;
  description: string | null;
  purchase_price: number;
  arv: number;
  sqft: number | null;  // ADD
  is_default: boolean;  // ADD
  category_budgets: Record<string, number>;
  total_budget: number;
}
```

**Add set default handler:**
```typescript
const handleSetDefault = async (e: React.MouseEvent, templateId: string) => {
  e.stopPropagation();
  
  const { error } = await supabase
    .from('budget_templates')
    .update({ is_default: true })
    .eq('id', templateId);

  if (!error) {
    // Refresh templates
    setSavedTemplates(prev => prev.map(t => ({
      ...t,
      is_default: t.id === templateId
    })));
    toast.success('Default template set');
  }
};
```

**Add star icon to template items:**
```tsx
{savedTemplates.map((template) => (
  <DropdownMenuItem key={template.id} onClick={() => onSelectTemplate(template)}>
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => handleSetDefault(e, template.id)}
          className="hover:text-amber-400"
        >
          {template.is_default ? (
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          ) : (
            <Star className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
        <span className="font-medium truncate">{template.name}</span>
      </div>
      <span className="text-xs font-mono text-muted-foreground">
        {formatCurrency(total)}
      </span>
    </div>
  </DropdownMenuItem>
))}
```

---

### Result

| Feature | Behavior |
|---------|----------|
| Switch templates | Sqft auto-populates from saved value |
| Save template | Sqft is saved along with other fields |
| Star icon | Click to set as default startup |
| Page load | Default template (if set) auto-loads |
