

## Update AI Prompt Text

### What Changes
Replace the current AI prompt text in the import modal with the user's new specialized construction bookkeeper prompt.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

1. **Replace the `aiPrompt` string** (lines 141-155) with the new prompt text that includes:
   - A role definition ("specialized construction bookkeeper for a DFW real estate developer")
   - A task description for extracting expenses from uploaded files
   - Detailed "Strict Extraction Rules" covering Date, Category, Expense Type, Amount, Payment Method, and Notes
   - A hardcoded list of valid categories (Appliances through Windows) instead of the dynamic category list
   - Output format instructions with the exact CSV headers
   - A closing line asking users to upload their file

2. **Remove the `categoryList` variable** (line 141) since the new prompt has its own hardcoded category list.

3. **Update the helper text** below the prompt box to match the new context -- change "Paste this prompt into ChatGPT, Gemini, or Claude along with your raw data" to reflect that users can upload files (PDF, Excel, or images) to their AI tool.

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`

