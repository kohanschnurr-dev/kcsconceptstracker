export interface ReceiptLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  vendorName: string;
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

export interface InvoiceData {
  companyName: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  projectName: string;
  projectAddress: string;
  descriptionOfWork: string;
  lineItems: ReceiptLineItem[];
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentNotes: string;
}

export interface ScopeOfWorkData {
  companyName: string;
  recipientName: string;
  customerName: string;
  date: string;
  jobNumber: string;
  
  jobTitle: string;
  workItems: { text: string; amount: number; photos: string[] }[];
  
  exclusions: { text: string; amount: number; photos: string[] }[];
  materialsResponsibility: string;
  specialNotes: string;
}

export interface PdfOptions {
  docType: 'Invoice' | 'Receipt' | 'Scope of Work' | 'Contractor Directory' | 'Project Report';
  companyName: string;
  logoUrl?: string | null;
  receiptData?: ReceiptData;
  invoiceData?: InvoiceData;
  scopeOfWorkData?: ScopeOfWorkData;
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

  const now = new Date();
  const generatedAt = now.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const receiptDateFormatted = formatReceiptDate(r.receiptDate);
  const paymentDateFormatted = formatReceiptDate(r.paymentDate);
  const validItems = r.lineItems.filter(item => item.description || item.unitPrice > 0);

  const lineItemsHtml = validItems.length > 0
    ? validItems.map(item => `
        <div class="line-item">
          <span class="li-desc">${escapeHtml(item.description || 'Item')}</span>
          <span class="li-qty">${item.qty}&thinsp;&times;&thinsp;${escapeHtml(fmtCurrency(item.unitPrice))}</span>
          <span class="li-amt">${escapeHtml(fmtCurrency(item.total))}</span>
        </div>`).join('')
    : `<div class="line-item-empty">No line items added</div>`;

