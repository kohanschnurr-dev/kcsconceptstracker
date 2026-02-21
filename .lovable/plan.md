

## Add Excel-Like Formula Evaluation to Number Inputs

### What It Does

When a user types a formula starting with `=` into any numeric input (e.g., `=22489-10000`), the app evaluates it on blur/Enter and replaces it with the result (`12489`). The formula never persists -- it becomes hard data immediately.

### How It Works

1. **New `FormulaInput` component** (`src/components/ui/formula-input.tsx`)
   - Wraps the existing `<Input>` component
   - Accepts all the same props as `<Input>` (fully backward-compatible)
   - On blur or Enter keypress, checks if the value starts with `=`
   - If so, evaluates the math expression using a safe parser (no `eval`) and calls `onChange` with the numeric result
   - Supports basic operations: `+`, `-`, `*`, `/`, parentheses, and decimals
   - Shows a subtle calculator icon or tooltip hint so users know the feature exists

2. **Safe math evaluator** (`src/lib/formulaEval.ts`)
   - A small function that parses and evaluates basic arithmetic expressions without using `eval()`
   - Supports: numbers, `+`, `-`, `*`, `/`, parentheses, negative numbers
   - Returns `NaN` for anything it can't parse (invalid input is ignored, value stays as-is)
   - Example: `evaluateFormula("22489-10000")` returns `12489`

3. **Replace `<Input type="number">` with `<FormulaInput>` in key financial screens**
   - Budget Calculator fields (purchase price, ARV, rehab budget, category amounts)
   - Project Budget line items
   - Contractor Financials (contract value, labor/materials budgets)
   - Quick Expense amount field
   - Invoice/Receipt generators (qty, unit price, tax)
   - Any other dollar/number input where users are likely to calculate

### Technical Detail

**`src/lib/formulaEval.ts`** -- Safe arithmetic parser:

```typescript
export function evaluateFormula(expr: string): number | null {
  // Strip the leading "="
  const cleaned = expr.replace(/^=/, '').trim();
  // Only allow digits, operators, parens, decimals, whitespace
  if (!/^[\d\s+\-*/().]+$/.test(cleaned)) return null;
  try {
    // Use Function constructor (safer than eval, no access to scope)
    const result = new Function(`"use strict"; return (${cleaned})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch { return null; }
}
```

**`src/components/ui/formula-input.tsx`** -- Wrapper component:

```tsx
// Extends Input with formula detection
// On blur: if value starts with "=", evaluate and replace
// The input temporarily switches to type="text" while typing to allow "=" and operators
// Once evaluated, the numeric result flows through the normal onChange handler
```

**Usage is a drop-in replacement:**

```tsx
// Before
<Input type="number" value={amount} onChange={handleChange} />

// After
<FormulaInput type="number" value={amount} onChange={handleChange} />
```

### Files Changed
- `src/lib/formulaEval.ts` -- new file, safe math expression evaluator
- `src/components/ui/formula-input.tsx` -- new file, Input wrapper with formula support
- `src/pages/ProjectBudget.tsx` -- swap key numeric inputs to FormulaInput
- `src/components/CreateBudgetModal.tsx` -- swap budget fields
- `src/components/project/ContractorFinancialsTab.tsx` -- swap financial inputs
- `src/components/project/GenerateInvoiceSheet.tsx` -- swap qty/price inputs
- `src/components/project/GenerateReceiptSheet.tsx` -- swap qty/price inputs
- `src/components/QuickExpenseModal.tsx` -- swap amount input
- `src/components/procurement/ProcurementItemModal.tsx` -- swap price/qty inputs

