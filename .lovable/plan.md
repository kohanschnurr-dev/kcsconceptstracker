
## Plan: Move Category Dropdown Next to Unit Price and Quantity

### Overview

Relocate the category selector from the top of the Edit Item modal (currently a static badge with "Change" button) to a dropdown in the form grid, positioned next to the Unit Price and Quantity fields. This allows editing the category directly without navigating back to the category selection step.

---

### Current Layout

The modal shows category as a static badge at the top:
```
[✓ Bathroom] [Change]

Item Name *
[________________________]

BATHROOM SPECIFICATIONS
...
```

### New Layout

Move category into the pricing row area:
```
Item Name *
[________________________]

BATHROOM SPECIFICATIONS
...

Category             Unit Price *
[Dropdown v]         [$ 53.76]

Quantity
[1]
```

---

### Technical Implementation

**File: `src/components/procurement/ProcurementItemModal.tsx`**

**1. Remove the static category badge section (lines 813-827)**

Remove this entire block:
```tsx
{/* Category Badge */}
{selectedCategory && (
  <div className="flex items-center gap-2">
    <Badge className={cn('gap-1', selectedCategory.color)}>
      <selectedCategory.icon className="h-3 w-3" />
      {selectedCategory.label}
    </Badge>
    {!item && (
      <Button variant="ghost" size="sm" onClick={() => setStep('category')} className="h-6 text-xs">
        <ArrowLeft className="h-3 w-3 mr-1" />
        Change
      </Button>
    )}
  </div>
)}
```

**2. Add a Category dropdown in the grid (near lines 936-960)**

Add the dropdown before or alongside the Unit Price field:

```tsx
{/* Category */}
<div>
  <Label>Category</Label>
  <Select 
    value={formData.category} 
    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as ProcurementCategory }))}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent className="max-h-[300px]">
      {PROCUREMENT_CATEGORIES.map(cat => (
        <SelectItem key={cat.value} value={cat.value}>
          <div className="flex items-center gap-2">
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**3. Reorder form fields**

Current order in grid:
- Finish / Color | Unit Price *
- Quantity | Notes (col-span-2)

New order:
- Finish / Color | Unit Price *
- Category | Quantity

This puts Category dropdown next to Quantity, near the pricing fields as requested.

---

### Changes Summary

| Location | Change |
|----------|--------|
| Lines 813-827 | Remove static category badge display |
| Lines 961-974 | Add Category dropdown next to Quantity field |

---

### Result

- Category becomes an editable dropdown in the form
- Positioned alongside Unit Price and Quantity for easy editing
- Works for both Add and Edit scenarios
- Dropdown sorted alphabetically with icons for each category
- Max height 300px with scrolling for long category list
