import type { RentalFieldValues } from '@/components/budget/RentalFields';

export interface BudgetPdfData {
  dealName: string;
  dealDescription?: string;
  companyName?: string | null;
  logoUrl?: string | null;
  calculatorType: 'fix_flip' | 'rental' | 'new_construction';

  purchasePrice: number;
  arv: number;
  sqft: number;
  totalBudget: number;

  maoPercentage: number;
  maxOffer: number;

  closingCostsBuy: number;
  holdingCosts: number;
  closingCostsSell: number;
  includeSellClosingCosts: boolean;
  closingLabel: string;
  holdingLabel: string;
  sellClosingLabel: string;

  totalInvestment: number;
  totalCosts: number;
  grossProfit: number;
  roi: number;

  lineItems: { label: string; amount: number }[];
  rentalFields: RentalFieldValues;
}

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function row(label: string, value: string, opts: { bold?: boolean; divider?: boolean; color?: 'positive' | 'negative' | '' } = {}) {
  const cls = [opts.bold ? 'bold' : '', opts.divider ? 'divider' : ''].filter(Boolean).join(' ');
  return `<tr class="${cls}"><td>${esc(label)}</td><td class="${opts.color || ''}">${esc(value)}</td></tr>`;
}

function sectionTable(title: string, rows: string[]) {
  return `
  <div class="section-title">${esc(title)}</div>
  <table><tbody>${rows.join('')}</tbody></table>`;
}

function rentalMath(d: BudgetPdfData) {
  const r = d.rentalFields;
  const monthlyRent = parseFloat(r.monthlyRent) || 0;
  const vacancyRate = (parseFloat(r.vacancyRate) || 5) / 100;
  const annualTaxes = parseFloat(r.annualTaxes) || 0;
  const annualInsurance = parseFloat(r.annualInsurance) || 0;
  const annualHoa = parseFloat(r.annualHoa) || 0;
  const monthlyMaintenance = parseFloat(r.monthlyMaintenance) || 0;
  const managementRate = (parseFloat(r.managementRate) || 0) / 100;

  const loanAmount = r.refiEnabled ? parseFloat(r.refiLoanAmount) || 0 : 0;
  const rate = (parseFloat(r.refiRate) || 7) / 100;
  const termMonths = (parseFloat(r.refiTerm) || 30) * 12;
  const pointsVal = parseFloat(r.refiPoints) || 0;
  const pointsCost = r.refiPointsMode === 'pct' ? Math.round(loanAmount * (pointsVal / 100)) : pointsVal;

  const effectiveMonthlyRent = monthlyRent * (1 - vacancyRate);
  const managementFeeMonthly = effectiveMonthlyRent * managementRate;
  const monthlyOpex = (annualTaxes + annualInsurance + annualHoa) / 12 + monthlyMaintenance + managementFeeMonthly;
  const noi = effectiveMonthlyRent * 12 - monthlyOpex * 12;

  const isInterestOnly = r.loanType === 'interest_only';
  const monthlyRate = rate / 12;
  let monthlyPI = 0;
  if (loanAmount > 0 && monthlyRate > 0) {
    monthlyPI = isInterestOnly
      ? loanAmount * monthlyRate
      : termMonths > 0
        ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) / (Math.pow(1 + monthlyRate, termMonths) - 1)
        : 0;
  }

  const monthlyCashFlow = effectiveMonthlyRent - monthlyOpex - monthlyPI;
  const annualCashFlow = monthlyCashFlow * 12;

  const totalCostBasis = d.purchasePrice + d.totalBudget;
  const capRate = totalCostBasis > 0 ? (noi / totalCostBasis) * 100 : 0;
  const totalCashInvested = Math.max(0, totalCostBasis + pointsCost - loanAmount);
  const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;

  const totalAcquisitionCost = d.purchasePrice + d.totalBudget + d.closingCostsBuy + d.holdingCosts + pointsCost;
  const equityCaptured = d.arv - loanAmount;
  const moneyLeftInDeal = Math.max(0, totalAcquisitionCost - loanAmount);
  const cashToPocket = Math.max(0, loanAmount - totalAcquisitionCost);
  const equityGain = d.arv - d.purchasePrice - d.totalBudget - d.closingCostsBuy - d.holdingCosts - d.closingCostsSell;

  return {
    monthlyRent, vacancyRate, effectiveMonthlyRent, monthlyOpex, managementFeeMonthly,
    annualTaxes, annualInsurance, annualHoa, monthlyMaintenance,
    noi, monthlyPI, monthlyCashFlow, annualCashFlow, capRate, cashOnCash,
    loanAmount, rate, termMonths, isInterestOnly, pointsCost,
    totalAcquisitionCost, equityCaptured, moneyLeftInDeal, cashToPocket, equityGain, totalCashInvested,
  };
}

