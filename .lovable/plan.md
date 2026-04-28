# Construction Budget — "Enter value →" Empty State

## Goal
On the Construction Budget tile in `MAOGauge`, when the value is `$0` (no budget set), display **"Enter value →"** in muted style — mirroring the Purchase Price tile — so users know it is clickable to enter their own.

## Change
**File:** `src/components/budget/MAOGauge.tsx` (lines 222–231)

Replace the value paragraph so that when `currentBudget <= 0` AND the tile is editable (`onBudgetTargetChange` is provided), it renders the muted "Enter value →" placeholder. Otherwise it keeps the existing primary-colored currency display.

```tsx
<div>
  {currentBudget > 0 ? (
    <p className="text-base sm:text-lg font-bold font-mono text-primary group-hover:underline group-hover:decoration-primary/40 transition-all">
      {formatCurrency(currentBudget)}
    </p>
  ) : onBudgetTargetChange ? (
    <p className="text-base sm:text-lg font-bold font-mono text-muted-foreground group-hover:text-primary group-hover:underline transition-all">
      Enter value →
    </p>
  ) : (
    <p className="text-base sm:text-lg font-bold font-mono text-muted-foreground">
      {formatCurrency(0)}
    </p>
  )}
  {budgetMode === 'psf' && sqft > 0 && currentBudget > 0 && (
    <p className="text-[10px] text-muted-foreground font-mono">${Math.round(psfRate)}/sqft</p>
  )}
</div>
```

## Notes
- The wrapper div (line 168) already has `onClick={handleBudgetClick}` and `cursor-pointer group` when editable, so clicking "Enter value →" opens the inline budget input — no event-handler changes needed.
- Read-only contexts (no `onBudgetTargetChange`) still show `$0` so the empty state isn't misleading.
- Hover state subtly transitions muted → primary to reinforce that it's interactive, matching the existing pattern.
