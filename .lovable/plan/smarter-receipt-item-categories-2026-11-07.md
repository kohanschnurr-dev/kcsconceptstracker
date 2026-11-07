# Smarter receipt item categories

## Problem
A "Prehung Front Door" came in as Misc. The receipt photo reader only knows about 24 of your categories and falls back to Misc whenever it isn't sure. Nothing double-checks its guess.

## What changes
1. **Built-in keyword matcher (runs on every item)**
   - A large keyword list for each category, for example: door/prehung/slab/jamb → Doors; toilet/PEX/faucet → Plumbing; breaker/Romex/outlet → Electrical; LVP/carpet/underlayment → Flooring; shingle/drip edge → Roofing; 2x4/stud/OSB → Framing; drywall/joint compound → Drywall; vanity/shower → Bathroom; and so on for every category, including Delivery Fee, Cast Iron, Water Heater, Insulation and Tile.
   - If the photo reader says Misc (or gives nothing) and a keyword matches, the keyword answer wins.
   - The Excel upload uses the same matcher, so both paths stay in step.
2. **Remembers your fixes**
   - When you change an item's category and import it, the app remembers that wording. Next time a similar item shows up, it uses your choice first.
3. **Better photo reader instructions**
   - Give it your full category list, clear examples (doors, trim, cast iron, delivery fees), and tell it to use Misc only as a last resort.
4. **Small visual cue**
   - Items still on Misc after all of this get a subtle outline, so you can see what needs a look before you import.

## Order of priority
Your past correction → keyword match → photo reader guess → Misc.

## Technical details
- New `src/lib/categorizeLineItem.ts` with keyword rules + `refineCategory(name, aiGuess, learned)`; replace the rules in `excelReceiptImport.ts` with it.
- Apply in `SmartSplitReceiptUpload.tsx` where `initialCategories` are set; store corrections on import in `profiles.settings_data.categoryCorrections` (normalized item-name key → category, capped at ~500).
- Update the prompt and allowed list in `supabase/functions/parse-receipt-image/index.ts`; redeploy.
- Add unit tests: "Prehung Front Door" → doors, "Delivery charge" → delivery_fee, learned correction overrides keywords.
