
## Plan: Auto-Calculate Category Presets on Sqft Entry

### Overview

Replace the inefficient popover-based presets with an automatic calculation system. When the user enters sqft in Deal Parameters, categories with defined presets will auto-populate their budget values instantly. The "Presets" popover will be replaced with a simpler "Edit Rates" button for customization.

---

### Current vs New Workflow

```text
CURRENT (6+ clicks):
1. Enter sqft in Deal Parameters
2. Open Presets popover
3. Click Apply on Painting
4. Click Apply on Flooring
5. Click Apply on Tile
6. Click Apply on Drywall
7. Click Apply on Roofing
8. Close popover

NEW (1 action):
1. Enter sqft in Deal Parameters → Categories auto-populate!
```

---

### UI Changes

**Before:**
```text
┌─────────────────────────────────────────┐
│ Collapse All    [Presets ▼]             │
├─────────────────────────────────────────┤
│ Structure                               │
│   Drywall  [$ ___]   Roofing  [$ ___]   │
│ Finishes                                │
│   Painting [$ ___]   Flooring [$ ___]   │
│   Tile     [$ ___]                      │
└─────────────────────────────────────────┘
```

**After:**
```text
┌─────────────────────────────────────────┐
│ Collapse All    [Edit Rates ⚙]          │
├─────────────────────────────────────────┤
│ Structure                               │
│   Drywall  [$ 3,750]✦  Roofing [$ 7,500]✦│
│ Finishes                                │
│   Painting [$ 5,250]✦  Flooring [$ 12,000]✦│
│   Tile     [$ 18,000]✦                  │
└─────────────────────────────────────────┘

✦ = Auto-calculated indicator (subtle dot or different styling)
```

---

### Behavior

1. **Auto-populate on sqft entry**: When sqft changes and is > 0, automatically calculate and fill preset categories
2. **Clear on sqft removal**: When sqft is cleared or set to 0, optionally clear preset categories (or keep values)
3. **Manual override respected**: If user manually edits a preset category's value, it stays until next sqft change
4. **Visual indicator**: Categories with active presets show a subtle indicator (small dot or background tint)

---

### Changes Summary

| File | Changes |
|------|---------|
| `src/components/budget/BudgetCanvas.tsx` | Remove Popover, add useEffect to auto-calculate presets when sqft changes, add Edit Rates dialog trigger |
| `src/components/budget/BudgetCategoryCard.tsx` | Add optional `hasPreset` prop for visual indicator |

---

### Technical Details

#### 1. BudgetCanvas.tsx - Auto-Calculate on Sqft Change

**Replace the popover with a useEffect:**
```typescript
// Auto-calculate presets when sqft changes
useEffect(() => {
  const sqftNum = parseFloat(sqft) || 0;
  if (sqftNum > 0) {
    presets.forEach(preset => {
      const calculated = sqftNum * preset.pricePerSqft;
      onCategoryChange(preset.category, calculated.toFixed(2));
    });
  }
}, [sqft]); // Only trigger on sqft change
```

**Replace Presets button with Edit Rates button:**
```tsx
<button
  onClick={() => setIsEditDialogOpen(true)}
  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-4"
>
  <Settings className="h-3.5 w-3.5" />
  Edit Rates
</button>
```

**Keep the Edit Dialog** for customizing $/sqft rates, but remove:
- The Popover component entirely
- Individual "Apply" buttons
- "Apply All" button
- `isPresetsOpen` state

---

#### 2. BudgetCategoryCard.tsx - Visual Indicator for Preset Categories

**Add optional prop:**
```typescript
interface BudgetCategoryCardProps {
  category: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  hasPreset?: boolean; // NEW
}
```

**Show subtle indicator:**
```tsx
<span className="text-xs truncate flex-1 min-w-0" title={label}>
  {label}
  {hasPreset && (
    <span className="ml-1 text-primary/60 text-[8px]">●</span>
  )}
</span>
```

---

#### 3. Pass Preset Info to Cards

In BudgetCanvas, track which categories have presets:
```typescript
const presetCategories = new Set(presets.map(p => p.category));
```

Pass to BudgetCategoryCard:
```tsx
<BudgetCategoryCard
  key={category}
  category={category}
  label={getCategoryLabel(category)}
  value={categoryBudgets[category] || ''}
  onChange={(value) => onCategoryChange(category, value)}
  hasPreset={presetCategories.has(category)}
/>
```

---

### User Flow

1. User opens Budget Calculator
2. Enters Purchase Price, ARV in Deal Parameters
3. Enters **Square Footage** (e.g., 1500)
4. → Categories with presets (Painting, Flooring, Tile, Drywall, Roofing) auto-populate!
5. User sees small indicator dots on preset categories
6. User can click "Edit Rates" to customize $/sqft rates for future use
7. Changing sqft recalculates all preset categories

---

### Files to Modify

| File | Key Changes |
|------|-------------|
| `src/components/budget/BudgetCanvas.tsx` | Remove Popover and related state, add useEffect for auto-calculation, simplify header to just "Edit Rates" button, pass `hasPreset` to cards |
| `src/components/budget/BudgetCategoryCard.tsx` | Add `hasPreset` prop, show subtle indicator dot for preset categories |
