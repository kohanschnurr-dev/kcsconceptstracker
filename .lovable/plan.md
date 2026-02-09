

## Plan: Add "Garage" and All Missing Categories to SmartSplit Receipt Upload Dropdown

### Problem Identified

The category dropdown in the **SmartSplit Receipt Upload** component uses a **hardcoded subset** of categories (`projectCategoryOptions`) that's missing "Garage" and many other categories:

**Current hardcoded list (20 categories):**
```typescript
const projectCategoryOptions = [
  'appliances', 'bathroom', 'cabinets', 'carpentry', 'countertops',
  'demolition', 'doors', 'drywall', 'electrical', 'flooring',
  'hardware', 'hvac', 'kitchen', 'landscaping', 'light_fixtures',
  'misc', 'painting', 'plumbing', 'roofing', 'windows'
];
```

**Missing categories (28 total):**
- brick_siding_stucco (Exterior Finish)
- cleaning
- closing_costs
- driveway_concrete (Concrete)
- drain_line_repair
- fencing
- final_punch
- food
- foundation_repair
- framing
- **garage** ← The one you specifically asked about
- natural_gas (Gas)
- hoa
- insulation
- insurance_project
- main_bathroom
- permits_inspections
- pest_control
- pool
- railing
- staging
- taxes
- tile
- dumpsters_trash (Trash Hauling)
- utilities
- variable
- water_heater
- wholesale_fee

---

### Solution

Replace the hardcoded `projectCategoryOptions` array with a dynamic reference to `BUDGET_CATEGORIES`, which already contains all 48 categories in proper alphabetical order (including Garage).

---

### Technical Changes

**File: `src/components/SmartSplitReceiptUpload.tsx`**

**Lines 244-253** - Replace hardcoded array with dynamic reference:

```text
Current code:
  const projectCategoryOptions = [
    'appliances', 'bathroom', 'cabinets', 'carpentry', 'countertops',
    'demolition', 'doors', 'drywall', 'electrical', 'flooring',
    'hardware', 'hvac', 'kitchen', 'landscaping', 'light_fixtures',
    'misc', 'painting', 'plumbing', 'roofing', 'windows'
  ];
  
  const businessCategoryOptions = BUSINESS_EXPENSE_CATEGORIES.map(c => c.value);
  
  const categoryOptions = assignmentType === 'project' ? projectCategoryOptions : businessCategoryOptions;
```

```text
New code:
  const projectCategoryOptions = BUDGET_CATEGORIES.map(c => c.value);
  
  const businessCategoryOptions = BUSINESS_EXPENSE_CATEGORIES.map(c => c.value);
  
  const categoryOptions = assignmentType === 'project' ? projectCategoryOptions : businessCategoryOptions;
```

---

### Result

After this change:

- **Garage** will appear in the category dropdown between "Framing" and "Gas"
- All 48 budget categories will be available for expense assignment
- Categories will display in alphabetical order by label (matching the recent sorting fix)
- The dropdown will stay in sync with any future additions to `BUDGET_CATEGORIES`

