

## Fix Report Text Spacing, PDF Fidelity, and Remove Print Button

### Issues Identified

1. **Letter spacing**: The `SectionHead` component and other gold labels use `title.split('').join(' ')` which inserts a space between every single character, losing word boundaries. "BUDGET SNAPSHOT" renders as "B U D G E T   S N A P S H O T" with no visible word gap. Fix: use CSS `letter-spacing` on the original text (with normal word spaces) instead of character splitting.

2. **PDF export**: Currently generates plain text lines and feeds them to `generatePDF`, producing a generic card layout that looks nothing like the on-screen report. Fix: capture the actual report DOM as HTML and open that for printing as PDF.

3. **Print button**: Remove the "Print" button entirely; keep only the "PDF" button.

### Changes

**File: `src/components/project/ProjectReport.tsx`**

1. **Remove Print button and handler** -- delete the `handlePrint` function and the Print `<Button>` from the action bar. Keep only the PDF button and the close (X) button.

2. **Fix `SectionHead` component** -- stop splitting characters. Instead, apply `tracking-[0.35em]` (wide letter-spacing) directly on the text as-is. This preserves natural word gaps while giving the spaced uppercase look.

3. **Fix all other letter-spaced labels** -- same approach for:
   - Company name in header (line 285): remove `.split('').join(' ')`
   - "H O W  W E  G E T  T O  R O I" (line 360): use plain text with tracking
   - "T H E  D E A L" / "T H E  R E T U R N" (lines 372, 383): use plain text with tracking
   - Footer company name (line 563): remove `.split('').join(' ')` if present, use tracking

4. **Improve PDF export to match on-screen report** -- replace the plain-text `handleDownloadPdf` with a function that clones the report container's `innerHTML`, wraps it in a full HTML document with the same CSS variables / theme colors extracted at runtime, and opens it in a new tab for browser "Save as PDF". This ensures the PDF looks identical to the on-screen report.

### Technical Details

**SectionHead fix (before/after):**
```tsx
// Before:
<h2 className="text-[10px] font-bold uppercase tracking-[3px] ...">
  {title.split('').join(' ')}
</h2>

// After:
<h2 className="text-[10px] font-bold uppercase tracking-[0.35em] ...">
  {title}
</h2>
```

**PDF export approach:**
- Add a `ref` to the report content container
- On "PDF" click, read `ref.current.innerHTML`, wrap in a standalone HTML doc that:
  - Inlines the current CSS variable values (--primary, --background, etc.)
  - Includes the same Google Fonts link (Inter)
  - Includes `@media print` and `@page { size: A4 portrait; }` rules
  - Strips animations, adds `window.print()` on load
- Open via `Blob` + `window.open` (same pattern as existing `generatePDF`)
- Remove the old plain-text `handleDownloadPdf` and the `generatePDF` import (no longer needed for reports)

**Hardcoded spaced text replacements:**
- `"H O W  W E  G E T  T O  R O I"` becomes `"HOW WE GET TO ROI"` with `tracking-[0.35em]`
- `"T H E  D E A L"` becomes `"THE DEAL"` with `tracking-[0.35em]`
- `"T H E  R E T U R N"` becomes `"THE RETURN"` with `tracking-[0.35em]`

### Files Changed

- `src/components/project/ProjectReport.tsx` -- fix letter spacing, remove print button, upgrade PDF export to DOM-based clone
