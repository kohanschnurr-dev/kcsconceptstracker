

## Add Completeness Instruction to AI Prompt

### What Changes
Add a new instruction line before the final "Please upload your file" line in the AI prompt to ensure LLMs process all data even if the document is large.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`** (around line 162)

Insert this line before "Please upload your file (PDF, Excel, or Receipt image) now.":

> If the file exceeds response limits, process it programmatically and ensure 100% of line items are extracted before generating the CSV. Do not partially complete.

The prompt's ending will change from:
```
Output Format: Create a downloadable CSV file with these exact headers: Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes.

Please upload your file (PDF, Excel, or Receipt image) now.
```

To:
```
Output Format: Create a downloadable CSV file with these exact headers: Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes.

If the file exceeds response limits, process it programmatically and ensure 100% of line items are extracted before generating the CSV. Do not partially complete.

Please upload your file (PDF, Excel, or Receipt image) now.
```

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`

