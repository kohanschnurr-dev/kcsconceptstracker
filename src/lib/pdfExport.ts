export interface PdfOptions {
  docType: 'Invoice' | 'Receipt' | 'Scope of Work';
  companyName: string;
  logoUrl?: string | null;
}

function getActivePrimaryHsl(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim();
  return raw ? `hsl(${raw})` : 'hsl(35 65% 48%)';
}

function getActiveAccentHsl(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim();
  return raw ? `hsl(${raw})` : 'hsl(35 30% 92%)';
}

function isLightColor(hslString: string): boolean {
  const match = hslString.match(/hsl\(\s*[\d.]+\s+[\d.]+%\s+([\d.]+)%\s*\)/);
  if (match) return parseFloat(match[1]) > 58;
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generatePDF(content: string, options: PdfOptions): void {
  const primaryColor = getActivePrimaryHsl();
  const accentColor = getActiveAccentHsl();
  const headerTextColor = isLightColor(primaryColor) ? '#1a1a1a' : '#ffffff';
  const accentTextColor = isLightColor(accentColor) ? '#1a1a1a' : '#ffffff';

  // Convert primary to a lighter tint for section dividers
  const dividerColor = primaryColor.replace('hsl(', 'hsla(').replace(')', ', 0.15)');

  const logoHtml = options.logoUrl
    ? `<img src="${options.logoUrl}" style="max-height:52px; max-width:180px; object-fit:contain; display:block;" crossorigin="anonymous" />`
    : '';

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const docTypeIconMap: Record<string, string> = {
    Invoice: '&#128196;',
    Receipt: '&#129534;',
    'Scope of Work': '&#128203;',
  };
  const docIcon = docTypeIconMap[options.docType] || '&#128196;';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.docType)} — ${escapeHtml(options.companyName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── HEADER ─────────────────────────────────────────── */
    .header {
      background: ${primaryColor};
      color: ${headerTextColor};
      padding: 24px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 18px;
      flex: 1;
    }

    .header-logo-wrap {
      background: rgba(255,255,255,0.12);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
    }

    .header-text { display: flex; flex-direction: column; gap: 2px; }

    .header-company {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.3px;
      line-height: 1.1;
      color: ${headerTextColor};
    }

    .header-tagline {
      font-size: 11px;
      opacity: 0.7;
      font-weight: 400;
      letter-spacing: 0.3px;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .doc-badge {
      background: rgba(255,255,255,0.2);
      color: ${headerTextColor};
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }

    .doc-icon {
      font-size: 28px;
      opacity: 0.9;
    }

    /* ── META BAR ───────────────────────────────────────── */
    .meta-bar {
      background: ${accentColor};
      color: ${accentTextColor};
      padding: 10px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      border-bottom: 1px solid ${dividerColor};
    }

    .meta-bar span { opacity: 0.8; }

    /* ── CONTENT ────────────────────────────────────────── */
    .content {
      padding: 36px 40px 24px;
    }

    .doc-text {
      font-family: 'Courier New', 'Lucida Console', monospace;
      font-size: 12px;
      line-height: 1.75;
      white-space: pre-wrap;
      color: #2a2a2a;
      background: #fafafa;
      border: 1px solid #e8e8e8;
      border-left: 4px solid ${primaryColor};
      border-radius: 6px;
      padding: 24px 28px;
    }

    /* ── FOOTER ─────────────────────────────────────────── */
    .footer {
      border-top: 2px solid ${dividerColor};
      margin: 24px 40px 0;
      padding: 16px 0 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #888;
      font-size: 10.5px;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #555;
    }

    .footer-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: ${primaryColor};
      display: inline-block;
    }

    /* ── PRINT ──────────────────────────────────────────── */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 0; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      ${options.logoUrl ? `<div class="header-logo-wrap">${logoHtml}</div>` : ''}
      <div class="header-text">
        <div class="header-company">${escapeHtml(options.companyName)}</div>
        <div class="header-tagline">Professional Document</div>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-icon">${docIcon}</div>
      <div class="doc-badge">${escapeHtml(options.docType)}</div>
    </div>
  </div>

  <div class="meta-bar">
    <span>Prepared by ${escapeHtml(options.companyName)}</span>
    <span>Generated on ${dateStr}</span>
  </div>

  <div class="content">
    <div class="doc-text">${escapeHtml(content)}</div>
  </div>

  <div class="footer">
    <div class="footer-brand">
      <span class="footer-dot"></span>
      ${escapeHtml(options.companyName)}
    </div>
    <span>${escapeHtml(options.docType)} &middot; ${dateStr}</span>
  </div>

  <script>
    // Wait for logo (if any) to load before printing
    var imgs = document.querySelectorAll('img');
    var total = imgs.length;
    if (total === 0) {
      setTimeout(function() { window.print(); }, 300);
    } else {
      var loaded = 0;
      function tryPrint() {
        loaded++;
        if (loaded >= total) setTimeout(function() { window.print(); }, 300);
      }
      imgs.forEach(function(img) {
        if (img.complete) { tryPrint(); }
        else { img.onload = tryPrint; img.onerror = tryPrint; }
      });
    }
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
