
## Replace the Document Icon with the Company Logo in the PDF Header

### What the User Is Saying

The screenshot shows the PDF header has a receipt emoji icon (🧾) in the top-right of the colored header bar. The user wants their **company logo from Settings** to appear there instead of that generic emoji.

### Root Cause

In `src/lib/pdfExport.ts`, the header is split into two sides:
- **Left side** (`header-left`): Shows the logo (if set) + company name text
- **Right side** (`header-right`): Shows the doc emoji icon + document type badge (e.g. "RECEIPT")

The current logic (lines 182–184 and 386–394) puts the logo on the **left** next to the company name. The user wants it to **replace the emoji on the right side** — making the logo the prominent visual on the right, and moving the document type badge below it.

### The Fix — One file only: `src/lib/pdfExport.ts`

**New header layout:**

```
[LEFT]                          [RIGHT]
Company Name                    [Company Logo Image]
Professional Document           RECEIPT  (badge below logo)
```

If no logo is set, fall back to the current emoji icon behavior (nothing breaks).

#### Specific changes:

1. **Remove logo from `header-left`** — the left side will only show the company name text (no logo wrap div on the left)

2. **Replace `doc-icon` div with the logo image on the right side** — when `logoUrl` is present:
   - Show `<img src="...">` styled to fit cleanly in the header-right area (white background pill/rounded container, max-height ~48px)
   - The "RECEIPT" / "INVOICE" badge stays below it as is

3. **Fallback** — when no `logoUrl`, keep showing the emoji icon exactly as before

#### CSS adjustments:
- The `header-logo-wrap` class on the right needs a white or semi-white background to make the logo pop against the colored header
- Give the logo image a `max-height: 48px; max-width: 110px` to stay proportional

#### Code change summary:

```html
<!-- BEFORE: right side -->
<div class="header-right">
  <div class="doc-icon">🧾</div>           ← emoji
  <div class="doc-badge">RECEIPT</div>
</div>

<!-- AFTER: right side -->
<div class="header-right">
  <!-- Show logo if available, otherwise show emoji -->
  ${options.logoUrl
    ? `<div class="header-logo-wrap"><img src="${options.logoUrl}" style="max-height:48px;max-width:110px;object-fit:contain;" /></div>`
    : `<div class="doc-icon">${docIcon}</div>`
  }
  <div class="doc-badge">${options.docType}</div>
</div>
```

And remove the logo from the left side entirely:
```html
<!-- BEFORE: left side -->
<div class="header-left">
  ${options.logoUrl ? `<div class="header-logo-wrap">${logoHtml}</div>` : ''}
  <div class="header-text">...</div>
</div>

<!-- AFTER: left side -->
<div class="header-left">
  <div class="header-text">...</div>      ← logo removed from here
</div>
```

### Result

- Company logo appears in the top-right of the colored header bar (where the emoji was)
- If no logo is uploaded in Settings, the emoji icon gracefully shows as fallback
- No changes needed to any sheet components — the `logoUrl` is already being passed correctly from `useCompanySettings`
- Works for Invoice, Receipt, and Scope of Work PDFs
