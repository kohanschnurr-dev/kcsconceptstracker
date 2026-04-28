## Goal

Make the Loans table feel cleaner: every column header and cell is **center-aligned**, and the **Balance / Original** cell shows just the headline balance number — with an inline expand chevron to reveal the "of $X" original and the "↑ accrued" interest.

## Changes — `src/components/loans/LoanTable.tsx`

### 1. Center-align all columns

Update headers and cells so text/labels sit centered, matching the user's request.

- `TableHead` for Project, Loan Purpose, Type, Balance/Original, Monthly Pmt, Maturity, Status, Next Payment → add `text-center`.
- Sort buttons (`SortBtn`) stay inline next to the centered label (wrap header content in a `inline-flex items-center justify-center gap-1` span).
- `TableCell`s in `renderLoanRow` → switch from `text-right` / default-left to `text-center` for all data columns. Badges (`LoanTypeBadge`, `LoanStatusBadge`) get wrapped in a `flex justify-center` container so the pills sit centered in their column.
- Project / Loan Purpose cells: keep `truncate` but center via `text-center` and remove `font-medium` left bias only on text alignment (font weight stays).
- Subtotal + Grand Total rows: realign so the Balance and Monthly Pmt columns are also `text-center` to stay consistent. The "Total (N loans)" label switches to `text-center` as well (still spans 3 columns).

### 2. Expandable Balance / Original cell

Currently the cell stacks three lines (balance, "of $X", accrued). New behavior:

- **Default**: show only the balance amount (e.g. `$187,000`) plus a small chevron button (`ChevronDown` from lucide-react) to the right of the number.
- **Expanded** (per-row, local state): reveals the existing secondary line — `of $245,000 · ↑$6,385 accrued` — directly underneath. Chevron flips to `ChevronUp`.
- Clicking the chevron toggles expansion and **does not navigate** to the loan detail (uses `e.stopPropagation()`).
- If a loan has no original-amount detail and no accrued interest, the chevron is hidden (nothing to expand).

Implementation:
- Add `const [expandedBalances, setExpandedBalances] = useState<Set<string>>(new Set())` at the component level.
- Helper `toggleBalanceExpand(id)` adds/removes the id from the set.
- In `renderLoanRow`, replace the Balance cell with a centered flex layout:
  ```
  [ $187,000  ⌄ ]
       of $245,000 · ↑$6,385 accrued   ← only when expanded
  ```
- Card view (unchanged) — already shows full breakdown by default; users asked specifically about the table columns.

### 3. Subtotal & Total rows

To keep the totals readable with center alignment:
- Subtotal row: balance column shows headline total centered, with the "of $X" line directly under it (always visible — totals are summary rows, not per-loan).
- Grand Total row: same treatment, centered.

## Out of Scope

- Card view layout (already shows balance breakdown clearly).
- Sorting logic, filters, persistence, and the star/default-view system stay exactly as-is.
- No DB or type changes.

## Files Touched

- `src/components/loans/LoanTable.tsx` (only)
