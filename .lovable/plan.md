
# Scope of Work Generator — Entry Point: Header Button (Next to "+ Add Vendor")

## What changes

The "Generate Scope of Work" button sits in the page header next to the existing "+ Add Vendor" button. Clicking it opens a Sheet where the user first picks a vendor, then fills in the form, then generates the document via AI.

This means:
- No changes to vendor cards or dropdowns
- No changes to the vendor contact dialog
- One clean entry point in the header
- Vendor is selected *inside* the Sheet (not pre-selected from a card)

---

## Header (after change)

```
[ + Add Vendor ]  [ Generate Scope of Work ]
```

Both buttons sit in the `flex` header row at lines 157–166 of `src/pages/Vendors.tsx`. The new button uses `variant="outline"` with a `FileText` icon to visually distinguish it from the primary Add Vendor button.

---

## New Component: `ScopeOfWorkSheet.tsx`

**File:** `src/components/vendors/ScopeOfWorkSheet.tsx`

A right-side Sheet (`side="right"`, `sm:max-w-2xl`, full-width on mobile) with a `ScrollArea` wrapping all content.

### Props
```ts
interface ScopeOfWorkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[]; // all vendors passed in so user can pick inside
}
```

### Form Sections (in order)

**1. VENDOR** *(top — must pick first)*
- Select dropdown: vendor name. Once selected, trades auto-populate the Job Details section.

**2. DOCUMENT INFO** *(optional)*
- Company Name — pre-filled from company settings (hook)
- Customer / Property Name
- Date — pre-filled with today's date
- Quote / Job Number

**3. JOB DETAILS**
- Trade Type — auto-filled from selected vendor's trades (shown as chips the user can deselect/add to)
- Job Title — free text, e.g. "Water heater replacement"
- Location / Area — free text, e.g. "Garage, Back yard"
- Key Quantities — free text, e.g. "2 fixtures, 3 acres"

**4. SCOPE OF WORK**
- Work Items — textarea, one per line
- Also Included — textarea, one per line
- Not Included / Exclusions — textarea, one per line

**5. MATERIALS & NOTES**
- Materials Responsibility — Select: "Contractor provides all materials" / "Owner provides all materials" / "Split — see notes"
- Special Notes — textarea

**6. OUTPUT SETTINGS**
- Scope Length — 3-button toggle: **Brief** | **Standard** *(default)* | **Detailed**
- Tone — 3-button toggle: **Simple** | **Standard** *(default)* | **Professional**

**7. Generate Button**
- Full-width primary: "Generate Scope of Work"
- Disabled until a vendor is selected
- Shows spinner + "Generating..." while loading

**8. Generated Output** *(appears after generation)*
- Formatted block: `bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap`
- Two action buttons: **Copy to Clipboard** (with toast) and **Clear**

---

## Section Header Styling

```tsx
<p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
  Document Info
</p>
<Separator className="mt-1 mb-3" />
```

This matches the visual style from the screenshots — labeled section dividers.

## Toggle Button Styling

```tsx
<button
  onClick={() => setScopeLength('brief')}
  className={cn(
    "flex-1 py-2 text-sm rounded-md border transition-colors",
    scopeLength === 'brief'
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-transparent text-muted-foreground border-border hover:bg-muted"
  )}
>
  Brief
</button>
```

---

## New Edge Function: `generate-scope-of-work`

**File:** `supabase/functions/generate-scope-of-work/index.ts`

- Model: `google/gemini-3-flash-preview` (fast, balanced)
- Takes all form fields in request body
- System prompt crafts a professional construction Scope of Work
- Tone and Length are injected into the system prompt
- Plain text response (no tool calling needed)
- Handles 429/402 errors and surfaces them back to client

**`supabase/config.toml`** — add:
```toml
[functions.generate-scope-of-work]
verify_jwt = false
```

---

## Files to Change

| File | Change |
|---|---|
| `supabase/functions/generate-scope-of-work/index.ts` | New — AI edge function |
| `supabase/config.toml` | Add entry for new function |
| `src/components/vendors/ScopeOfWorkSheet.tsx` | New — full Sheet UI |
| `src/pages/Vendors.tsx` | Add button to header + sheet state + pass vendors list to sheet |

---

## What stays the same

- Vendor cards — no changes
- Vendor `⋮` dropdown — no changes
- Contact card dialog — no changes
- Add Vendor modal — no changes
