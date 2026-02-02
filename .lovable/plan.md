

## Plan: Hard Money Loan Calculator for Fix & Flip Projects

### Overview

Create a new `HardMoneyLoanCalculator` component for the Financials tab that helps analyze financing costs for fix & flip projects. This will sit alongside the existing `ProfitCalculator` and provide detailed loan analysis with stress testing features.

---

### Layout Design (Two-Column Grid)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  HARD MONEY LOAN CALCULATOR                                        [Save]  │
├────────────────────────────────────┬────────────────────────────────────────┤
│  LEFT COLUMN - LOAN INPUTS         │  RIGHT COLUMN - RESULTS               │
│                                    │                                        │
│  ┌──────────────────────────────┐  │  ┌────────┐ ┌────────┐ ┌────────────┐ │
│  │ Loan Amount       $150,000   │  │  │Monthly │ │ Total  │ │ Effective  │ │
│  │ ■■■■■■■■■■■■■■■■░░░░  75% PP │  │  │Payment │ │Interest│ │   APR      │ │
│  └──────────────────────────────┘  │  │$1,406  │ │$8,436  │ │  16.8%     │ │
│                                    │  └────────┘ └────────┘ └────────────┘ │
│  ┌──────────────────────────────┐  │                                        │
│  │ Interest Rate     12.0%      │  │  ┌────────────────────────────────┐   │
│  │ ■■■■■■■■■■■■░░░░░░░░         │  │  │ Total Loan Cost: $15,936       │   │
│  └──────────────────────────────┘  │  │ Points: $4,500 | Interest: ... │   │
│                                    │  └────────────────────────────────┘   │
│  Loan Term (Months)  [6] [12] [18] │                                        │
│                                    │  ─────────────────────────────────────  │
│  Points/Origination   3.0%         │  RATE SENSITIVITY                      │
│  Closing Costs        $500         │  ┌────────────────────────────────┐   │
│                                    │  │ Rate  │ Interest │ Est. Profit │   │
│  Interest Type:                    │  │ 12.0% │  $8,436  │   $32,000   │   │
│  [● Interest Only] [○ Amortizing]  │  │ 13.0% │  $9,139  │   $31,297   │   │
│                                    │  │ 14.0% │  $9,842  │   $30,594   │   │
│                                    │  └────────────────────────────────┘   │
│                                    │                                        │
│                                    │  PAYOFF TIMELINE                       │
│                                    │  ┌────────────────────────────────┐   │
│                                    │  │ If sold at 4 mo: $5,624 int    │   │
│                                    │  │ If sold at 6 mo: $8,436 int    │   │
│                                    │  │ Savings: $2,812                │   │
│                                    │  └────────────────────────────────┘   │
└────────────────────────────────────┴────────────────────────────────────────┘
```

---

### Database Changes Required

New columns for the `projects` table to store hard money loan data:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `hm_loan_amount` | numeric | null | Hard money loan amount |
| `hm_interest_rate` | numeric | null | Annual interest rate (%) |
| `hm_loan_term_months` | integer | 6 | Loan term in months |
| `hm_points` | numeric | 3 | Points/origination fee (%) |
| `hm_closing_costs` | numeric | 0 | Closing costs ($) |
| `hm_interest_only` | boolean | true | Interest-only vs amortizing |

---

### Technical Implementation

#### New Component: `src/components/project/HardMoneyLoanCalculator.tsx`

**Props Interface:**
```typescript
interface HardMoneyLoanCalculatorProps {
  projectId: string;
  purchasePrice: number;
  totalBudget: number;
  arv: number;
  // Initial values from DB
  initialLoanAmount?: number;
  initialInterestRate?: number;
  initialLoanTermMonths?: number;
  initialPoints?: number;
  initialClosingCosts?: number;
  initialInterestOnly?: boolean;
}
```

**State Management:**
- Loan Amount ($) - defaults to 75% of purchase price
- Interest Rate (%) - slider + input (8-18% range)
- Loan Term (months) - segmented control [6, 12, 18] + custom
- Points (%) - input field (default 3%)
- Closing Costs ($) - fixed dollar input
- Interest Type - toggle switch

**Calculation Engine:**

```typescript
// Interest-Only Payment
const monthlyInterestOnly = (loanAmount * (rate / 100)) / 12;

