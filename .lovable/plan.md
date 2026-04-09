

## Fix: Preserve Draw Dates on Status Change

### Problem
When changing a draw's status to "funded", the `handleStatusChange` function auto-sets `date_funded` to today if `draw.date_funded` is null. But the user may have already set a date via the inline date picker (which saves to `date_funded`) or via the edit form (which saves to `expected_date`). This causes user-set dates to be overwritten with today's date.

### Root Cause
Line 63 in `DrawScheduleTracker.tsx`:
```typescript
if (status === 'funded' && !draw.date_funded) {
  dateFunded = todayString; // overwrites even if expected_date was set
}
```

### Fix — `src/components/loans/DrawScheduleTracker.tsx`

Update `handleStatusChange` to:
1. If `draw.date_funded` exists, keep it
2. If not, fall back to `draw.expected_date`
3. Only auto-set today's date if **neither** date exists

```typescript
const handleStatusChange = (draw: LoanDraw, status: DrawStatus) => {
  let dateFunded = draw.date_funded;
  if (status === 'funded' && !dateFunded) {
    dateFunded = draw.expected_date || todayString();
  }
  onUpsert({ ...draw, status, date_funded: dateFunded }, loanId);
};
```

This is a 1-file, ~3-line change.

