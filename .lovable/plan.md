

## Plan: Make Business Expenses Dashboard Collapsible

### Overview
Add a collapsible wrapper around the entire BusinessExpensesDashboard (both the 30-Day Spending sparkline and Category Breakdown cards), following the same pattern as the Expenses table and Budget Calculator.

---

### Current State
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [30-Day Spending Card]           [Category Breakdown Card]                 │
│  $3,045 | Sparkline               [Category Cubes Grid]                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

Dashboard cards are always visible with no way to collapse them.

---

### New Design
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [▼] Dashboard Overview    [$3,045 total | 8 categories]      [Clear filter]│
├─────────────────────────────────────────────────────────────────────────────┤
│  [30-Day Spending Card]           [Category Breakdown Card]                 │
│  $3,045 | Sparkline               [Category Cubes Grid]                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

When collapsed:
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [▶] Dashboard Overview    [$3,045 total | 8 categories]      [Clear filter]│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Technical Changes

**File: `src/components/dashboard/BusinessExpensesDashboard.tsx`**

1. **Add imports:**
   - Import `useState` from React
   - Import `Collapsible, CollapsibleTrigger, CollapsibleContent` from ui/collapsible
   - Import `ChevronDown` from lucide-react

2. **Add state:**
   ```typescript
   const [isOpen, setIsOpen] = useState(true); // default expanded
   ```

3. **Wrap entire component in Collapsible:**
   - Use `glass-card` for the outer container
   - Header row with toggle chevron, title, summary stats, and clear filter button
   - CollapsibleContent wraps the existing grid of cards

4. **Header shows summary when collapsed:**
   - Total spent (last 30 days)
   - Category count
   - Clear filter button (if filter active)

---

### Component Structure

```tsx
return (
  <Collapsible open={isOpen} onOpenChange={setIsOpen}>
    <div className="glass-card">
      {/* Collapsible Header */}
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors">
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          <span className="text-sm font-medium">Dashboard Overview</span>
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="font-mono">
              {formatCurrency(last30DaysTotal)}
            </Badge>
            <Badge variant="outline">
              {categoryData.length} categories
            </Badge>
            {selectedCategory !== 'all' && (
              <button onClick={(e) => { e.stopPropagation(); onCategoryClick('all'); }}>
                Clear filter
              </button>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Collapsible Content - the existing grid */}
      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">
          {/* Sparkline Card */}
          {/* Category Cubes Card */}
        </div>
      </CollapsibleContent>
    </div>
  </Collapsible>
);
```

---

### Visual Details

| Element | Style |
|---------|-------|
| Outer container | `glass-card` (consistent with other sections) |
| Header row | `p-4 cursor-pointer hover:bg-muted/30` |
| Chevron | `h-4 w-4 transition-transform`, rotates -90deg when collapsed |
| Title | `text-sm font-medium` |
| Total badge | `variant="secondary" font-mono` |
| Category count badge | `variant="outline"` |
| Content padding | `p-4 pt-0` (removes top padding since header provides spacing) |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/BusinessExpensesDashboard.tsx` | Wrap in Collapsible, add header with summary, add state |

---

### Expected Result
- Dashboard section can be collapsed/expanded with smooth animation
- Collapsed state shows summary (total + category count) for quick reference
- Clear filter button remains accessible in header
- Follows same pattern as Expenses table collapsible section
- Default state is expanded (as per project convention)

