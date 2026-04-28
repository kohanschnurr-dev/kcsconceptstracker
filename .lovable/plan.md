## Goal

Unify the three toolbar toggles (Table / Cards / Group) into a **single segmented control** so they always appear together — the Group button no longer disappears when switching to Cards view, and all three buttons share the same square 36×36 icon footprint.

## Current Problem

- The Group button is wrapped in `{viewMode === 'table' && ...}`, so it vanishes the moment the user switches to Cards.
- It also lives in its own separate bordered button outside the Table/Cards segment, so the row reads as "two icons + a floating button" rather than one unified control.

## Changes — `src/components/loans/LoanTable.tsx` (lines ~365–473)

Merge the Group button into the existing `group/vt` segmented container so all three buttons share one border, one rounded shell, and consistent dividers.

```text
┌──────┬──────┬──────┐
│ List │ Grid │Layers│   ← single rounded border, divider lines between
└──────┴──────┴──────┘
```

### Specifics

1. **Always render Group** — remove the `{viewMode === 'table' && ...}` wrapper.
2. **Move Group inside the `group/vt` flex container** as the third `<button>`, with `border-l border-border` matching the Cards button.
3. **Standardize all three buttons to `h-9 w-9 flex items-center justify-center`** so widths are identical (no more `px-2.5 py-1.5` variance).
4. **Group button auto-switches view**: when the user clicks Group while in Cards view, set `viewMode` to `'table'` at the same time as enabling grouping (grouping only makes sense in table view). When in table view, it just toggles grouping on/off.
5. **Active state for Group**: highlighted with `bg-primary/15 text-primary` only when both `groupByProject === true` AND `viewMode === 'table'` (so it doesn't look "active" when it has no effect).
6. **Star uses the same group-hover token** (`group-hover/vt`) as the other two so the favorite stars all reveal in unison on hover. Keep `-top-1.5 -right-1.5 z-10`.
7. Drop the now-unused outer `<div className="group/gp relative">` wrapper.

### Resulting JSX shape

```tsx
<div className="group/vt relative flex rounded-md border border-border
                [&>button:first-child]:rounded-l-[5px]
                [&>button:last-child]:rounded-r-[5px]">
  <button /* Table */ className="relative h-9 w-9 flex items-center justify-center ..."> 
    <List /> <Star ... />
  </button>
  <button /* Cards */ className="relative h-9 w-9 flex items-center justify-center border-l border-border ...">
    <LayoutGrid /> <Star ... />
  </button>
  <button /* Group */ className="relative h-9 w-9 flex items-center justify-center border-l border-border ..."
    onClick={() => {
      const next = !groupByProject;
      setGroupByProject(next);
      if (next && viewMode !== 'table') setViewMode('table');
    }}>
    <Layers /> <Star ... />
  </button>
</div>
```

## Out of Scope

Search input, filter dropdowns, table body, persistence logic — all unchanged.

## Files Touched

- `src/components/loans/LoanTable.tsx`
