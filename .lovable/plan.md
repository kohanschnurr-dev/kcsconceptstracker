
## Remove Redundant Text from PDF Header & Meta Bar

Two small removals in `src/lib/pdfExport.ts`:

1. **Remove "Professional Document" tagline** — delete the `.header-tagline` div inside `.header-text`
2. **Remove "Prepared by KCS Concepts"** — delete the left `<span>` from the `.meta-bar` (keep only the "Generated on [date]" on the right)

### Changes

**Header text** (remove tagline line):
```html
<!-- BEFORE -->
<div class="header-company">KCS Concepts</div>
<div class="header-tagline">Professional Document</div>

<!-- AFTER -->
<div class="header-company">KCS Concepts</div>
```

**Meta bar** (remove "Prepared by" span):
```html
<!-- BEFORE -->
<div class="meta-bar">
  <span>Prepared by <strong>KCS Concepts</strong></span>
  <span>Generated on February 19, 2026</span>
</div>

<!-- AFTER -->
<div class="meta-bar">
  <span>Generated on February 19, 2026</span>
</div>
```

Single file: `src/lib/pdfExport.ts`
