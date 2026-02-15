

## Fix: Loan Calculator Values Not Persisting After Tab Switch

### Root Cause

The loan calculator saves to the database correctly (confirmed: DB has 129000 and 9.5%). However, after saving, it calls `queryClient.invalidateQueries` which does nothing because the parent (`ProjectDetail.tsx`) uses plain `useState` + a manual `fetchProjectData()` function -- not react-query. So the parent's `project` state never updates with the new saved values.

When switching away from the Loan tab and back, the `TabsContent` unmounts and remounts the calculator component, re-initializing state from the parent's stale props.

### Fix

**Option: Pass a refresh callback from parent to calculator**

1. In `ProjectDetail.tsx`, pass `fetchProjectData` as a prop to `HardMoneyLoanCalculator`
2. In `HardMoneyLoanCalculator.tsx`:
   - Add `onSaved?: () => void` to the props interface
   - In `handleSave`, after a successful save, call `onSaved?.()` instead of (or in addition to) `queryClient.invalidateQueries`
   - This triggers the parent to refetch the project data, updating its state with the new DB values
   - Remove the react-query `useQueryClient` import since it serves no purpose here

### Files to Change

- `src/components/project/HardMoneyLoanCalculator.tsx`
  - Add `onSaved?: () => void` to the props interface
  - Call `onSaved?.()` after successful save instead of `queryClient.invalidateQueries`
  - Remove unused `useQueryClient` import

- `src/pages/ProjectDetail.tsx`
  - Pass `onSaved={() => fetchProjectData(false)}` prop to `HardMoneyLoanCalculator`

### Technical Details

```text
Current broken flow:
  Save -> DB updated -> invalidateQueries(['project', id]) -> nobody listening -> parent state stale -> tab switch -> remount with old props

Fixed flow:
  Save -> DB updated -> onSaved() -> fetchProjectData(false) -> parent state updated -> tab switch -> remount with correct props
```

This is a 2-line fix in the parent and a ~5-line change in the calculator.
