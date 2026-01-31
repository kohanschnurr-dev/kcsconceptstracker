
## Predictive Category Auto-Selection for QuickBooks Expenses

### What This Does
When a QuickBooks expense appears in the pending queue, the category dropdown will automatically pre-select based on the vendor name. For example:
- "ALLSTATE INSURANCE" -> Insurance
- "SHERWIN WILLIAMS" -> Painting
- "HOME DEPOT" -> Hardware
- "FERGUSON" -> Plumbing

---

### Technical Implementation

**File: `src/components/QuickBooksIntegration.tsx`**

#### 1. Add a `detectCategory` function (similar to existing `detectExpenseType`)

This function maps vendor names to budget categories using keyword matching:

| Vendor Pattern | Category |
|----------------|----------|
| Allstate, State Farm, Farmers, Liberty Mutual, etc. | Insurance |
| Sherwin Williams, Benjamin Moore, Behr, PPG | Painting |
| Home Depot, Lowe's, Ace Hardware, Harbor Freight | Hardware |
| Ferguson, Plumbing supply, etc. | Plumbing |
| Floor & Decor, flooring supply | Flooring |
| Carrier, Lennox, Trane (HVAC brands) | HVAC |
| Amazon (general) | Misc |
| Waste Management, dumpster | Dumpsters / Trash |
| TXU, Oncor, Atmos, utility | Utilities |
| Republic Services | Gas Mileage (business) |
| And more... |

#### 2. Update the `useEffect` that auto-detects expense types

Extend it to also auto-detect and pre-select categories when pending expenses load.

#### 3. Pre-fill `selectedCategory` state

When expenses load, if a category can be detected from the vendor name, pre-populate `selectedCategory[expense.id]` with that value.

---

### Code Example

```typescript
// Auto-detect category based on vendor name
const detectCategory = (vendorName: string | null, description: string | null): string | null => {
  const text = `${vendorName || ''} ${description || ''}`.toLowerCase();
  
  // Insurance companies
  if (text.includes('allstate') || text.includes('state farm') || text.includes('farmers') ||
      text.includes('liberty mutual') || text.includes('progressive') || text.includes('geico') ||
      text.includes('nationwide') || text.includes('insurance')) {
    return 'insurance_project';
  }
  
  // Paint stores
  if (text.includes('sherwin') || text.includes('benjamin moore') || text.includes('behr') ||
      text.includes('ppg') || text.includes('paint')) {
    return 'painting';
  }
  
  // Hardware/general supplies
  if (text.includes('home depot') || text.includes('lowes') || text.includes('lowe\'s') ||
      text.includes('ace hardware') || text.includes('harbor freight') || text.includes('menards')) {
    return 'hardware';
  }
  
  // Plumbing
  if (text.includes('ferguson') || text.includes('plumbing supply')) {
    return 'plumbing';
  }
  
  // Flooring
  if (text.includes('floor & decor') || text.includes('floor and decor') || 
      text.includes('flooring') || text.includes('lumber liquidators')) {
    return 'flooring';
  }
  
  // More mappings...
  
  return null; // No match, user selects manually
};
```

---

### How It Works

1. When pending expenses load from QuickBooks, the existing `useEffect` runs
2. For each expense, we call `detectCategory(vendor_name, description)`
3. If a category is detected, we pre-populate `selectedCategory[expense.id]`
4. The dropdown shows the predicted category already selected
5. User can still change it if the prediction is wrong

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/QuickBooksIntegration.tsx` | Add `detectCategory` function and update useEffect to auto-fill category |

---

### Vendor Mappings to Include

**Insurance**: Allstate, State Farm, Farmers, Liberty Mutual, Progressive, Geico, Nationwide, USAA, Travelers, American Family

**Painting**: Sherwin Williams, Benjamin Moore, Behr, PPG, Dunn Edwards, Kelly-Moore, Valspar

**Hardware/Supplies**: Home Depot, Lowe's, Menards, Ace Hardware, Harbor Freight, True Value, Northern Tool

**Plumbing**: Ferguson, Plumber supply, plumbing wholesale

**Flooring**: Floor & Decor, Lumber Liquidators, flooring depot

**Electrical**: Graybar, electrical supply, Wholesale Electric

**HVAC**: Carrier, Lennox, Trane, HVAC supply, AC supply

**Appliances**: Best Buy, Appliance Direct, appliance warehouse

**Dumpsters**: Waste Management, Republic Services, dumpster

**Utilities**: TXU, Oncor, Atmos, electric, water, gas utility

**Landscaping**: SiteOne, nursery, landscaping, lawn

**Roofing**: ABC Supply, roofing supply

---

### Expected Result
- Category dropdown auto-selects based on vendor name
- User sees "Insurance" already selected when viewing an "ALLSTATE INSURANCE COMPAN" expense
- Reduces manual selection clicks
- Can still be changed if prediction is wrong
