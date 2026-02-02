

## Plan: Move Hard Money Loan Calculator to Its Own Tab

### Overview

Extract the Hard Money Loan Calculator from the Financials tab and create a dedicated "Loan" tab for fix & flip projects. This gives the loan analysis more prominence and keeps the Financials tab focused on profit calculation and exports.

---

### Current Tab Structure

```text
[Schedule] [Tasks] [Financials] [Team] [Photos] [Logs]
                        |
                        ├── ProfitCalculator (fix & flip)
                        ├── HardMoneyLoanCalculator (fix & flip)
                        └── ExportReports
```

### New Tab Structure

```text
[Schedule] [Tasks] [Financials] [Loan] [Team] [Photos] [Logs]
                        |           |
                        |           └── HardMoneyLoanCalculator
                        |
                        ├── ProfitCalculator
                        └── ExportReports
```

---

### Changes Summary

| File | Change |
|------|--------|
| `src/pages/ProjectDetail.tsx` | Add "Loan" tab trigger (conditional for non-rentals), create TabsContent for loan calculator, remove from financials tab |

---

### Technical Details

**File: `src/pages/ProjectDetail.tsx`**

**1. Update TabsList (line 544-551) - Add conditional Loan tab:**

```tsx
<TabsList className="flex-wrap h-auto">
  <TabsTrigger value="schedule">Schedule</TabsTrigger>
  <TabsTrigger value="tasks">Tasks</TabsTrigger>
  <TabsTrigger value="financials">Financials</TabsTrigger>
  {!isRental && <TabsTrigger value="loan">Loan</TabsTrigger>}
  <TabsTrigger value="team">Team</TabsTrigger>
  <TabsTrigger value="photos">Photos</TabsTrigger>
  <TabsTrigger value="logs">Logs ({dailyLogs.length})</TabsTrigger>
</TabsList>
```

**2. Simplify Financials TabsContent (lines 565-622) - Remove HardMoneyLoanCalculator:**

```tsx
<TabsContent value="financials" className="space-y-6">
  {isRental ? (
    <CashFlowCalculator ... />
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

**3. Add new Loan TabsContent (after financials, before team):**

```tsx
{!isRental && (
  <TabsContent value="loan">
    <HardMoneyLoanCalculator
      projectId={id!}
      purchasePrice={project.purchase_price || 0}
      totalBudget={totalBudget}
      arv={project.arv || 0}
      initialLoanAmount={(project as any).hm_loan_amount}
      initialInterestRate={(project as any).hm_interest_rate || 12}
      initialLoanTermMonths={(project as any).hm_loan_term_months || 6}
      initialPoints={(project as any).hm_points || 3}
      initialClosingCosts={(project as any).hm_closing_costs || 0}
      initialInterestOnly={(project as any).hm_interest_only ?? true}
    />
  </TabsContent>
)}
```

---

### Visual Result

**For Fix & Flip Projects:**
```text
┌──────────┬───────┬────────────┬──────┬──────┬────────┬─────────┐
│ Schedule │ Tasks │ Financials │ Loan │ Team │ Photos │ Logs(3) │
└──────────┴───────┴────────────┴──────┴──────┴────────┴─────────┘

Loan tab selected:
┌─────────────────────────────────────────────────────────────────┐
│  HARD MONEY LOAN CALCULATOR                            [Save]  │
│  ┌─────────────────────────┬───────────────────────────────────┤
│  │ Loan Inputs             │ Results + Sensitivity             │
│  └─────────────────────────┴───────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

**For Rental Projects (no Loan tab):**
```text
┌──────────┬───────┬────────────┬──────┬────────┬─────────┐
│ Schedule │ Tasks │ Financials │ Team │ Photos │ Logs(3) │
└──────────┴───────┴────────────┴──────┴────────┴─────────┘
```

---

### Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `src/pages/ProjectDetail.tsx` | 544-551 | Add conditional "Loan" TabsTrigger |
| `src/pages/ProjectDetail.tsx` | 565-622 | Remove HardMoneyLoanCalculator from financials |
| `src/pages/ProjectDetail.tsx` | After 622 | Add new TabsContent for loan |

