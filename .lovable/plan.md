
# AI Document PDF Export — Themed, Branded, Professional

## What's Being Built

After the AI generates a document (Invoice, Receipt, or Scope of Work), a **"Download PDF"** button appears alongside the existing "Copy" button. Clicking it opens a styled, branded print preview in a new browser tab that the user can save as PDF using the browser's native "Save as PDF" option — no extra npm packages needed.

The PDF output will include:
- Company logo (if set in Settings)
- Company name
- Document content formatted in a clean, readable layout
- Accent color from the user's active color palette applied to the header bar and section dividers

---

## Technical Approach

### Why Browser Print (not jsPDF)

- No new dependencies to install
- Perfect text rendering and font handling
- Reliable across all operating systems
- Browser's "Save as PDF" produces true vector PDF

### How It Works

A `generatePDF(content, options)` utility function is created in `src/lib/pdfExport.ts`. It:

1. Reads the active palette's primary color from the document's CSS variables at the moment the button is clicked
2. Constructs a full HTML document string with:
   - Inline styles (no external CSS dependencies)
   - Logo displayed at the top-right as an `<img>` with a max height constraint
   - Company name in the header bar styled with the accent color
   - Document type label (Invoice / Receipt / Scope of Work)
   - The generated plain-text content rendered in a styled monospace block
   - Footer with company name and generation date
3. Opens a new tab with `window.open()`, writes the HTML, and calls `window.print()` after a short delay (to ensure images load)

### Palette Color Extraction

```typescript
// Read active palette primary color from computed CSS
function getActivePrimaryHsl(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim();
  return raw ? `hsl(${raw})` : '#b87f3b'; // fallback amber
}
```

This means whatever palette the user has active (Ember, Cobalt, Pearl, etc.) — that accent color flows into the PDF header automatically.

### Logo Handling

The `logoUrl` from `useCompanySettings` is a public Supabase Storage URL. It's embedded directly in the HTML as an `<img src="...">` tag. Because the print window is a new tab (same origin makes no difference for public URLs), the image loads correctly before `print()` is called.

If no logo is set, the header only shows the company name, centered.

---

## PDF Document Layout

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]              COMPANY NAME         [DocType] │  ← colored header bar
│                                                     │  (accent color background)
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Generated document text in clean mono font]       │
│                                                     │
│  Section headers in bold                            │
│  Content in regular weight                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Company Name · Generated on Feb 19, 2026           │  ← footer
└─────────────────────────────────────────────────────┘
```

---

## Files to Change

| File | Change |
|---|---|
| `src/lib/pdfExport.ts` | New — `generatePDF(text, options)` utility function |
| `src/components/project/GenerateInvoiceSheet.tsx` | Add "Download PDF" button + import pdfExport |
| `src/components/project/GenerateReceiptSheet.tsx` | Add "Download PDF" button + import pdfExport |
| `src/components/vendors/ScopeOfWorkSheet.tsx` | Add "Download PDF" button + import pdfExport |

No edge functions change. No new dependencies. No database changes.

---

## The `pdfExport.ts` Utility

```typescript
interface PdfOptions {
  docType: 'Invoice' | 'Receipt' | 'Scope of Work';
  companyName: string;
  logoUrl?: string | null;
}

export function generatePDF(content: string, options: PdfOptions) {
  const primaryColor = getActivePrimaryHsl();
  const isLight = isLightColor(primaryColor); // determines text color on header
  const headerTextColor = isLight ? '#1a1a1a' : '#ffffff';

  const logoHtml = options.logoUrl
    ? `<img src="${options.logoUrl}" style="max-height:48px; max-width:160px; object-fit:contain;" />`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${options.docType} — ${options.companyName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }
    .header { background: ${primaryColor}; color: ${headerTextColor}; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-company { font-size: 18px; font-weight: 700; }
    .header-type { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; }
    .content { padding: 32px; }
    .doc-text { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.7; white-space: pre-wrap; color: #1a1a1a; }
    .footer { border-top: 1px solid #e5e5e5; padding: 16px 32px; display: flex; justify-content: space-between; color: #888; font-size: 11px; margin-top: 24px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <span class="header-company">${options.companyName}</span>
    </div>
    <span class="header-type">${options.docType}</span>
  </div>
  <div class="content">
    <div class="doc-text">${escapeHtml(content)}</div>
  </div>
  <div class="footer">
    <span>${options.companyName}</span>
    <span>Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
```

### Color Utilities

To determine if the primary color is light or dark (so we can pick white or black header text):

```typescript
function getActivePrimaryHsl(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim();
  return raw ? `hsl(${raw})` : '#b87f3b';
}

function isLightColor(hslString: string): boolean {
  // Extract lightness from "hsl(H S% L%)"
  const match = hslString.match(/hsl\([\d.]+\s+[\d.]+%\s+([\d.]+)%\)/);
  if (match) return parseFloat(match[1]) > 60;
  return false;
}
```

---

## Button UI in Each Sheet

In the generated output section of each sheet, next to "Copy" and "Clear":

```tsx
import { Download } from 'lucide-react';
import { generatePDF } from '@/lib/pdfExport';

// In the output actions row:
<Button
  variant="outline"
  size="sm"
  onClick={() => generatePDF(generated, {
    docType: 'Invoice',
    companyName: companyName || 'Your Company',
    logoUrl: settings?.logo_url,
  })}
  className="gap-1.5 h-7 text-xs"
>
  <Download className="h-3 w-3" />
  PDF
</Button>
```

The button sits between Copy and Clear in the action bar, so the layout becomes:
```
[ Copy ]  [ PDF ]  [ Clear ]
```

---

## What Does NOT Change

- The AI generation logic (edge functions) — untouched
- The form fields, state management — untouched
- The text output block — untouched
- No new npm packages installed
- No database changes

---

## Palette Color Coverage

All 10 palettes are covered automatically since we read from computed CSS at runtime:

| Palette | Primary Color (approx) | Header Style |
|---|---|---|
| Ember | Warm amber | White text |
| Graphite | Steel gray | White text |
| Slate | Steel blue | White text |
| Onyx | Indigo | White text |
| Titanium | Light gray | Dark text |
| Midnight | Teal | White text |
| Cobalt | Blue | White text |
| Ivory | Warm tan | White text |
| Pearl | Blue-gray | White text |
| Linen | Near-black | White text |
