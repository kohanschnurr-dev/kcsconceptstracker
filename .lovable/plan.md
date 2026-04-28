## Goal

Two fixes to the Loans page toolbar (`src/components/loans/LoanTable.tsx`):

1. **Group button → icon-only** — drop the "Group" text so it matches the Table/Cards icon toggles.
2. **Stars no longer clipped** — currently the favorite stars get chopped off in the corner because the toggle container uses `overflow-hidden`.

## Changes — `src/components/loans/LoanTable.tsx`

### Fix 1: Stop clipping the stars

The wrapper `<div className="group/vt relative flex rounded-md border border-border overflow-hidden">` clips the stars positioned at `-top-1 -right-1`.

- Remove `overflow-hidden` from that wrapper.
- Round each inner button individually so the visual pill shape is preserved:
  - First button: add `rounded-l-[5px]`
  - Second button: add `rounded-r-[5px]`
- Bump star offset to `-top-1.5 -right-1.5` and add `z-10` so they sit cleanly above the border, exactly like the Group button's star.

### Fix 2: Group button becomes icon-only

Replace the labeled Group button with a square icon button matching the Table/Cards size:

```tsx
<Button
  variant={groupByProject ? 'default' : 'outline'}
  size="sm"
  className="h-9 w-9 p-0"
  onClick={() => setGroupByProject(g => !g)}
  title={groupByProject ? 'Ungroup' : 'Group by project'}
  aria-label={groupByProject ? 'Ungroup' : 'Group by project'}
>
  <Layers className="h-4 w-4" />
</Button>
```

Keep its existing favorite star (already positioned correctly), just bump it to `-top-1.5 -right-1.5 z-10` for consistency.

## Result

A clean row of three square icon buttons (Table / Cards / Group), each with a favorite star that sits proudly in the top-right corner without being clipped, followed by the search bar and filters.

## Out of Scope

Search input, filter dropdowns, persistence logic, table body — all unchanged.
