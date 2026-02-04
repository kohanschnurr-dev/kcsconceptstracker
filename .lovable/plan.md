

## Plan: Redesign Category Breakdown into Visual Cube Grid

### Overview
Transform the current flat category pills into a visually appealing cube/card-style grid layout. Each category will be displayed as a small card showing both the category name and the spent amount with clear visual hierarchy.

---

### Current State
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Category Breakdown                                       [Clear filter] │
│                                                                          │
│ [Online Course...$1k] [Continuing Ed...$747] [Subscriptions $737] ...   │
│ [Gas and Miles...$58] [Cloud Storage...$8]                               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Problem:** Pills are cramped, text gets truncated, amounts are hard to read

---

### New Design - Category Cubes

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Category Breakdown                                       [Clear filter] │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│ │ Online        │ │ Continuing    │ │ Subscriptions │ │ Licensing &   │ │
│ │ Courses       │ │ Education     │ │               │ │ Fees          │ │
│ │               │ │               │ │               │ │               │ │
│ │     $1,000    │ │      $747     │ │      $737     │ │      $259     │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│ │ CRM or        │ │ Misc          │ │ Gas & Mileage │ │ Cloud Storage │ │
│ │ Business      │ │               │ │               │ │               │ │
│ │               │ │               │ │               │ │               │ │
│ │      $152     │ │       $89     │ │       $58     │ │        $8     │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/components/dashboard/BusinessExpensesDashboard.tsx`**

1. **Replace badge-based pills with a cube grid:**
   - Use `grid grid-cols-4 gap-2` for desktop, `grid-cols-2` for smaller screens
   - Each cube is a clickable card with category name on top and amount below
   
2. **Cube card styling:**
   - Fixed minimum height for visual consistency
   - Subtle border with hover effect
   - Category label at top (with text wrapping allowed)
   - Amount prominently displayed at bottom in monospace font
   - Selected state with primary border/background highlight

3. **Responsive adjustments:**
   - 4 columns on larger screens, 2 columns on smaller
   - Scrollable area with max-height if many categories

---

### Component Structure

```tsx
{/* Category Cubes Grid */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
  {categoryData.map((cat) => (
    <button
      key={cat.categoryKey}
      onClick={() => onCategoryClick(cat.categoryKey)}
      className={cn(
        "flex flex-col justify-between p-3 rounded-lg border min-h-[70px] text-left transition-all",
        "hover:border-primary/50 hover:bg-primary/5",
        selectedCategory === cat.categoryKey 
          ? "border-primary bg-primary/10" 
          : "border-border/30 bg-muted/20"
      )}
    >
      <span className="text-xs text-muted-foreground line-clamp-2">
        {cat.label}
      </span>
      <span className="text-sm font-semibold font-mono text-foreground">
        {formatCurrency(cat.amount)}
      </span>
    </button>
  ))}
</div>
```

---

### Visual Styling Details

| Element | Style |
|---------|-------|
| Cube container | `border-border/30 bg-muted/20 rounded-lg` |
| Cube size | `min-h-[70px] p-3` for comfortable touch targets |
| Category text | `text-xs text-muted-foreground line-clamp-2` (allows 2 lines) |
| Amount text | `text-sm font-semibold font-mono` (prominent, monospace) |
| Hover state | `border-primary/50 bg-primary/5` |
| Selected state | `border-primary bg-primary/10` (matching existing patterns) |
| Grid | `grid-cols-2 md:grid-cols-4 gap-2` |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/BusinessExpensesDashboard.tsx` | Replace badge pills with cube grid layout |

---

### Expected Result
- Categories displayed as clean, equal-sized cubes in a grid
- Full category names visible (up to 2 lines)
- Amounts prominently displayed and easy to read
- Clickable for filtering with clear selected state
- Visually balanced and professional dark mode aesthetic

