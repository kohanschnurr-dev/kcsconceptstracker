

## Fix: Simple Interest Should Be Interest-Only for Investor Loans

### Problem
The "Simple Interest" calculation method currently computes:
`(principal / amortMonths) + (principal × rate / 12)`

This includes monthly principal repayment, making it more expensive than standard amortization. For investor/hard money loans, "simple interest" means interest is calculated on the outstanding balance without compounding — payments are typically interest-only with principal due at maturity.

### Fix

**File: `src/types/loans.ts`**

1. **`calcMonthlyPayment`** — Change simple interest formula to interest-only:
   - `return (principal × annualRate / 100 / 12)` — same as interest-only payment
   - No principal component in monthly payment

2. **`buildAmortizationSchedule`** — When method is `simple`:
   - Each period: interest = `balance × rate / 12` (flat, non-compounding)
   - Principal = 0 each month until final payment
   - Last payment = balloon (remaining balance + final interest)
   - This differs from the standard interest-only path because simple interest always uses `balance × rate / 12` regardless of day count

### Result
- Simple Interest monthly payment on $58K at 4.85% = **$234.42/mo** (interest only)
- Final month includes balloon payment of ~$58,234
- Standard 30/360 stays at ~$306/mo (amortizing over 360 months)

### Files
- `src/types/loans.ts`

