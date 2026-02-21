export interface PdfOptions {
  docType: 'Invoice' | 'Receipt' | 'Scope of Work' | 'Contractor Directory';
  companyName: string;
  logoUrl?: string | null;
}

function getActivePrimaryHsl(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim();
  return raw ? `hsl(${raw})` : 'hsl(35 65% 48%)';
}

function getActivePrimaryRaw(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--primary').trim() || '35 65% 48%';
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

function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 70) return false;
  // All caps, no lowercase letters, at least 3 chars, not just symbols
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !/^\W+$/.test(trimmed);
}

function isDividerLine(line: string): boolean {
  return /^[-=─━_]{3,}$/.test(line.trim());
}

function isTotalLine(line: string): boolean {
  const trimmed = line.trim().toUpperCase();
  return (
    trimmed.startsWith('TOTAL') ||
    trimmed.startsWith('AMOUNT DUE') ||
    trimmed.startsWith('BALANCE DUE') ||
    trimmed.startsWith('GRAND TOTAL') ||
    (trimmed.includes('TOTAL') && /\$[\d,]+/.test(line))
  );
}

function buildTotalBox(items: {label: string; amount: string}[], primaryColor: string, primaryRaw: string): string {
  return `
    <div style="
      margin-top:12px;
      background: hsl(${primaryRaw}/0.08);
      border:1.5px solid hsl(${primaryRaw}/0.3);
      border-radius:10px;
      padding:14px 20px;
      display:flex;
      flex-direction:column;
      gap:8px;
    ">
      ${items.map((item, i) => `
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          ${i < items.length - 1 ? `border-bottom:1px solid hsl(${primaryRaw}/0.15);padding-bottom:8px;` : ''}
        ">
          <span style="
            font-size:${i === items.length - 1 ? '12px' : '11px'};
            font-weight:700;
            letter-spacing:0.12em;
            text-transform:uppercase;
            color:${primaryColor};
            font-family:'Inter','Segoe UI',sans-serif;
          ">${escapeHtml(item.label)}</span>
          <span style="
            font-size:${i === items.length - 1 ? '20px' : '15px'};
            font-weight:800;
            color:#1a1a1a;
            font-family:'Inter','Segoe UI',sans-serif;
            letter-spacing:-0.5px;
          ">${escapeHtml(item.amount)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderContent(content: string, primaryColor: string, primaryRaw: string): string {
  const lines = content.split('\n');
  const htmlParts: string[] = [];
  let lastWasBlank = false;
  const pendingTotalItems: {label: string; amount: string}[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (!lastWasBlank) {
        htmlParts.push('<div style="height:4px;"></div>');
      }
      lastWasBlank = true;
      continue;
    }
    lastWasBlank = false;

    if (isDividerLine(trimmed)) {
      htmlParts.push(`<hr style="border:none;border-top:1px solid hsl(${primaryRaw}/0.2);margin:10px 0;" />`);
      continue;
    }

    if (isTotalLine(trimmed)) {
      const dollarMatch = trimmed.match(/\$[\d,]+\.?\d*/);
      const amount = dollarMatch ? dollarMatch[0] : '';
      const label = trimmed.replace(/\$[\d,]+\.?\d*/, '').replace(/[:]+$/, '').trim() || 'TOTAL AMOUNT';
      pendingTotalItems.push({ label, amount });
      continue;
    }

    // If we collected total items and now hit a non-total line, flush them inline
    if (pendingTotalItems.length > 0) {
      htmlParts.push(buildTotalBox(pendingTotalItems, primaryColor, primaryRaw));
      pendingTotalItems.length = 0;
    }

    if (isSectionHeader(trimmed)) {
      htmlParts.push(`
        <div style="margin-top:16px;margin-bottom:6px;">
          <div style="
            font-size:10px;
            font-weight:700;
            letter-spacing:0.15em;
            text-transform:uppercase;
            color:${primaryColor};
            font-family:'Inter','Segoe UI',sans-serif;
            padding-bottom:5px;
            border-bottom:1.5px solid hsl(${primaryRaw}/0.25);
          ">${escapeHtml(trimmed)}</div>
        </div>
      `);
      continue;
    }

    // Regular line — check if it looks like a key: value pair
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && colonIdx < 30 && colonIdx < trimmed.length - 1) {
      const key = trimmed.substring(0, colonIdx).trim();
      const val = trimmed.substring(colonIdx + 1).trim();
      if (!key.includes('  ') && key.split(' ').length <= 4) {
        htmlParts.push(`
          <div style="display:flex;gap:12px;padding:2px 0;line-height:1.5;font-size:12.5px;color:#2C2C2C;font-family:'Inter','Segoe UI',sans-serif;">
            <span style="min-width:130px;font-weight:600;color:#555;flex-shrink:0;">${escapeHtml(key)}</span>
            <span style="color:#2C2C2C;">${escapeHtml(val)}</span>
          </div>
        `);
        continue;
      }
    }

    htmlParts.push(`<p style="margin:2px 0;line-height:1.6;font-size:12.5px;color:#2C2C2C;font-family:'Inter','Segoe UI',sans-serif;">${escapeHtml(trimmed)}</p>`);
  }

  // Flush any remaining total items at the end
  if (pendingTotalItems.length > 0) {
    htmlParts.push(buildTotalBox(pendingTotalItems, primaryColor, primaryRaw));
  }

  return htmlParts.join('\n');
}

