

## Plan: Add Product/Labor Toggle to Quick Log Expense Modal

### Overview

Add an expense type toggle (Product vs Labor) to the Quick Log Expense modal, matching the existing pattern used in SmartSplit and QuickBooks components. The `expense_type` field already exists in the database.

---

### Technical Changes

**File: `src/components/QuickExpenseModal.tsx`**

#### Change 1: Add Import for Icons and ToggleGroup (Lines 1-31)

Add `Package` and `Wrench` icons from lucide-react, and import `ToggleGroup` and `ToggleGroupItem` components:

```typescript
import { Camera, DollarSign, X, Upload, Loader2, FileText, Sparkles, Package, Wrench } from 'lucide-react';
```

And add:
```typescript
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
```

#### Change 2: Add Expense Type State (Around Line 56)

Add state for expense type after the existing state declarations:

```typescript
const [expenseType, setExpenseType] = useState<'product' | 'labor'>('product');
```

#### Change 3: Add Toggle UI (After Category Select, Around Lines 340-343)

Add a Product/Labor toggle group below the Project and Category row, styled consistently with the rest of the form:

```typescript
{/* Expense Type Toggle */}
<div className="flex items-center gap-3">
  <Label className="text-sm">Type:</Label>
  <ToggleGroup
    type="single"
    value={expenseType}
    onValueChange={(value) => value && setExpenseType(value as 'product' | 'labor')}
    className="justify-start"
  >
    <ToggleGroupItem value="product" size="sm" className="gap-1">
      <Package className="h-3 w-3" />
      Product
    </ToggleGroupItem>
    <ToggleGroupItem value="labor" size="sm" className="gap-1">
      <Wrench className="h-3 w-3" />
      Labor
    </ToggleGroupItem>
  </ToggleGroup>
</div>
```

#### Change 4: Include expense_type in Database Insert (Lines 216-230)

Update the expense insert to include the `expense_type` field:

```typescript
const { error } = await supabase
  .from('expenses')
  .insert({
    project_id: selectedProject,
    category_id: categoryId,
    amount: calculateTotal(),
    vendor_name: vendor,
    description: description || null,
    payment_method: paymentMethod,
    status: 'actual',
    includes_tax: includeTax,
    tax_amount: includeTax ? calculateTax() : null,
    date: date,
    receipt_url: receiptUrl,
    expense_type: expenseType,  // <-- Add this line
  });
```

---

### Visual Result

The modal will now include a Product/Labor toggle between the Category dropdown and the Amount field:

```text
┌─────────────────────────────────────────┐
│  Project: [Wales Rental ▼]  Category: [Painting ▼]  │
│                                         │
│  Type:  [📦 Product] [🔧 Labor]         │  <-- NEW
│                                         │
│  Amount: [$2900]         Date: [02/04]  │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/QuickExpenseModal.tsx` | Import Package, Wrench icons and ToggleGroup components |
| `src/components/QuickExpenseModal.tsx` | Add `expenseType` state with 'product' default |
| `src/components/QuickExpenseModal.tsx` | Add ToggleGroup UI for Product/Labor selection |
| `src/components/QuickExpenseModal.tsx` | Include `expense_type` in database insert |

---

### No Database Changes Needed

The `expense_type` column already exists in the `expenses` table (nullable string), so no migration is required.

