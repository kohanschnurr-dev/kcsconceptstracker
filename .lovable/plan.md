
## Add AI Prompt Helper to CSV Import Modal

### What This Does
Adds a copyable "AI prompt" section to the CSV import upload step. Users can copy a pre-written prompt, paste it into their favorite AI chatbot (ChatGPT, Gemini, Claude, etc.) along with their raw expense data, and get back a properly formatted CSV ready to upload.

### Changes

**File: `src/components/project/ImportExpensesModal.tsx`**

1. **Add a copy icon import**: Add `Copy` and `Check` from lucide-react for the copy button feedback.

2. **Add state for copy feedback**: A small `copied` state to show a checkmark after copying.

3. **Build the prompt string dynamically** using the project's valid categories from `getBudgetCategories()` so the AI knows exactly which category names to use.

The prompt text will be:
```
Convert my raw expense data into a CSV with these exact columns:
Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes

Strict Formatting Rules:
- Date: Convert all dates to MM/DD/YYYY.
- Category: Use one of these exact values: [dynamic list from project categories]
- Expense Type: 'product' for materials (Home Depot, Lowe's, etc.) or 'labor' for service providers (contractors, plumbers, etc.).
- Amount: Numerical value only (no $ signs or commas).
- Payment Method: cash, check, card, or transfer. Leave blank if unclear.
- Notes: Include relevant details like 'Licensed & insured' or project locations.
- Missing Data: Leave fields blank if not available.

Output: Provide the CSV content only, no headers or explanation. Ready to copy-paste into a .csv file.

Here is my raw data:
```

4. **Add a new UI section** below the two action cards (Download Sample / Upload CSV) and above the help text. It will be a collapsible or always-visible box with:
   - A header: "Have messy data? Let AI format it for you"
   - The prompt in a styled, scrollable text area (read-only)
   - A "Copy Prompt" button that copies to clipboard and shows brief confirmation
   - A small instruction: "Paste this prompt into ChatGPT, Gemini, or Claude along with your raw data. Then save the output as a .csv file and upload it above."

### Technical Details

- The prompt is built at render time using `allCategories.map(c => c.label).join(', ')` so it always reflects the user's custom categories.
- Copy uses `navigator.clipboard.writeText()` with a toast or inline checkmark for feedback.
- The section sits between the grid of action buttons and the help text block (between lines 372 and 376).
- No new dependencies needed.

### Files Modified
- `src/components/project/ImportExpensesModal.tsx`