  const paymentRows: string[] = [];
  if (r.paymentMethod) paymentRows.push(`<div class="pd-row"><span class="pd-label">Payment Method</span><span class="pd-val">${escapeHtml(r.paymentMethod)}</span></div>`);
  if (paymentDateFormatted) paymentRows.push(`<div class="pd-row"><span class="pd-label">Payment Date</span><span class="pd-val">${escapeHtml(paymentDateFormatted)}</span></div>`);
  if (r.notes) paymentRows.push(`<div class="pd-row"><span class="pd-label">Notes</span><span class="pd-val">${escapeHtml(r.notes)}</span></div>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Receipt &mdash; ${escapeHtml(r.receiptNumber || 'RCP')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#F9FAFB;
      min-height:100vh;
      padding:40px 16px;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .wrap{max-width:680px;margin:0 auto;}
    .card{
      background:#fff;
      border:1px solid #E5E7EB;
      border-radius:16px;
      box-shadow:0 20px 60px rgba(0,0,0,0.09),0 4px 16px rgba(0,0,0,0.05);
      overflow:hidden;
    }

    /* ── HEADER ── */
    .hdr{padding:36px 40px 28px;border-bottom:1px solid #F3F4F6;background:#fff;}
    .hdr-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;}
    .doc-type{
      font-size:34px;font-weight:800;color:#111827;
      letter-spacing:0.1em;text-transform:uppercase;line-height:1;margin-bottom:10px;
    }
    .vendor-name{font-size:16px;font-weight:600;color:#374151;}
    .vendor-role{font-size:12px;font-weight:400;color:#9CA3AF;margin-top:3px;}
    .paid-badge{
      display:inline-flex;align-items:center;gap:7px;
      background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;
      border-radius:999px;padding:7px 16px;
      font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
      white-space:nowrap;flex-shrink:0;margin-top:4px;
    }
    .paid-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;}
    .meta-row{display:flex;gap:32px;flex-wrap:wrap;}
    .meta-lbl{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px;}
    .meta-val{font-size:13px;font-weight:600;color:#111827;}

    /* ── VALUE BOX ── */
    .vbox-wrap{padding:24px 40px;background:#F9FAFB;border-bottom:1px solid #F3F4F6;}
    .vbox{
      background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:12px;
      padding:28px 32px;text-align:center;
    }
    .vbox-lbl{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#8B5CF6;margin-bottom:10px;}
    .vbox-amt{font-size:52px;font-weight:800;color:#8B5CF6;letter-spacing:-2px;line-height:1;}
    .vbox-sub{font-size:11px;color:#A78BFA;margin-top:10px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:6px;}
    .vbox-check{
      display:inline-flex;align-items:center;justify-content:center;
      width:16px;height:16px;border-radius:50%;background:#8B5CF6;color:#fff;
      font-size:9px;font-weight:800;flex-shrink:0;
    }

    /* ── ENTITY ROW ── */
    .entity-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #F3F4F6;}
    .entity-cell{padding:20px 40px;}
    .entity-cell:first-child{border-right:1px solid #F3F4F6;}
    .ent-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px;}
    .ent-name{font-size:15px;font-weight:700;color:#111827;line-height:1.2;}
    .ent-role{font-size:11px;font-weight:400;color:#9CA3AF;margin-top:3px;}

    /* ── PROJECT BAND ── */
    .proj-band{padding:16px 40px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;display:flex;gap:40px;flex-wrap:wrap;}
    .proj-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px;}
    .proj-val{font-size:13px;font-weight:600;color:#111827;}

    /* ── LINE ITEMS ── */
    .li-section{padding:0 40px;}
    .li-section-hdr{
      font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;
      color:#9CA3AF;padding:20px 0 14px;border-bottom:1.5px solid #E5E7EB;
    }
    .li-cols-hdr{
      display:grid;grid-template-columns:1fr 160px 110px;
      gap:12px;padding:12px 0 10px;border-bottom:1px solid #F3F4F6;
    }
    .li-col-lbl{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;}
    .li-col-lbl.c{text-align:center;}
    .li-col-lbl.r{text-align:right;}
    .line-item{
      display:grid;grid-template-columns:1fr 160px 110px;
      gap:12px;align-items:center;
      padding:20px 0;border-bottom:1px solid #F9FAFB;
    }
    .line-item:last-child{border-bottom:none;}
    .li-desc{font-size:13.5px;font-weight:500;color:#111827;}
    .li-qty{font-size:12px;font-weight:400;color:#6B7280;text-align:center;}
    .li-amt{font-size:13.5px;font-weight:700;color:#111827;text-align:right;}
    .line-item-empty{padding:24px 0;text-align:center;font-size:13px;color:#9CA3AF;font-style:italic;}

    /* ── PAYMENT DETAILS ── */
    .pd-section{padding:20px 40px;border-top:1px solid #F3F4F6;background:#FAFAFA;}
    .pd-title{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;}
    .pd-row{display:flex;gap:16px;padding:5px 0;font-size:13px;}
    .pd-label{font-weight:600;color:#6B7280;min-width:130px;flex-shrink:0;}
    .pd-val{color:#111827;font-weight:400;}

    /* ── FOOTER ── */
    .ftr{
      padding:14px 40px;border-top:1px solid #F3F4F6;
      text-align:center;font-size:10px;font-weight:400;color:#D1D5DB;
      letter-spacing:0.02em;
    }

    /* ── RESPONSIVE ── */
    @media(max-width:600px){
      body{padding:0;background:#fff;}
      .card{border-radius:0;border:none;box-shadow:none;}
      .hdr{padding:28px 20px 22px;}
      .vbox-wrap,.proj-band,.li-section,.pd-section,.ftr{padding-left:20px;padding-right:20px;}
      .entity-cell{padding:16px 20px;}
      .doc-type{font-size:26px;}
      .vbox-amt{font-size:38px;letter-spacing:-1px;}
      .entity-row{grid-template-columns:1fr;}
      .entity-cell:first-child{border-right:none;border-bottom:1px solid #F3F4F6;}
      .li-cols-hdr,.line-item{grid-template-columns:1fr auto auto;}
      .vbox{padding:20px 18px;}
    }

    @media print{
      body{background:#fff;padding:0;}
      .wrap{max-width:100%;}
      .card{box-shadow:none;border-radius:0;border:none;}
      @page{size:A4 portrait;margin:0;}
    }
  </style>
</head>
<body>
<div class="wrap"><div class="card">

  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="doc-type">RECEIPT</div>
        <div class="vendor-name">${escapeHtml(r.vendorName || '—')}</div>
        <div class="vendor-role">Vendor &middot; Service Provider</div>
      </div>
      <div class="paid-badge">
        <div class="paid-dot"></div>
        PAID
      </div>
    </div>
    <div class="meta-row">
      ${r.receiptNumber ? `<div><div class="meta-lbl">Receipt No.</div><div class="meta-val">${escapeHtml(r.receiptNumber)}</div></div>` : ''}
      ${receiptDateFormatted ? `<div><div class="meta-lbl">Date</div><div class="meta-val">${escapeHtml(receiptDateFormatted)}</div></div>` : ''}
    </div>
  </div>

  <!-- VALUE BOX -->
  <div class="vbox-wrap">
    <div class="vbox">
      <div class="vbox-lbl">Total Paid</div>
      <div class="vbox-amt">${escapeHtml(fmtCurrency(r.total))}</div>
      <div class="vbox-sub">
        <span class="vbox-check">&#10003;</span>
        Payment confirmed
      </div>
    </div>
  </div>

  <!-- ENTITY ROW -->
  <div class="entity-row" style="grid-template-columns:1fr;">
    <div class="entity-cell" style="border-right:none;">
      <div class="ent-lbl">Received From (Vendor)</div>
      <div class="ent-name">${escapeHtml(r.vendorName || '—')}</div>
      <div class="ent-role">Contractor &middot; Service Provider</div>
    </div>
  </div>

  <!-- PROJECT BAND -->
  ${(r.projectName || r.descriptionOfWork) ? `
  <div class="proj-band">
    ${r.projectName ? `<div><div class="proj-lbl">Project</div><div class="proj-val">${escapeHtml(r.projectName)}</div></div>` : ''}
    ${r.descriptionOfWork ? `<div><div class="proj-lbl">Description of Work</div><div class="proj-val" style="font-weight:400;max-width:360px;">${escapeHtml(r.descriptionOfWork)}</div></div>` : ''}
  </div>` : ''}

  <!-- LINE ITEMS -->
  <div class="li-section">
    <div class="li-section-hdr">Line Items</div>
    ${validItems.length > 0 ? `
    <div class="li-cols-hdr">
      <span class="li-col-lbl">Description</span>
      <span class="li-col-lbl c">Qty &times; Rate</span>
      <span class="li-col-lbl r">Amount</span>
    </div>` : ''}
    ${lineItemsHtml}
  </div>

  <!-- PAYMENT DETAILS -->
  ${paymentRows.length > 0 ? `
  <div class="pd-section">
    <div class="pd-title">Payment Details</div>
    ${paymentRows.join('')}
  </div>` : ''}

  <!-- FOOTER -->
  <div class="ftr">Generated on ${escapeHtml(generatedAt)}</div>

</div></div>
<script>
  var imgs=document.querySelectorAll('img');
  var total=imgs.length;
  if(total===0){setTimeout(function(){window.print();},600);}
  else{
    var loaded=0;
    function tryPrint(){loaded++;if(loaded>=total)setTimeout(function(){window.print();},600);}
    imgs.forEach(function(img){if(img.complete){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;}});
  }
</script>
</body>
</html>`;
}

function generateInvoicePdfHtml(options: PdfOptions): string {
  const inv = options.invoiceData!;
  const now = new Date();
  const generatedAt = now.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const fmtDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const invoiceDateFormatted = fmtDate(inv.invoiceDate);
  const dueDateFormatted = fmtDate(inv.dueDate);
  const validItems = inv.lineItems.filter(item => item.description || item.unitPrice > 0);

  const lineItemsHtml = validItems.length > 0
    ? validItems.map(item => `
        <div class="line-item">
          <span class="li-desc">${escapeHtml(item.description || 'Item')}</span>
          <span class="li-qty">${item.qty}&thinsp;&times;&thinsp;${escapeHtml(fmtCurrency(item.unitPrice))}</span>
          <span class="li-amt">${escapeHtml(fmtCurrency(item.total))}</span>
        </div>`).join('')
    : `<div class="line-item-empty">No line items added</div>`;

  const paymentRows: string[] = [];
  if (inv.paymentMethod) paymentRows.push(`<div class="pd-row"><span class="pd-label">Payment Method</span><span class="pd-val">${escapeHtml(inv.paymentMethod)}</span></div>`);
  if (inv.paymentNotes) paymentRows.push(`<div class="pd-row"><span class="pd-label">Notes</span><span class="pd-val">${escapeHtml(inv.paymentNotes)}</span></div>`);

  const hasDueDate = !!inv.dueDate;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice &mdash; ${escapeHtml(inv.invoiceNumber || 'INV')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#F9FAFB;
      min-height:100vh;
      padding:40px 16px;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .wrap{max-width:680px;margin:0 auto;}
    .card{
      background:#fff;
      border:1px solid #E5E7EB;
      border-radius:16px;
      box-shadow:0 20px 60px rgba(0,0,0,0.09),0 4px 16px rgba(0,0,0,0.05);
      overflow:hidden;
    }

    .hdr{padding:36px 40px 28px;border-bottom:1px solid #F3F4F6;background:#fff;}
    .hdr-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;}
    .doc-type{
      font-size:34px;font-weight:800;color:#111827;
      letter-spacing:0.1em;text-transform:uppercase;line-height:1;margin-bottom:10px;
    }
    .company-name{font-size:16px;font-weight:600;color:#374151;}
    .company-role{font-size:12px;font-weight:400;color:#9CA3AF;margin-top:3px;}
    .status-badge{
      display:inline-flex;align-items:center;gap:7px;
      background:#FEF3C7;color:#B45309;border:1px solid #FDE68A;
      border-radius:999px;padding:7px 16px;
      font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
      white-space:nowrap;flex-shrink:0;margin-top:4px;
    }
    .status-dot{width:7px;height:7px;border-radius:50%;background:#F59E0B;flex-shrink:0;}
    .meta-row{display:flex;gap:32px;flex-wrap:wrap;}
    .meta-lbl{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px;}
    .meta-val{font-size:13px;font-weight:600;color:#111827;}

    .vbox-wrap{padding:24px 40px;background:#F9FAFB;border-bottom:1px solid #F3F4F6;}
    .vbox{
      background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:12px;
      padding:28px 32px;text-align:center;
    }
    .vbox-lbl{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#EA580C;margin-bottom:10px;}
    .vbox-amt{font-size:52px;font-weight:800;color:#EA580C;letter-spacing:-2px;line-height:1;}
    .vbox-sub{font-size:11px;color:#FB923C;margin-top:10px;font-weight:500;display:flex;align-items:center;justify-content:center;gap:6px;}

    .entity-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #F3F4F6;}
    .entity-cell{padding:20px 40px;}
    .entity-cell:first-child{border-right:1px solid #F3F4F6;}
    .ent-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px;}
    .ent-name{font-size:15px;font-weight:700;color:#111827;line-height:1.2;}
    .ent-role{font-size:11px;font-weight:400;color:#9CA3AF;margin-top:3px;}

    .proj-band{padding:16px 40px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;display:flex;gap:40px;flex-wrap:wrap;}
    .proj-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px;}
    .proj-val{font-size:13px;font-weight:600;color:#111827;}

    .li-section{padding:0 40px;}
    .li-section-hdr{
      font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;
      color:#9CA3AF;padding:20px 0 14px;border-bottom:1.5px solid #E5E7EB;
    }
    .li-cols-hdr{
      display:grid;grid-template-columns:1fr 160px 110px;
      gap:12px;padding:12px 0 10px;border-bottom:1px solid #F3F4F6;
    }
    .li-col-lbl{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;}
    .li-col-lbl.c{text-align:center;}
    .li-col-lbl.r{text-align:right;}
    .line-item{
      display:grid;grid-template-columns:1fr 160px 110px;
      gap:12px;align-items:center;
      padding:20px 0;border-bottom:1px solid #F9FAFB;
    }
    .line-item:last-child{border-bottom:none;}
    .li-desc{font-size:13.5px;font-weight:500;color:#111827;}
    .li-qty{font-size:12px;font-weight:400;color:#6B7280;text-align:center;}
    .li-amt{font-size:13.5px;font-weight:700;color:#111827;text-align:right;}
    .line-item-empty{padding:24px 0;text-align:center;font-size:13px;color:#9CA3AF;font-style:italic;}

    .totals-section{padding:20px 40px;border-top:1px solid #F3F4F6;background:#FAFAFA;}
    .totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;}
    .totals-row.final{border-top:1.5px solid #E5E7EB;padding-top:12px;margin-top:6px;}
    .totals-label{color:#6B7280;font-weight:500;}
    .totals-label.final{color:#111827;font-weight:700;font-size:14px;}
    .totals-val{font-weight:600;color:#111827;}
    .totals-val.final{font-weight:800;font-size:16px;color:#EA580C;}

    .pd-section{padding:20px 40px;border-top:1px solid #F3F4F6;background:#FAFAFA;}
    .pd-title{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;}
    .pd-row{display:flex;gap:16px;padding:5px 0;font-size:13px;}
    .pd-label{font-weight:600;color:#6B7280;min-width:130px;flex-shrink:0;}
    .pd-val{color:#111827;font-weight:400;}

    .ftr{
      padding:14px 40px;border-top:1px solid #F3F4F6;
      text-align:center;font-size:10px;font-weight:400;color:#D1D5DB;
      letter-spacing:0.02em;
    }

    @media(max-width:600px){
      body{padding:0;background:#fff;}
      .card{border-radius:0;border:none;box-shadow:none;}
      .hdr{padding:28px 20px 22px;}
      .vbox-wrap,.proj-band,.li-section,.pd-section,.ftr,.totals-section{padding-left:20px;padding-right:20px;}
      .entity-cell{padding:16px 20px;}
      .doc-type{font-size:26px;}
      .vbox-amt{font-size:38px;letter-spacing:-1px;}
      .entity-row{grid-template-columns:1fr;}
      .entity-cell:first-child{border-right:none;border-bottom:1px solid #F3F4F6;}
      .li-cols-hdr,.line-item{grid-template-columns:1fr auto auto;}
      .vbox{padding:20px 18px;}
    }

    @media print{
      body{background:#fff;padding:0;}
      .wrap{max-width:100%;}
      .card{box-shadow:none;border-radius:0;border:none;}
      @page{size:A4 portrait;margin:0;}
    }
  </style>
</head>
<body>
<div class="wrap"><div class="card">

  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="doc-type">INVOICE</div>
        <div class="company-name">${escapeHtml(inv.companyName || '—')}</div>
        
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        ${hasDueDate ? 'DUE' : 'PENDING'}
      </div>
    </div>
    <div class="meta-row">
      ${inv.invoiceNumber ? `<div><div class="meta-lbl">Invoice No.</div><div class="meta-val">${escapeHtml(inv.invoiceNumber)}</div></div>` : ''}
      ${invoiceDateFormatted ? `<div><div class="meta-lbl">Date</div><div class="meta-val">${escapeHtml(invoiceDateFormatted)}</div></div>` : ''}
      ${dueDateFormatted ? `<div><div class="meta-lbl">Due Date</div><div class="meta-val">${escapeHtml(dueDateFormatted)}</div></div>` : ''}
    </div>
  </div>

  <div class="vbox-wrap">
    <div class="vbox">
      <div class="vbox-lbl">Amount Due</div>
      <div class="vbox-amt">${escapeHtml(fmtCurrency(inv.total))}</div>
      <div class="vbox-sub">
        ${hasDueDate ? `Due by ${escapeHtml(dueDateFormatted)}` : 'Upon receipt'}
      </div>
    </div>
  </div>

  <div class="entity-row">
    <div class="entity-cell">
      <div class="ent-lbl">From</div>
      <div class="ent-name">${escapeHtml(inv.companyName || '—')}</div>
      <div class="ent-role">Contractor</div>
    </div>
    <div class="entity-cell">
      <div class="ent-lbl">Bill To</div>
      <div class="ent-name">${escapeHtml(inv.clientName || '—')}</div>
      <div class="ent-role">Client &middot; Property Owner</div>
    </div>
  </div>

  ${(inv.projectName || inv.projectAddress || inv.descriptionOfWork) ? `
  <div class="proj-band">
    ${inv.projectName ? `<div><div class="proj-lbl">Project</div><div class="proj-val">${escapeHtml(inv.projectName)}</div></div>` : ''}
    ${inv.projectAddress ? `<div><div class="proj-lbl">Address</div><div class="proj-val">${escapeHtml(inv.projectAddress)}</div></div>` : ''}
    ${inv.descriptionOfWork ? `<div><div class="proj-lbl">Description</div><div class="proj-val" style="font-weight:400;max-width:360px;">${escapeHtml(inv.descriptionOfWork)}</div></div>` : ''}
  </div>` : ''}

  <div class="li-section">
    <div class="li-section-hdr">Line Items</div>
    ${validItems.length > 0 ? `
    <div class="li-cols-hdr">
      <span class="li-col-lbl">Description</span>
      <span class="li-col-lbl c">Qty &times; Rate</span>
      <span class="li-col-lbl r">Amount</span>
    </div>` : ''}
    ${lineItemsHtml}
  </div>

  <div class="totals-section">
    <div class="totals-row">
      <span class="totals-label">Subtotal</span>
      <span class="totals-val">${escapeHtml(fmtCurrency(inv.subtotal))}</span>
    </div>
    ${inv.taxRate > 0 ? `
    <div class="totals-row">
      <span class="totals-label">Tax (${inv.taxRate}%)</span>
      <span class="totals-val">${escapeHtml(fmtCurrency(inv.taxAmount))}</span>
    </div>` : ''}
    <div class="totals-row final">
      <span class="totals-label final">Total Due</span>
      <span class="totals-val final">${escapeHtml(fmtCurrency(inv.total))}</span>
    </div>
  </div>

  ${paymentRows.length > 0 ? `
  <div class="pd-section">
    <div class="pd-title">Payment Information</div>
    ${paymentRows.join('')}
  </div>` : ''}

  <div class="ftr">Generated on ${escapeHtml(generatedAt)}</div>

</div></div>
<script>
  var imgs=document.querySelectorAll('img');
  var total=imgs.length;
  if(total===0){setTimeout(function(){window.print();},600);}
  else{
    var loaded=0;
    function tryPrint(){loaded++;if(loaded>=total)setTimeout(function(){window.print();},600);}
    imgs.forEach(function(img){if(img.complete){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;}});
  }
</script>
</body>
</html>`;
}

function generateScopeOfWorkPdfHtml(options: PdfOptions): string {
  const sow = options.scopeOfWorkData!;
  const now = new Date();
  const generatedAt = now.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const fmtDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const sowDateFormatted = fmtDate(sow.date);

  const renderWorkSection = (items: { text: string; amount: number; photos: string[] }[], title: string) => {
    const filled = items.filter(i => i.text);
    if (filled.length === 0) return '';
    const subtotal = filled.reduce((s, i) => s + (i.amount || 0), 0);
    return `
      <div class="work-section">
        <div class="ws-hdr">${escapeHtml(title)}</div>
        ${filled.map(item => `
          <div class="work-item">
            <span class="wi-text">${escapeHtml(item.text)}</span>
            ${item.amount > 0 ? `<span class="wi-amt">${escapeHtml(fmtCurrency(item.amount))}</span>` : '<span></span>'}
          </div>
          ${item.photos.length > 0 ? `
          <div class="wi-photos">
            ${item.photos.map(url => `<img src="${escapeHtml(url)}" class="wi-photo" style="cursor:pointer;" onclick="openLightbox(this.src)" />`).join('')}
          </div>` : ''}
        `).join('')}
        ${subtotal > 0 ? `
        <div class="ws-subtotal">
          <span>Subtotal</span>
          <span>${escapeHtml(fmtCurrency(subtotal))}</span>
        </div>` : ''}
      </div>`;
  };

  const workTotal = sow.workItems.filter(i => i.text).reduce((s, i) => s + (i.amount || 0), 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scope of Work &mdash; ${escapeHtml(sow.jobNumber || sow.jobTitle || 'SOW')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#F9FAFB;
      min-height:100vh;
      padding:40px 16px;
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .wrap{max-width:680px;margin:0 auto;}
    .card{
      background:#fff;
      border:1px solid #E5E7EB;
      border-radius:16px;
      box-shadow:0 20px 60px rgba(0,0,0,0.09),0 4px 16px rgba(0,0,0,0.05);
      overflow:hidden;
    }

    .hdr{padding:36px 40px 28px;border-bottom:1px solid #F3F4F6;background:#fff;}
    .hdr-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;}
    .doc-type{
      font-size:30px;font-weight:800;color:#111827;
      letter-spacing:0.08em;text-transform:uppercase;line-height:1;margin-bottom:10px;
    }
    .company-name{font-size:16px;font-weight:600;color:#374151;}
    .company-role{font-size:12px;font-weight:400;color:#9CA3AF;margin-top:3px;}
    .doc-badge{
      display:inline-flex;align-items:center;gap:7px;
      background:#DBEAFE;color:#1D4ED8;border:1px solid #BFDBFE;
      border-radius:999px;padding:7px 16px;
      font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
      white-space:nowrap;flex-shrink:0;margin-top:4px;
    }
    .doc-badge-dot{width:7px;height:7px;border-radius:50%;background:#3B82F6;flex-shrink:0;}
    .meta-row{display:flex;gap:32px;flex-wrap:wrap;}
    .meta-lbl{font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px;}
    .meta-val{font-size:13px;font-weight:600;color:#111827;}

    .entity-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #F3F4F6;}
    .entity-cell{padding:20px 40px;}
    .entity-cell:first-child{border-right:1px solid #F3F4F6;}
    .ent-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px;}
    .ent-name{font-size:15px;font-weight:700;color:#111827;line-height:1.2;}
    .ent-role{font-size:11px;font-weight:400;color:#9CA3AF;margin-top:3px;}

    .detail-band{padding:16px 40px;background:#FAFAFA;border-bottom:1px solid #F3F4F6;display:flex;gap:32px;flex-wrap:wrap;}
    .detail-lbl{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:4px;}
    .detail-val{font-size:13px;font-weight:600;color:#111827;}
    .trade-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;}
    .trade-tag{
      background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;
      border-radius:999px;padding:4px 12px;font-size:11px;font-weight:600;
    }

    ${workTotal > 0 ? `
    .vbox-wrap{padding:24px 40px;background:#F9FAFB;border-bottom:1px solid #F3F4F6;}
    .vbox{
      background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:12px;
      padding:28px 32px;text-align:center;
    }
    .vbox-lbl{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#1D4ED8;margin-bottom:10px;}
    .vbox-amt{font-size:48px;font-weight:800;color:#1D4ED8;letter-spacing:-2px;line-height:1;}
    .vbox-sub{font-size:11px;color:#60A5FA;margin-top:10px;font-weight:500;}
    ` : ''}

    .work-section{padding:0 40px;margin-bottom:4px;}
    .ws-hdr{
      font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;
      color:#9CA3AF;padding:20px 0 14px;border-bottom:1.5px solid #E5E7EB;
    }
    .work-item{
      display:grid;grid-template-columns:1fr auto;
      gap:12px;align-items:center;
      padding:16px 0;border-bottom:1px solid #F9FAFB;
    }
    .work-item:last-child{border-bottom:none;}
    .wi-text{font-size:13.5px;font-weight:500;color:#111827;}
    .wi-amt{font-size:13.5px;font-weight:700;color:#111827;text-align:right;}
    .wi-photos{display:flex;flex-wrap:wrap;gap:8px;padding:0 0 12px;border-bottom:1px solid #F9FAFB;}
    .wi-photo{width:80px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #E5E7EB;cursor:pointer;transition:opacity .15s;}
    .wi-photo:hover{opacity:.8;}
    .ws-subtotal{
      display:flex;justify-content:space-between;padding:12px 0;
      font-size:12px;font-weight:700;color:#6B7280;border-top:1px solid #E5E7EB;
    }

    .notes-section{padding:20px 40px;border-top:1px solid #F3F4F6;background:#FAFAFA;}
    .notes-title{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:12px;}
    .notes-row{display:flex;gap:16px;padding:5px 0;font-size:13px;}
    .notes-label{font-weight:600;color:#6B7280;min-width:130px;flex-shrink:0;}
    .notes-val{color:#111827;font-weight:400;}

    .ftr{
      padding:14px 40px;border-top:1px solid #F3F4F6;
      text-align:center;font-size:10px;font-weight:400;color:#D1D5DB;
      letter-spacing:0.02em;
    }

    @media(max-width:600px){
      body{padding:0;background:#fff;}
      .card{border-radius:0;border:none;box-shadow:none;}
      .hdr{padding:28px 20px 22px;}
      .detail-band,.work-section,.notes-section,.ftr,.vbox-wrap{padding-left:20px;padding-right:20px;}
      .entity-cell{padding:16px 20px;}
      .doc-type{font-size:24px;}
      .vbox-amt{font-size:36px;letter-spacing:-1px;}
      .entity-row{grid-template-columns:1fr;}
      .entity-cell:first-child{border-right:none;border-bottom:1px solid #F3F4F6;}
      .vbox{padding:20px 18px;}
    }

    @media print{
      body{background:#fff;padding:0;}
      .wrap{max-width:100%;}
      .card{box-shadow:none;border-radius:0;border:none;}
      @page{size:A4 portrait;margin:0;}
    }
  </style>
</head>
<body>
<div class="wrap"><div class="card">

  <div class="hdr">
    <div class="hdr-top">
      <div>
        <div class="doc-type">Scope of Work</div>
        <div class="company-name">${escapeHtml(sow.companyName || '—')}</div>
        
      </div>
      <div class="doc-badge">
        <div class="doc-badge-dot"></div>
        PROPOSAL
      </div>
    </div>
    <div class="meta-row">
      ${sow.jobNumber ? `<div><div class="meta-lbl">Job No.</div><div class="meta-val">${escapeHtml(sow.jobNumber)}</div></div>` : ''}
      ${sowDateFormatted ? `<div><div class="meta-lbl">Date</div><div class="meta-val">${escapeHtml(sowDateFormatted)}</div></div>` : ''}
      ${sow.jobTitle ? `<div><div class="meta-lbl">Job Title</div><div class="meta-val">${escapeHtml(sow.jobTitle)}</div></div>` : ''}
    </div>
  </div>

  <div class="entity-row">
    <div class="entity-cell">
      <div class="ent-lbl">From</div>
      <div class="ent-name">${escapeHtml(sow.companyName || '—')}</div>
      <div class="ent-role">Contractor</div>
    </div>
    <div class="entity-cell">
      <div class="ent-lbl">To</div>
      <div class="ent-name">${escapeHtml(sow.recipientName || sow.customerName || '—')}</div>
      ${sow.customerName && sow.recipientName ? `<div class="ent-role">${escapeHtml(sow.customerName)}</div>` : ''}
    </div>
  </div>


  ${workTotal > 0 ? `
  <div class="vbox-wrap">
    <div class="vbox">
      <div class="vbox-lbl">Estimated Total</div>
      <div class="vbox-amt">${escapeHtml(fmtCurrency(workTotal))}</div>
      <div class="vbox-sub">Work items &amp; included services</div>
    </div>
  </div>` : ''}

  ${renderWorkSection(sow.workItems, 'Work to Be Performed')}
  
  ${renderWorkSection(sow.exclusions, 'Not Included / Exclusions')}

  ${(sow.materialsResponsibility || sow.specialNotes) ? `
  <div class="notes-section">
    <div class="notes-title">Materials &amp; Notes</div>
    ${sow.materialsResponsibility ? `<div class="notes-row"><span class="notes-label">Materials</span><span class="notes-val">${escapeHtml(sow.materialsResponsibility)}</span></div>` : ''}
    ${sow.specialNotes ? `<div class="notes-row"><span class="notes-label">Special Notes</span><span class="notes-val">${escapeHtml(sow.specialNotes)}</span></div>` : ''}
  </div>` : ''}

  <div class="ftr">Generated on ${escapeHtml(generatedAt)}</div>

</div></div>
<script>
  var imgs=document.querySelectorAll('img');
  var total=imgs.length;
  if(total===0){setTimeout(function(){window.print();},600);}
  else{
    var loaded=0;
    function tryPrint(){loaded++;if(loaded>=total)setTimeout(function(){window.print();},600);}
    imgs.forEach(function(img){if(img.complete){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;}});
  }
</script>
<div id="lightbox-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;cursor:pointer;justify-content:center;align-items:center;" onclick="this.style.display='none'">
  <img id="lightbox-img" style="max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain;" />
</div>
<script>
function openLightbox(src){var o=document.getElementById('lightbox-overlay');var i=document.getElementById('lightbox-img');i.src=src;o.style.display='flex';}
</script>
</body>
</html>`;
}

export function generatePDFHtml(content: string, options: PdfOptions): string {
  // Route documents with structured data to their premium templates
  if (options.docType === 'Receipt' && options.receiptData) {
    return generateReceiptPdfHtml(options);
  }
  if (options.docType === 'Invoice' && options.invoiceData) {
    return generateInvoicePdfHtml(options);
  }
  if (options.docType === 'Scope of Work' && options.scopeOfWorkData) {
    return generateScopeOfWorkPdfHtml(options);
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