// Amortizing Payment (P&I)
const monthlyAmortizing = loanAmount * 
  (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
  (Math.pow(1 + monthlyRate, termMonths) - 1);

// Total Interest (Interest-Only)
const totalInterestIO = monthlyInterestOnly * termMonths;

// Total Interest (Amortizing)
const totalInterestAmort = (monthlyAmortizing * termMonths) - loanAmount;

// Points Cost
const pointsCost = loanAmount * (points / 100);

// Total Loan Cost
const totalLoanCost = totalInterest + pointsCost + closingCosts;

// Effective APR (includes all fees)
const effectiveAPR = ((totalLoanCost / loanAmount) / (termMonths / 12)) * 100;
```

**Rate Sensitivity Table:**
```typescript
const rateSensitivity = [0, 1, 2].map(bump => {
  const adjustedRate = interestRate + bump;
  const adjustedInterest = calculateInterest(adjustedRate);
  const adjustedProfit = arv - purchasePrice - totalBudget - adjustedInterest - pointsCost - closingCosts - sellingCosts;
  return { rate: adjustedRate, interest: adjustedInterest, profit: adjustedProfit };
});
```

**Days to Payoff Comparison:**
```typescript
const payoffComparison = [4, 6, termMonths].map(months => ({
  months,
  interest: monthlyInterest * months,
  savings: (termMonths - months) * monthlyInterest
}));
```

---

### UI Components Used

| Component | Purpose |
|-----------|---------|
| `Card` | Main container with glass-card styling |
| `Input` | Dollar/percentage inputs with icons |
| `Slider` | Interest rate visual adjustment |
| `Switch` | Interest-only vs Amortizing toggle |
| `Button` | Save button, term selection |
| `Label` | Field labels |

---

### Styling (KCS Concepts Aesthetic)

The existing CSS variables already match the requirements:
- Background: `--background: 220 20% 10%` (near-black)
- Primary/Accent: `--primary: 32 95% 55%` (Orange #FF8C00)
- Text: `--foreground: 210 20% 95%` (White)
- Borders: `--border: 220 15% 22%` (#333333 equivalent)
- Rounded corners: Already using `rounded-lg` (0.5rem / 8px)

Custom styling for this component:
- Cards use `bg-[#1a1a1a]` with `border border-[#333333]` for sharp definition
- KPI result cards use `bg-primary/10` with orange glow
- Inputs maintain consistent styling with existing components

---

### Integration with ProjectDetail.tsx

Update the Financials tab to include the new calculator for fix & flip projects:

```tsx
<TabsContent value="financials" className="space-y-6">
  {isRental ? (
    <CashFlowCalculator ... />
  ) : (
    <>
      <ProfitCalculator ... />
      <HardMoneyLoanCalculator 
        projectId={id!}
        purchasePrice={project.purchase_price || 0}
        totalBudget={totalBudget}
        arv={project.arv || 0}
        initialLoanAmount={project.hm_loan_amount || 0}
        initialInterestRate={project.hm_interest_rate || 12}
        initialLoanTermMonths={project.hm_loan_term_months || 6}
        initialPoints={project.hm_points || 3}
        initialClosingCosts={project.hm_closing_costs || 0}
        initialInterestOnly={project.hm_interest_only ?? true}
      />
    </>
  )}
  <ExportReports ... />
</TabsContent>
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/project/HardMoneyLoanCalculator.tsx` | Create | New component with full loan analysis |
| `src/pages/ProjectDetail.tsx` | Modify | Import and add component to Financials tab |
| Database migration | Create | Add 6 new columns to projects table |

---

### User Flow

1. User navigates to Project > Financials tab
2. For fix & flip projects, sees Profit Calculator + Hard Money Loan Calculator
3. Loan Amount defaults to 75% of purchase price
4. User adjusts rate using slider or direct input
5. Selects term (6/12/18 months)
6. Toggles Interest-Only vs Amortizing
7. Results update in real-time:
   - Monthly Payment
   - Total Interest
   - Total Loan Cost
   - Effective APR
8. Rate Sensitivity shows impact of +1%/+2% rate increases
9. Payoff Timeline shows early sale savings
10. User clicks Save to persist values

