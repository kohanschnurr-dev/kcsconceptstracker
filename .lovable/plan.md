

## Remove Collateral Row from Loan Details

### Change

**`src/pages/LoanDetail.tsx`** — line 245

Delete the line that renders the Collateral row:
```tsx
{loan.collateral_type && <InfoRow label="Collateral" value={loan.collateral_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />}
```

