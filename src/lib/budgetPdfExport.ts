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
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:#1a1a1a; background:#fff; padding:44px 52px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; margin-bottom:24px; padding-bottom:18px; border-bottom:2px solid #c9a96e; }
  .header h1 { font-size:22px; font-weight:700; }
  .header .subtitle { font-size:13px; color:#666; margin-top:4px; }
  .header .mode { display:inline-block; margin-top:8px; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#8a6d2f; background:#f6efe1; border-radius:4px; padding:3px 8px; }
  .header-right { text-align:right; }
  .header-right .company { font-size:14px; font-weight:600; margin-top:6px; }
  .header-right .date { font-size:11px; color:#888; margin-top:2px; }
  .snapshot { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:20px; }
  .snap-card { background:#f8f6f3; border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; justify-content:space-between; min-height:62px; }
  .snap-card .label { font-size:9.5px; line-height:1.3; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; min-height:25px; }
  .snap-card .value { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; }
  .mao { display:flex; justify-content:space-between; align-items:center; gap:16px; border-radius:8px; padding:14px 18px; margin-bottom:8px; }
  .mao.ok { background:#f0f7f0; border:1px solid #cfe6cf; }
  .mao.warn { background:#fdf1f0; border:1px solid #f0cdc9; }
  .mao-label { font-size:10px; text-transform:uppercase; letter-spacing:.5px; color:#777; }
  .mao-value { font-size:20px; font-weight:700; font-variant-numeric:tabular-nums; }
  .mao-right { font-size:12.5px; font-weight:600; text-align:right; }
  .mao.ok .mao-right { color:#27713a; }
  .mao.warn .mao-right { color:#b03a2e; }
  .section-title { page-break-after:avoid; break-after:avoid; font-size:12.5px; font-weight:700; color:#c9a96e; text-transform:uppercase; letter-spacing:1px; margin:24px 0 10px; }
  table { width:100%; border-collapse:collapse; }
  thead { display:table-header-group; }
  th { text-align:left; font-size:10px; color:#888; text-transform:uppercase; letter-spacing:.5px; padding:7px 10px; border-bottom:1px solid #e5e5e5; }
  th:last-child, td:last-child { text-align:right; }
  td { padding:7.5px 10px; font-size:12.5px; border-bottom:1px solid #f2f2f2; }
  td:last-child { font-variant-numeric:tabular-nums; }
  td.pct { text-align:right; color:#999; font-size:11.5px; width:80px; }
  th.pct { text-align:right; }
  tr { page-break-inside:avoid; }
  tr.bold td { font-weight:700; }
  tr.divider td { border-bottom:2px solid #e0e0e0; }
  tr.total td { font-weight:700; border-top:2px solid #e0e0e0; border-bottom:none; font-size:13.5px; }
  td.empty { color:#aaa; font-style:italic; text-align:center; }
  .negative { color:#c0392b; }
  .positive { color:#27ae60; }
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:20px; page-break-inside:avoid; }
  .summary-card { background:#f8f6f3; border-radius:8px; padding:14px; text-align:center; }
  .summary-card .label { font-size:9.5px; color:#888; text-transform:uppercase; letter-spacing:.5px; margin-bottom:5px; }
  .summary-card .value { font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; }
  .footer { margin-top:34px; padding-top:14px; border-top:1px solid #e5e5e5; font-size:10.5px; color:#aaa; text-align:center; }
  @page { margin:0.5in; }
  @media print { body { padding:0; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Deal Analysis</h1>
      <div class="subtitle">${esc(data.dealName)}</div>
      ${data.dealDescription ? `<div class="subtitle">${esc(data.dealDescription)}</div>` : ''}
      <div class="mode">${esc(modeLabel)}</div>
    </div>
    <div class="header-right">
      ${logoBlock}
      ${data.companyName ? `<div class="company">${esc(data.companyName)}</div>` : ''}
      <div class="date">Prepared ${esc(today)}</div>
    </div>
  </div>

  <div class="snapshot">
    ${snapshotCards.map(c => `<div class="snap-card"><div class="label">${esc(c.label)}</div><div class="value">${esc(c.value)}</div></div>`).join('')}
  </div>

  ${maoBlock}

  <div class="section-title">Construction Budget</div>
  <table>
    <thead><tr><th>Category</th><th class="pct">% of Total</th><th>Amount</th></tr></thead>
    <tbody>
      ${lineItemRows}
      <tr class="total"><td>Total Construction Budget</td><td class="pct"></td><td>${fmt(data.totalBudget)}</td></tr>
    </tbody>
  </table>

  ${analysisHtml}

  <div class="footer">
    Generated ${esc(today)}${data.companyName ? ` by ${esc(data.companyName)}` : ''} · Estimates are for informational purposes only and do not constitute financial advice.
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
