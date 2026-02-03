

## Plan: Add Baselines with $/sqft Calculator

### Overview

Replace the current "Quick Start Templates" with a "Baselines" section that uses $/sqft pricing tiers. Add a square footage input field so users can quickly calculate a rehab budget by multiplying sqft × baseline rate.

---

### Changes Summary

| File | Change |
|------|--------|
| `src/components/budget/TemplatePicker.tsx` | Replace Quick Start Templates with Baselines, add sqft input |

---

### Baseline Tiers

| Level | $/sqft | Description |
|-------|--------|-------------|
| Cosmetic | $35 | Light refresh - paint, fixtures |
| Standard | $45 | Typical rental-ready updates |
| High Level | $55 | Quality finishes and systems |
| Overhaul | $65 | Major renovation work |

---

### UI Design

The dropdown will have:

```text
┌──────────────────────────────────┐
│ + Start Blank                    │
├──────────────────────────────────┤
│ 📐 Baselines                     │
│ ┌──────────────────────────────┐ │
│ │ Sqft: [___1500___]           │ │
│ └──────────────────────────────┘ │
│                                  │
│ ▪ Cosmetic      $35/sqft  $52,500│
│ ▪ Standard      $45/sqft  $67,500│
│ ▪ High Level    $55/sqft  $82,500│
│ ▪ Overhaul      $65/sqft  $97,500│
├──────────────────────────────────┤
│ 📁 Your Saved Budgets            │
│   ...                            │
└──────────────────────────────────┘
```

---

### Technical Details

**File: `src/components/budget/TemplatePicker.tsx`**

#### 1. Define baseline tiers (replaces PRESET_TEMPLATES)

```typescript
const BASELINE_TIERS = [
  { name: 'Cosmetic', pricePerSqft: 35, description: 'Light refresh - paint, fixtures' },
  { name: 'Standard', pricePerSqft: 45, description: 'Typical rental-ready updates' },
  { name: 'High Level', pricePerSqft: 55, description: 'Quality finishes and systems' },
  { name: 'Overhaul', pricePerSqft: 65, description: 'Major renovation work' },
];
```

#### 2. Add sqft state to component

```typescript
const [sqft, setSqft] = useState<string>('');
```

#### 3. Update dropdown UI

- Rename label from "Quick Start Templates" to "Baselines"
- Change icon from Sparkles to Ruler (or similar)
- Add a sqft input field at the top of the Baselines section
- Display each tier with its $/sqft and calculated total (sqft × rate)
- When a baseline is clicked, create a template with `total_budget = sqft × pricePerSqft`

#### 4. Handle baseline selection

```typescript
const handleBaselineSelect = (tier: typeof BASELINE_TIERS[0]) => {
  const sqftNum = parseFloat(sqft) || 0;
  const totalBudget = sqftNum * tier.pricePerSqft;
  
  const template: BudgetTemplate = {
    id: `baseline-${tier.name.toLowerCase()}`,
    name: `${tier.name} (${sqftNum} sqft)`,
    description: tier.description,
    purchase_price: 0,
    arv: 0,
    total_budget: totalBudget,
    category_budgets: {}, // Empty - user fills in details
  };
  
  onSelectTemplate(template);
};
```

---

### User Flow

1. User opens the "Load Template" dropdown
2. Enters their property's square footage (e.g., 1500)
3. Sees calculated totals for each baseline tier:
   - Cosmetic: $35 × 1500 = $52,500
   - Standard: $45 × 1500 = $67,500
   - High Level: $55 × 1500 = $82,500
   - Overhaul: $65 × 1500 = $97,500
4. Clicks a tier to load it as their starting budget
5. Can then distribute the total across categories as needed

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/components/budget/TemplatePicker.tsx` | 31-95, 146-169 | Replace PRESET_TEMPLATES with BASELINE_TIERS, add sqft input, update template selection logic |

