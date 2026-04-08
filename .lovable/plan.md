

## Fix "Could not find 'projects' column" Error on Loan Edit

### Problem
The loan detail query fetches with `.select('*, projects(name)')`, which adds a `projects` object to the result. When the user edits and saves, that `projects` field (along with `project_name`) gets sent in the update payload. The database rejects it because `projects` is a join, not a column.

### Change

**File: `src/hooks/useLoans.ts`** (line 170)

Add `projects` to the destructured exclusion list:

```typescript
const { project_name, projects, created_at, updated_at, ...dbPayload } = payload as any;
```

One word added. No other files affected.

