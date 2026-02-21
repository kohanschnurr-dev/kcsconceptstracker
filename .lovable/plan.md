

## Allow $0 Expenses in CSV Import

### Problem

The validation currently flags `amount === 0` as "Invalid amount." But a $0 expense is valid -- it can represent something received for free (e.g., a seller leaving behind a fridge). The only truly invalid amount is one that can't be parsed (`NaN`).

### Change

**`src/lib/csvImportUtils.ts`, line 181** -- Remove the `amount === 0` check so only `NaN` triggers an error:

```typescript
// Before
if (isNaN(amount) || amount === 0) { hasError = true; errorMsg = 'Invalid amount'; }

// After
if (isNaN(amount)) { hasError = true; errorMsg = 'Invalid amount'; }
```

### Files Changed
- `src/lib/csvImportUtils.ts` -- single line validation update

