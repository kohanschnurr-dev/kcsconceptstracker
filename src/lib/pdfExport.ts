export interface ReceiptLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  vendorName: string;
  issuingCompany: string;
  receiptNumber: string;
  receiptDate: string;
  projectName: string;
  descriptionOfWork: string;
  lineItems: ReceiptLineItem[];
  paymentMethod: string;
  paymentDate: string;
  notes: string;
  total: number;
}

export interface PdfOptions {
  docType: 'Invoice' | 'Receipt' | 'Scope of Work' | 'Contractor Directory' | 'Project Report';
  companyName: string;
  logoUrl?: string | null;
  receiptData?: ReceiptData;
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

function fmtCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatReceiptDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateReceiptPdfHtml(options: PdfOptions): string {
  const r = options.receiptData!;
  const logoHtml = options.logoUrl
    ? `<img src="${options.logoUrl}" style="max-height:44px;max-width:110px;object-fit:contain;display:block;" crossorigin="anonymous" />`
    : '';

  const now = new Date();
  const generatedAt = now.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const receiptDateFormatted = formatReceiptDate(r.receiptDate);
  const paymentDateFormatted = formatReceiptDate(r.paymentDate);

  const validItems = r.lineItems.filter(item => item.description || item.unitPrice > 0);

  const rowsHtml = validItems.length > 0
    ? validItems.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8f9fb'};">
          <td style="padding:10px 16px;font-size:12.5px;color:#1a1a1a;font-family:'Inter','Segoe UI',sans-serif;border-bottom:1px solid #eaeaea;">
            ${escapeHtml(item.description || 'Item')}
          </td>
          <td style="padding:10px 16px;text-align:center;font-size:12.5px;color:#444;font-family:'Inter','Segoe UI',sans-serif;border-bottom:1px solid #eaeaea;">
            ${item.qty}
          </td>
          <td style="padding:10px 16px;text-align:right;font-size:12.5px;color:#444;font-family:'Inter','Segoe UI',sans-serif;border-bottom:1px solid #eaeaea;">
            ${fmtCurrency(item.unitPrice)}
          </td>
          <td style="padding:10px 16px;text-align:right;font-size:12.5px;font-weight:600;color:#1a1a1a;font-family:'Inter','Segoe UI',sans-serif;border-bottom:1px solid #eaeaea;">
            ${fmtCurrency(item.total)}
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#999;font-size:12px;font-family:'Inter','Segoe UI',sans-serif;">No line items</td></tr>`;

  const detailRows: string[] = [];
  if (r.paymentMethod) detailRows.push(`<div style="display:flex;gap:12px;padding:3px 0;font-size:12.5px;font-family:'Inter','Segoe UI',sans-serif;"><span style="min-width:130px;font-weight:600;color:#666;">Payment Method</span><span style="color:#1a1a1a;">${escapeHtml(r.paymentMethod)}</span></div>`);
  if (paymentDateFormatted) detailRows.push(`<div style="display:flex;gap:12px;padding:3px 0;font-size:12.5px;font-family:'Inter','Segoe UI',sans-serif;"><span style="min-width:130px;font-weight:600;color:#666;">Payment Date</span><span style="color:#1a1a1a;">${escapeHtml(paymentDateFormatted)}</span></div>`);
  if (r.notes) detailRows.push(`<div style="display:flex;gap:12px;padding:3px 0;font-size:12.5px;font-family:'Inter','Segoe UI',sans-serif;"><span style="min-width:130px;font-weight:600;color:#666;">Notes</span><span style="color:#1a1a1a;">${escapeHtml(r.notes)}</span></div>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Receipt — ${escapeHtml(r.receiptNumber || 'RCP')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #F2F4F7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 8px 48px rgba(0,0,0,0.12);
      border-radius: 4px;
      overflow: hidden;
    }
    .header {
      background: #0f172a;
      padding: 28px 36px 24px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      position: relative;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .header-logo-wrap {
      background: rgba(255,255,255,0.10);
      border-radius: 8px;
      padding: 6px 10px;
      display: flex;
      align-items: center;
    }
    .header-logo-placeholder {
      width: 40px; height: 40px;
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 900; color: #fff;
      font-family: 'Crimson Text', Georgia, serif;
    }
    .header-company {
      font-family: 'Crimson Text', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.3px;
      line-height: 1.1;
    }
    .header-subtitle {
      font-size: 10px;
      color: rgba(255,255,255,0.50);
      font-weight: 500;
      letter-spacing: 0.5px;
      margin-top: 3px;
    }
    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      flex-shrink: 0;
    }
    .paid-seal {
      width: 68px; height: 68px;
      border-radius: 50%;
      border: 3px solid #22c55e;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #22c55e;
      transform: rotate(-12deg);
      position: relative;
    }
    .paid-seal-text {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 2.5px;
      font-family: 'Inter', sans-serif;
      line-height: 1;
    }
    .paid-seal-sub {
      font-size: 7px;
      font-weight: 600;
      letter-spacing: 1px;
      opacity: 0.85;
      margin-top: 2px;
    }
    .receipt-meta {
      text-align: right;
    }
    .receipt-doc-title {
      font-family: 'Crimson Text', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .receipt-meta-detail {
      font-size: 11px;
      color: rgba(255,255,255,0.55);
      margin-top: 5px;
      font-weight: 500;
    }
    .receipt-meta-detail span {
      color: rgba(255,255,255,0.85);
      font-weight: 600;
    }

    /* Entity row */
    .entity-row {
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid #eaeaea;
    }
    .entity-cell {
      flex: 1;
      padding: 20px 28px;
    }
    .entity-cell:first-child {
      border-right: 1px solid #eaeaea;
    }
    .entity-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 5px;
    }
    .entity-name {
      font-family: 'Crimson Text', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
    }
    .entity-role {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
      font-weight: 500;
    }

    /* Project / description band */
    .project-band {
      background: #f8f9fb;
      border-bottom: 1px solid #eaeaea;
      padding: 14px 28px;
      display: flex;
      gap: 40px;
      flex-wrap: wrap;
    }
    .project-item {}
    .project-item-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 3px;
    }
    .project-item-value {
      font-size: 12.5px;
      font-weight: 600;
      color: #1a1a1a;
      font-family: 'Inter', sans-serif;
    }

    /* Table */
    .table-wrap {
      padding: 0 28px 4px;
    }
    table.line-items {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    table.line-items thead tr {
      background: #0f172a;
    }
    table.line-items thead th {
      padding: 10px 16px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.75);
      font-family: 'Inter', sans-serif;
      text-align: left;
    }
    table.line-items thead th:nth-child(2) { text-align: center; }
    table.line-items thead th:nth-child(3),
    table.line-items thead th:nth-child(4) { text-align: right; }

    /* Total paid */
    .total-section {
      padding: 0 28px 24px;
      display: flex;
      justify-content: flex-end;
    }
    .total-box {
      margin-top: 12px;
      background: #eff6ff;
      border: 2px solid #bfdbfe;
      border-radius: 12px;
      padding: 16px 24px;
      min-width: 260px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .total-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #1d4ed8;
      display: block;
    }
    .total-sublabel {
      font-size: 10px;
      color: #6b7280;
      margin-top: 2px;
      font-weight: 500;
    }
    .total-amount {
      font-family: 'Crimson Text', Georgia, serif;
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -1px;
      white-space: nowrap;
    }

    /* Payment details */
    .payment-section {
      padding: 16px 28px 20px;
      border-top: 1px solid #eaeaea;
      background: #fafafa;
    }
    .payment-section-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 10px;
    }

    /* Footer */
    .footer {
      background: #0f172a;
      padding: 12px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .footer-brand {
      font-size: 10.5px;
      color: rgba(255,255,255,0.50);
      font-weight: 500;
    }
    .footer-brand strong {
      color: rgba(255,255,255,0.80);
      font-weight: 700;
    }
    .footer-ts {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
    }

    @media print {
      body { background: #ffffff; }
      .page { box-shadow: none; max-width: 100%; border-radius: 0; }
      @page { size: A4 portrait; margin: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="header-brand">
        ${options.logoUrl
          ? `<div class="header-logo-wrap">${logoHtml}</div>`
          : `<div class="header-logo-placeholder">K</div>`
        }
        <div>
          <div class="header-company">${escapeHtml(r.issuingCompany)}</div>
          <div class="header-subtitle">PAYMENT PLATFORM</div>
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="receipt-meta">
        <div class="receipt-doc-title">Payment Receipt</div>
        <div class="receipt-meta-detail">Receipt <span>${escapeHtml(r.receiptNumber)}</span></div>
        ${receiptDateFormatted ? `<div class="receipt-meta-detail">Date <span>${escapeHtml(receiptDateFormatted)}</span></div>` : ''}
      </div>
      <div class="paid-seal">
        <div class="paid-seal-text">PAID</div>
        <div class="paid-seal-sub">CONFIRMED</div>
      </div>
    </div>
  </div>

  <!-- ENTITY ROW -->
  <div class="entity-row">
    <div class="entity-cell">
      <div class="entity-label">Receipt From (Vendor / Payee)</div>
      <div class="entity-name">${escapeHtml(r.vendorName || '—')}</div>
      <div class="entity-role">Contractor · Service Provider</div>
    </div>
    <div class="entity-cell">
      <div class="entity-label">Issued By (Platform)</div>
      <div class="entity-name">${escapeHtml(r.issuingCompany)}</div>
      <div class="entity-role">General Contractor · Document Issuer</div>
    </div>
  </div>

  <!-- PROJECT BAND -->
  ${(r.projectName || r.descriptionOfWork) ? `
  <div class="project-band">
    ${r.projectName ? `
    <div class="project-item">
      <div class="project-item-label">Project</div>
      <div class="project-item-value">${escapeHtml(r.projectName)}</div>
    </div>` : ''}
    ${r.descriptionOfWork ? `
    <div class="project-item">
      <div class="project-item-label">Description of Work</div>
      <div class="project-item-value" style="font-weight:400;max-width:400px;">${escapeHtml(r.descriptionOfWork)}</div>
    </div>` : ''}
  </div>` : ''}

  <!-- LINE ITEMS TABLE -->
  <div class="table-wrap">
    <table class="line-items">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- TOTAL PAID -->
  <div class="total-section">
    <div>
      <div class="total-box">
        <div>
          <span class="total-label">Total Paid</span>
          <span class="total-sublabel">All line items</span>
        </div>
        <span class="total-amount">${escapeHtml(fmtCurrency(r.total))}</span>
      </div>
    </div>
  </div>

  <!-- PAYMENT DETAILS -->
  ${detailRows.length > 0 ? `
  <div class="payment-section">
    <div class="payment-section-label">Payment Details</div>
    ${detailRows.join('')}
  </div>` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">Generated by <strong>KCS Concepts Systems</strong></div>
    <div class="footer-ts">${escapeHtml(generatedAt)}</div>
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

export function generatePDFHtml(content: string, options: PdfOptions): string {
  // Route Receipt documents with structured data to the premium receipt template
  if (options.docType === 'Receipt' && options.receiptData) {
    return generateReceiptPdfHtml(options);
  }

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
    'Project Report': '&#128202;',
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
