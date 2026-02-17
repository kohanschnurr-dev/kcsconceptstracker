

## Add "Import" Tab to the Add Expense Modal

### What's Changing
The "Add Expense" modal (top-right button on the Expenses page) will get two tabs: **Single Expense** (current form) and **Import** (CSV bulk import). The Import tab will show the same UI as the existing project-level Import Expenses modal (sample download, file upload with drag-and-drop, AI prompt helper, preview table) but with an added Project selector since this modal isn't scoped to a single project.

### How It Works
1. Open the modal -- you see two tabs at the top: "Single Expense" | "Import"
2. **Single Expense** tab shows the existing quick expense form (no changes)
3. **Import** tab shows:
   - A project dropdown (required before upload)
   - The full CSV import UI: Download Sample, Upload CSV, AI Prompt Helper, preview/confirm table
4. On mobile (Drawer), the same tabs appear inside the drawer

### Technical Detail

**File: `src/components/QuickExpenseModal.tsx`**

1. Add imports for `Tabs, TabsList, TabsTrigger, TabsContent` from `@/components/ui/tabs`, plus `FileSpreadsheet` icon.

2. Create a new `ImportTab` component inside this file that:
   - Accepts `projects` and `onExpenseCreated` / `onClose` props
   - Has a project selector at the top (using `ProjectAutocomplete`)
   - Once a project is selected, loads that project's existing categories from the DB
   - Renders the same CSV import flow currently in `ImportExpensesModal`: sample download, file upload with drag/drop, AI prompt helper textarea, preview table with category matching, and batch insert
   - Reuses the parsing utilities (`parseCSV`, `normalize`, `similarity`, `matchCategory`, `parseDate`) -- these will be extracted to a shared location or duplicated inline

3. Wrap the existing `ExpenseForm` and new `ImportTab` in a `Tabs` component in both the Dialog and Drawer renders:
   ```
   <Tabs defaultValue="single">
     <TabsList className="w-full">
       <TabsTrigger value="single">Single Expense</TabsTrigger>
       <TabsTrigger value="import">Import CSV</TabsTrigger>
     </TabsList>
     <TabsContent value="single">
       <ExpenseForm ... />
     </TabsContent>
     <TabsContent value="import">
       <ImportTab ... />
     </TabsContent>
   </Tabs>
   ```

4. The `ImportTab` will need to fetch categories for the selected project dynamically (a small query to `project_categories` when the project changes).

**File: `src/lib/csvImportUtils.ts`** (new shared utility)

Extract the reusable CSV parsing functions from `ImportExpensesModal.tsx` into a shared file:
- `parseCSV`
- `normalize`
- `similarity`
- `matchCategory`
- `parseDate`
- The AI prompt string constant

**File: `src/components/project/ImportExpensesModal.tsx`**

Update to import the shared utilities from `src/lib/csvImportUtils.ts` instead of defining them inline (keeps it DRY).

### Files
- **New**: `src/lib/csvImportUtils.ts` -- Shared CSV parsing utilities
- **Edit**: `src/components/QuickExpenseModal.tsx` -- Add Tabs, create ImportTab component
- **Edit**: `src/components/project/ImportExpensesModal.tsx` -- Use shared utilities from csvImportUtils