export function generateBudgetPdf(data: BudgetPdfData) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const psf = data.sqft > 0 ? data.totalBudget / data.sqft : 0;
  const overUnder = data.maxOffer - data.purchasePrice;
  const meetsMao = data.purchasePrice > 0 && data.purchasePrice <= data.maxOffer;

  const modeLabel =
    data.calculatorType === 'rental' ? 'Rental Analysis' :
    data.calculatorType === 'new_construction' ? 'New Construction' : 'Fix & Flip';

  const logoBlock = data.logoUrl
    ? `<img src="${esc(data.logoUrl)}" style="max-height:48px;max-width:170px;object-fit:contain;margin-left:auto;" crossorigin="anonymous" />`
    : '';

  const snapshotCards = [
    { label: 'Purchase Price', value: fmt(data.purchasePrice) },
    { label: 'ARV', value: fmt(data.arv) },
    { label: 'Square Footage', value: data.sqft > 0 ? data.sqft.toLocaleString() : '—' },
    { label: 'Construction Budget', value: fmt(data.totalBudget) },
    { label: 'Budget / Sqft', value: psf > 0 ? `$${psf.toFixed(2)}` : '—' },
  ];

  const maxLineItem = data.lineItems.reduce((mx, li) => Math.max(mx, li.amount), 0);
  const lineItemRows = data.lineItems.length
    ? data.lineItems
        .map((li) => {
          const share = data.totalBudget > 0 ? (li.amount / data.totalBudget) * 100 : 0;
          const barW = maxLineItem > 0 ? Math.max(2, (li.amount / maxLineItem) * 100) : 0;
          return `<tr><td class="cat">${esc(li.label)}</td><td class="bar-cell"><span class="bar"><span class="bar-fill" style="width:${barW.toFixed(1)}%"></span></span></td><td class="pct">${data.totalBudget > 0 ? fmtPct(share) : '—'}</td><td class="amt">${fmt(li.amount)}</td></tr>`;
        })
        .join('')
    : `<tr><td colspan="4" class="empty">No category budgets entered.</td></tr>`;


  let analysisHtml = '';

  if (data.calculatorType === 'rental') {
    const m = rentalMath(data);
    analysisHtml = `
    ${sectionTable('Monthly Cash Flow', [
      row('Gross Monthly Rent', fmt(m.monthlyRent)),
      row(`Less: Vacancy (${fmtPct(m.vacancyRate * 100)})`, `-${fmt(m.monthlyRent - m.effectiveMonthlyRent)}`, { color: 'negative' }),
      row('Effective Gross Income', fmt(m.effectiveMonthlyRent), { bold: true, divider: true }),
      row('Property Taxes', fmt(m.annualTaxes / 12)),
      row('Insurance', fmt(m.annualInsurance / 12)),
      row('HOA', fmt(m.annualHoa / 12)),
      row('Maintenance', fmt(m.monthlyMaintenance)),
      row('Management Fee', fmt(m.managementFeeMonthly)),
      row('Total Operating Expenses', fmt(m.monthlyOpex), { bold: true, divider: true }),
      row('Net Operating Income (annual)', fmt(m.noi), { bold: true }),
      ...(m.monthlyPI > 0 ? [row('Less: Debt Service (P&I)', `-${fmt(m.monthlyPI)}`, { color: 'negative' })] : []),
      row('Monthly Cash Flow', fmt(m.monthlyCashFlow), { bold: true, divider: true, color: m.monthlyCashFlow >= 0 ? 'positive' : 'negative' }),
      row('Annual Cash Flow', fmt(m.annualCashFlow), { bold: true, color: m.annualCashFlow >= 0 ? 'positive' : 'negative' }),
    ])}

    ${sectionTable('Loan Terms', [
      row('Loan Amount', fmt(m.loanAmount)),
      row('Interest Rate', fmtPct(m.rate * 100)),
      row('Structure', m.isInterestOnly ? 'Interest-only' : `Amortizing — ${Math.round(m.termMonths / 12)} yrs`),
      ...(m.pointsCost > 0 ? [row('Points / Fees', fmt(m.pointsCost))] : []),
    ])}

    ${sectionTable('BRRRR / Refinance Position', [
      row('Total Acquisition Cost', fmt(m.totalAcquisitionCost)),
      row('Equity Captured', fmt(m.equityCaptured)),
      row('Money Left in Deal', fmt(m.moneyLeftInDeal), { bold: true }),
      ...(m.cashToPocket > 0 ? [row('Cash to Pocket', fmt(m.cashToPocket), { color: 'positive' })] : []),
      row('Equity Gain', fmt(m.equityGain), { color: m.equityGain >= 0 ? 'positive' : 'negative' }),
    ])}

    <div class="summary-grid">
      <div class="summary-card"><div class="label">Monthly Cash Flow</div><div class="value ${m.monthlyCashFlow >= 0 ? 'positive' : 'negative'}">${fmt(m.monthlyCashFlow)}</div></div>
      <div class="summary-card"><div class="label">Annual Cash Flow</div><div class="value ${m.annualCashFlow >= 0 ? 'positive' : 'negative'}">${fmt(m.annualCashFlow)}</div></div>
      <div class="summary-card"><div class="label">Cash-on-Cash</div><div class="value">${fmtPct(m.cashOnCash)}</div></div>
      <div class="summary-card"><div class="label">Cap Rate</div><div class="value">${fmtPct(m.capRate)}</div></div>
    </div>`;
  } else {
    analysisHtml = `
    ${sectionTable('Profit Breakdown', [
      row('ARV (Sale Price)', fmt(data.arv), { bold: true }),
      row('Purchase Price', `-${fmt(data.purchasePrice)}`, { color: 'negative' }),
      row(`Closing Costs ${data.closingLabel}`, `-${fmt(data.closingCostsBuy)}`, { color: 'negative' }),
      row('Construction Budget', `-${fmt(data.totalBudget)}`, { color: 'negative' }),
      row(`Holding Costs ${data.holdingLabel}`, `-${fmt(data.holdingCosts)}`, { color: 'negative' }),
      ...(data.includeSellClosingCosts
        ? [row(`Selling Costs ${data.sellClosingLabel}`, `-${fmt(data.closingCostsSell)}`, { color: 'negative' })]
        : []),
      row('Total Costs', fmt(data.totalCosts), { bold: true, divider: true }),
      row('Total Investment', fmt(data.totalInvestment), { bold: true }),
      row('Net Profit', fmt(data.grossProfit), { bold: true, color: data.grossProfit >= 0 ? 'positive' : 'negative' }),
    ])}

    <div class="summary-grid">
      <div class="summary-card"><div class="label">Total Investment</div><div class="value">${fmt(data.totalInvestment)}</div></div>
      <div class="summary-card"><div class="label">Projected Profit</div><div class="value ${data.grossProfit >= 0 ? 'positive' : 'negative'}">${fmt(data.grossProfit)}</div></div>
      <div class="summary-card"><div class="label">Return on Investment</div><div class="value ${data.roi >= 0 ? 'positive' : 'negative'}">${fmtPct(data.roi)}</div></div>
      <div class="summary-card"><div class="label">Profit Margin</div><div class="value">${data.arv > 0 ? fmtPct((data.grossProfit / data.arv) * 100) : '—'}</div></div>
    </div>`;
  }

  const maoBlock =
    data.arv > 0
      ? `
  <div class="mao ${meetsMao ? 'ok' : 'warn'}">
    <div class="mao-left">
      <div class="mao-label">Max Allowable Offer · ${data.maoPercentage}% Rule</div>
      <div class="mao-value">${fmt(data.maxOffer)}</div>
    </div>
    <div class="mao-right">
      ${data.purchasePrice > 0
        ? `<span class="badge">${meetsMao ? 'Under max' : 'Over max'}</span><span class="mao-delta">${fmt(Math.abs(overUnder))} ${meetsMao ? 'below' : 'above'} target</span>`
        : `<span class="mao-delta muted">No purchase price entered</span>`}
    </div>
  </div>`
      : '';


  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Deal Analysis – ${esc(data.dealName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  :root { --gold:#b8892b; --gold-soft:#f4ecdd; --ink:#15171a; --muted:#6b7280; --line:#e7e5e1; }
  html, body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--ink); background:#fff; padding:40px 44px; font-size:12px; line-height:1.4; }
  .sheet { max-width:7.5in; margin:0 auto; }

  .header { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding-bottom:14px; }
  .header h1 { font-size:24px; font-weight:800; letter-spacing:-.5px; }
  .header .deal { font-size:14px; font-weight:600; color:#333; margin-top:3px; }
  .header .desc { font-size:11.5px; color:var(--muted); margin-top:2px; }
  .header .mode { display:inline-block; margin-top:9px; font-size:9px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; color:#7a5b18; background:var(--gold-soft); border:1px solid #e6d7b8; border-radius:3px; padding:3px 9px; }
  .header-right { width:2.3in; flex:0 0 2.3in; text-align:right; }
  .header-right img { max-height:44px; max-width:100%; object-fit:contain; display:inline-block; }
  .header-right .company { font-size:13px; font-weight:700; margin-top:6px; word-break:break-word; }
  .header-right .date { font-size:10.5px; color:var(--muted); margin-top:3px; }
  .rule { height:3px; background:linear-gradient(90deg,var(--gold) 0%,var(--gold) 28%,#e2d6bd 28%,#e2d6bd 100%); border-radius:2px; margin-bottom:18px; }

  .snapshot { display:flex; border:1px solid var(--line); border-radius:6px; overflow:hidden; margin-bottom:14px; page-break-inside:avoid; }
  .snap-card { flex:1; padding:11px 12px; border-right:1px solid var(--line); }
  .snap-card:last-child { border-right:none; }
  .snap-card .label { font-size:8.5px; font-weight:600; line-height:1.2; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; height:20px; }
  .snap-card .value { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:5px; white-space:nowrap; }

  .mao { display:flex; justify-content:space-between; align-items:center; gap:16px; border-radius:6px; padding:12px 16px; page-break-inside:avoid; }
  .mao.ok { background:#f2f8f3; border:1px solid #cfe6d3; }
  .mao.warn { background:#fdf3f1; border:1px solid #f2d3cd; }
  .mao-label { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.7px; color:var(--muted); }
  .mao-value { font-size:21px; font-weight:800; font-variant-numeric:tabular-nums; margin-top:2px; }
  .mao-right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; }
  .badge { font-size:9px; font-weight:800; letter-spacing:.8px; text-transform:uppercase; border-radius:3px; padding:3px 8px; color:#fff; }
  .mao.ok .badge { background:#2b7a44; }
  .mao.warn .badge { background:#b53a2c; }
  .mao-delta { font-size:11.5px; font-weight:600; }
  .mao.ok .mao-delta { color:#2b7a44; }
  .mao.warn .mao-delta { color:#b53a2c; }
  .mao-delta.muted { color:var(--muted); font-weight:500; }

  .section-title { page-break-after:avoid; break-after:avoid; font-size:10.5px; font-weight:800; color:var(--ink); text-transform:uppercase; letter-spacing:1.2px; margin:22px 0 8px; padding-left:8px; border-left:3px solid var(--gold); }
  table { width:100%; border-collapse:collapse; page-break-inside:auto; }
  thead { display:table-header-group; }
  th { text-align:left; font-size:8.5px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.7px; padding:6px 8px; border-bottom:1.5px solid #ddd9d2; background:#faf9f7; }
  th:last-child, td:last-child { text-align:right; }
  td { padding:5.5px 8px; font-size:11.5px; border-bottom:1px solid #f1efec; }
  tbody tr:nth-child(even) td { background:#fbfaf8; }
  td.amt, td:last-child { font-variant-numeric:tabular-nums; font-weight:600; }
  td.cat { font-weight:500; }
  td.pct, th.pct { text-align:right; color:var(--muted); font-size:10.5px; width:62px; font-weight:500; }
  th.bar-cell, td.bar-cell { width:110px; padding-right:4px; }
  .bar { display:block; height:5px; width:100%; background:#f0ede8; border-radius:3px; overflow:hidden; }
  .bar-fill { display:block; height:100%; background:var(--gold); border-radius:3px; }
  tr { page-break-inside:avoid; }
  tr.bold td { font-weight:700; }
  tr.divider td { border-bottom:1.5px solid #ddd9d2; }
  tr.total td { font-weight:800; border-top:1.5px solid #cfcac1; border-bottom:none; font-size:12.5px; background:#fff !important; padding-top:8px; }
  td.empty { color:#aaa; font-style:italic; text-align:center; }
  .negative { color:#b53a2c; }
  .positive { color:#2b7a44; }

  .summary-grid { display:flex; gap:8px; margin-top:16px; page-break-inside:avoid; }
  .summary-card { flex:1; background:#faf9f7; border:1px solid var(--line); border-radius:6px; padding:12px 10px; text-align:center; }
  .summary-card .label { font-size:8.5px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.6px; height:20px; }
  .summary-card .value { font-size:17px; font-weight:800; font-variant-numeric:tabular-nums; margin-top:4px; white-space:nowrap; }

  .footer { margin-top:28px; padding-top:12px; border-top:1px solid var(--line); font-size:9.5px; color:#9a968f; text-align:center; }
  @page { size:Letter portrait; margin:0.45in; }
  @media print { body { padding:0; font-size:11.5px; } .sheet { max-width:none; } }
</style>
</head>
<body>
 <div class="sheet">
  <div class="header">
    <div>
      <h1>Deal Analysis</h1>
      <div class="deal">${esc(data.dealName)}</div>
      ${data.dealDescription ? `<div class="desc">${esc(data.dealDescription)}</div>` : ''}
      <div class="mode">${esc(modeLabel)}</div>
    </div>
    <div class="header-right">
      ${logoBlock}
      ${data.companyName ? `<div class="company">${esc(data.companyName)}</div>` : ''}
      <div class="date">Prepared ${esc(today)}</div>
    </div>
  </div>
  <div class="rule"></div>

  <div class="snapshot">
    ${snapshotCards.map(c => `<div class="snap-card"><div class="label">${esc(c.label)}</div><div class="value">${esc(c.value)}</div></div>`).join('')}
  </div>

  ${maoBlock}

  <div class="section-title">Construction Budget</div>
  <table>
    <thead><tr><th>Category</th><th class="bar-cell"></th><th class="pct">% of Total</th><th>Amount</th></tr></thead>
    <tbody>
      ${lineItemRows}
      <tr class="total"><td>Total Construction Budget</td><td class="bar-cell"></td><td class="pct"></td><td>${fmt(data.totalBudget)}</td></tr>
    </tbody>
  </table>


  ${analysisHtml}

  <div class="footer">
    Generated ${esc(today)}${data.companyName ? ` by ${esc(data.companyName)}` : ''} · Estimates are for informational purposes only and do not constitute financial advice.
  </div>
 </div>

<script>
  var imgs=document.querySelectorAll('img');
  var total=imgs.length;
  if(total===0){setTimeout(function(){window.print();},500);}
  else{
    var loaded=0;
    function tryPrint(){loaded++;if(loaded>=total)setTimeout(function(){window.print();},500);}
    imgs.forEach(function(img){if(img.complete){tryPrint();}else{img.onload=tryPrint;img.onerror=tryPrint;}});
  }
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
