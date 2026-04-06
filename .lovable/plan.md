

## Plan: AI-Powered Budget Import Cleaning

Add an AI cleaning step to the Import Budget flow that uses Lovable AI to intelligently parse, deduplicate, normalize, and map imported budget data to the app's categories — similar to how receipt parsing already works.

### How It Works

The current flow is: **Paste/Upload → Regex Parse → Manual Map → Import**

The new flow adds an optional AI step: **Paste/Upload → AI Clean & Map → Review → Import**

### Changes

**1. New Edge Function — `supabase/functions/clean-budget-import/index.ts`**
- Accepts raw budget text (CSV/TSV paste or parsed file content)
- Uses Lovable AI (gemini-2.5-flash) with a construction-industry prompt to:
  - Strip headers, subtotals, summary rows, formula lines, and junk
  - Normalize line item names (e.g., "Drywall Hang & Finish" → "Drywall")
  - Merge duplicate categories (e.g., "Framing Labor" + "Framing Material" → single "Framing" total)
  - Map each line to an exact budget category value from the app's list
  - Return clean JSON: `{ items: [{ name, amount, category, confidence }] }`
- Auth-guarded, uses `LOVABLE_API_KEY` (same pattern as `parse-receipt-text`)

**2. Updated Import Modal — `src/components/budget/ImportBudgetModal.tsx`**
- Add a "Clean with AI" toggle/button on the upload step (next to "Process Pasted Data")
- When enabled, sends raw text to the edge function before the mapping step
- AI-cleaned results populate the mapping table with higher match confidence
- Falls back to the existing regex parser if AI fails or user opts out
- Add a loading spinner during AI processing
- Show a small badge on AI-matched rows (e.g., "AI" pill) vs the existing green checkmark for keyword matches

**3. Flow Details**
- The "Process Pasted Data" button becomes a split: "Process" (regex, instant) and "Smart Clean" (AI, ~3s)
- AI results still land on the same mapping review screen — user always gets final approval
- Confidence below 70% gets flagged amber like unmatched rows today

### Files touched (2 new, 1 edited)
- `supabase/functions/clean-budget-import/index.ts` (new)
- `src/components/budget/ImportBudgetModal.tsx` (edited)