export function generatePDFHtml(content: string, options: PdfOptions): string {
  const primaryColor = getActivePrimaryHsl();
  const primaryRaw = getActivePrimaryRaw();
  const headerTextColor = isLightColor(primaryColor) ? '#1a1a1a' : '#ffffff';

  const logoHtml = options.logoUrl
    ? `<img src="${options.logoUrl}" style="max-height:52px;max-width:120px;object-fit:contain;display:block;" crossorigin="anonymous" />`
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
    'Contractor Directory': '&#128101;',
  };
  const docIcon = docTypeIconMap[options.docType] || '&#128196;';

  const renderedContent = renderContent(content, primaryColor, primaryRaw);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.docType)} — ${escapeHtml(options.companyName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 12.5px;
      color: #2C2C2C;
      background: #F9F7F4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 4px 40px rgba(0,0,0,0.10);
    }

    .header {
      background: ${primaryColor};
      color: ${headerTextColor};
      padding: 20px 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .header-logo-wrap {
      background: rgba(255,255,255,0.15);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-company {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.4px;
      line-height: 1.1;
      color: ${headerTextColor};
    }

    .header-tagline {
      font-size: 10px;
      opacity: 0.65;
      font-weight: 400;
      font-style: italic;
      letter-spacing: 0.2px;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      flex-shrink: 0;
    }

    .doc-icon {
      font-size: 24px;
      opacity: 0.85;
      line-height: 1;
    }

    .doc-badge {
      background: rgba(255,255,255,0.20);
      color: ${headerTextColor};
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.6px;
      border: 1px solid rgba(255,255,255,0.25);
    }

    .meta-bar {
      background: hsl(${primaryRaw} / 0.07);
      padding: 8px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #666;
      border-bottom: 1.5px solid hsl(${primaryRaw} / 0.15);
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .content-wrapper {
      padding: 20px 36px 24px;
      background: #F9F7F4;
    }

    .content-card {
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.07);
      border-left: 4px solid ${primaryColor};
      padding: 24px 32px;
    }

    .footer {
      margin: 0 36px;
      padding: 12px 0 16px;
      border-top: 1.5px solid hsl(${primaryRaw} / 0.18);
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #999;
      font-size: 10px;
      font-weight: 500;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-weight: 600;
    }

    .footer-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: ${primaryColor};
      display: inline-block;
      flex-shrink: 0;
    }

    @media print {
      body {
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        box-shadow: none;
        max-width: 100%;
        min-height: unset;
      }
      @page { size: A4 portrait; margin: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="header-text">
        <div class="header-company">${escapeHtml(options.companyName)}</div>
        
      </div>
    </div>
    <div class="header-right">
      ${options.logoUrl
        ? `<div class="header-logo-wrap">${logoHtml}</div>`
        : `<div class="doc-icon">${docIcon}</div>`
      }
      <div class="doc-badge">${escapeHtml(options.docType)}</div>
    </div>
  </div>

  <div class="meta-bar">
    <span>Generated on ${dateStr}</span>
  </div>

  <div class="content-wrapper">
    <div class="content-card">
      ${renderedContent}
    </div>
  </div>

  <div class="footer">
    <div class="footer-brand">
      <span class="footer-dot"></span>
      <span>${escapeHtml(options.companyName)}</span>
      <span style="color:#ccc;">&middot;</span>
      <span>${escapeHtml(options.docType)}</span>
    </div>
    <span>${dateStr}</span>
  </div>

</div>

<script>
  var imgs = document.querySelectorAll('img');
  var total = imgs.length;
  if (total === 0) {
    setTimeout(function() { window.print(); }, 600);
  } else {
    var loaded = 0;
    function tryPrint() {
      loaded++;
      if (loaded >= total) setTimeout(function() { window.print(); }, 600);
    }
    imgs.forEach(function(img) {
      if (img.complete) { tryPrint(); }
      else { img.onload = tryPrint; img.onerror = tryPrint; }
    });
  }
</script>
</body>
</html>`;
}

export function generatePDF(content: string, options: PdfOptions): void {
  const html = generatePDFHtml(content, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
