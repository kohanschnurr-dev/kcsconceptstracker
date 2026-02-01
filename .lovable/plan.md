

## Plan: Add Cash Flow / Refi Tab for Rental Projects

### Overview

Create a dedicated "Cash Flow / Refi" tab that appears only for rental-type projects. This tab will contain calculations specific to rental property investing, including monthly cash flow analysis and refinance projections (BRRRR method).

---

### New Component: CashFlowCalculator

**File: `src/components/project/CashFlowCalculator.tsx`**

A new component with rental-specific financial calculations:

**Input Fields:**
| Field | Description |
|-------|-------------|
| Purchase Price | Property acquisition cost |
| After Repair Value (ARV) | Post-renovation market value |
| Monthly Rent | Expected rental income |
| Loan Amount | Refinance loan amount (typically 75% ARV) |
| Interest Rate | Annual interest rate (%) |
| Loan Term | Years (default 30) |
| Property Taxes | Annual amount |
| Insurance | Annual amount |
| Vacancy Rate | Percentage (default 8%) |
| Maintenance | Monthly estimate |
| Property Management | Percentage of rent (default 10%) |

**Calculated Outputs:**
| Metric | Calculation |
|--------|-------------|
| Monthly Mortgage (P&I) | Standard amortization formula |
| Gross Monthly Income | Rent - vacancy allowance |
| Monthly Expenses | Taxes + Insurance + Maintenance + Management |
| Monthly Cash Flow | Income - Mortgage - Expenses |
| Annual Cash Flow | Monthly x 12 |
| Cash-on-Cash ROI | Annual cash flow / Cash invested |
| **Refi Cash Out** | Loan amount - (Purchase + Rehab costs) |

**Display Sections:**
1. **Income & Expenses** - Rental income breakdown
2. **Cash Flow Metrics** - Monthly/annual cash flow, CoC ROI
3. **Refi Analysis** - Cash out amount, equity remaining

---

### Database Changes

Add new columns to `projects` table for rental-specific data:

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_rent numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS loan_amount numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS interest_rate numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS loan_term_years integer DEFAULT 30;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_property_taxes numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_insurance numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS vacancy_rate numeric DEFAULT 8;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS monthly_maintenance numeric DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS management_rate numeric DEFAULT 10;
```

---

### ProjectDetail.tsx Changes

**Conditional Financials Tab Content:**

```typescript
<TabsContent value="financials" className="space-y-6">
  {project.project_type === 'rental' ? (
    <CashFlowCalculator 
      projectId={id!}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      initialPurchasePrice={project.purchase_price || 0}
      initialArv={project.arv || 0}
      // ... rental-specific props
    />
  ) : (
    <ProfitCalculator 
      projectId={id!}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      initialPurchasePrice={project.purchase_price || 0}
      initialArv={project.arv || 0}
    />
  )}
  
  <ExportReports ... />
</TabsContent>
```

---

### UI Layout

```text
+------------------------------------------------------------------+
|  Cash Flow Calculator                                   [Save]    |
+------------------------------------------------------------------+
| Purchase Price        | ARV              | Monthly Rent          |
| $ ___________        | $ ___________    | $ ___________         |
+------------------------------------------------------------------+
| REFI DETAILS                                                      |
+------------------------------------------------------------------+
| Loan Amount (75% ARV) | Interest Rate    | Loan Term             |
| $ ___________        | _____ %          | _____ years           |
+------------------------------------------------------------------+
| EXPENSES                                                          |
+------------------------------------------------------------------+
| Property Taxes/yr    | Insurance/yr     | Vacancy %             |
| $ ___________       | $ ___________    | _____ %               |
| Maintenance/mo      | Management %      |                       |
| $ ___________       | _____ %          |                        |
+------------------------------------------------------------------+
|                    RESULTS                                        |
+------------------------------------------------------------------+
| Monthly Cash Flow    | Annual Cash Flow  | Cash-on-Cash ROI      |
|     $XXX            |     $X,XXX        |      XX.X%            |
+------------------------------------------------------------------+
| REFI ANALYSIS                                                     |
+------------------------------------------------------------------+
| Refi Loan Amount    | Cash Out at Refi  | Equity in Property    |
|    $XXX,XXX         |    $XX,XXX        |     $XX,XXX           |
+------------------------------------------------------------------+
```

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/project/CashFlowCalculator.tsx` | **Create** - New rental calculator component |
| `src/pages/ProjectDetail.tsx` | **Modify** - Conditionally render calculator based on project type |
| Database migration | **Create** - Add rental-specific columns |

---

### Technical Notes

- The Profit Calculator (for fix & flip) calculates flip profit and ROI
- The Cash Flow Calculator (for rentals) calculates ongoing cash flow and refinance metrics
- Both share Purchase Price and ARV inputs (already in database)
- New rental-specific fields will be saved to the projects table
- Export Reports component remains the same for both project types

