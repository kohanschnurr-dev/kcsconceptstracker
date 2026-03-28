export interface CashFlowPdfData {
  propertyAddress: string;
  companyName?: string;
  logoUrl?: string;
  purchasePrice: number;
  arv: number;
  monthlyRent: number;
  vacancyRate: number;
  monthlyTaxes: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyMaintenance: number;
  managementRate: number;
  managementFee: number;
  monthlyMortgage: number;
  loanAmount: number;
  interestRate: number;
  loanTermMonths: number;
  rehabBudget: number;
}

export function generateCashFlowPdf(data: CashFlowPdfData) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const vacancyDollar = data.monthlyRent * (data.vacancyRate / 100);
  const effectiveGrossIncome = data.monthlyRent - vacancyDollar;
  const totalExpenses = data.monthlyTaxes + data.monthlyInsurance + data.monthlyHoa + data.monthlyMaintenance + data.managementFee;
  const noi = effectiveGrossIncome - totalExpenses;
  const monthlyCashFlow = noi - data.monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;
  const totalInvestment = data.purchasePrice + data.rehabBudget;
  const cashInDeal = totalInvestment - data.loanAmount;
  const cocRoi = cashInDeal > 0 ? (annualCashFlow / cashInDeal) * 100 : 0;
  const capRate = data.purchasePrice > 0 ? ((noi * 12) / data.purchasePrice) * 100 : 0;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = [
    { label: 'Gross Monthly Rent', amount: data.monthlyRent, bold: true },
    { label: `Less: Vacancy (${fmtPct(data.vacancyRate)})`, amount: -vacancyDollar },
    { label: 'Effective Gross Income', amount: effectiveGrossIncome, bold: true, divider: true },
    { label: '', amount: 0, spacer: true },
    { label: 'OPERATING EXPENSES', amount: 0, header: true },
    { label: 'Property Taxes', amount: data.monthlyTaxes },
    { label: 'Insurance', amount: data.monthlyInsurance },
    { label: 'HOA', amount: data.monthlyHoa },
    { label: 'Maintenance', amount: data.monthlyMaintenance },
    { label: `Management (${fmtPct(data.managementRate)})`, amount: data.managementFee },
    { label: 'Total Operating Expenses', amount: totalExpenses, bold: true, divider: true },
    { label: '', amount: 0, spacer: true },
    { label: 'Net Operating Income (NOI)', amount: noi, bold: true },
    ...(data.monthlyMortgage > 0 ? [{ label: 'Less: Debt Service (P&I)', amount: -data.monthlyMortgage }] : []),
    { label: 'Monthly Cash Flow', amount: monthlyCashFlow, bold: true, highlight: true },
  ];

  const logoBlock = data.logoUrl
    ? `<img src="${data.logoUrl}" style="max-height:50px;max-width:180px;object-fit:contain;" crossorigin="anonymous" />`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Cash Flow Report – ${data.propertyAddress}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:#1a1a1a; background:#fff; padding:48px 56px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:20px; border-bottom:2px solid #c9a96e; }
  .header-left h1 { font-size:22px; font-weight:700; color:#1a1a1a; margin-bottom:4px; }
  .header-left .subtitle { font-size:13px; color:#666; }
  .header-right { text-align:right; }
  .header-right .company { font-size:15px; font-weight:600; color:#1a1a1a; margin-top:4px; }
  .header-right .date { font-size:12px; color:#888; margin-top:2px; }
  .section-title { font-size:14px; font-weight:700; color:#c9a96e; text-transform:uppercase; letter-spacing:1px; margin:28px 0 12px; }
  .prop-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:28px; }
  .prop-card { background:#f8f6f3; border-radius:8px; padding:14px 16px; }
  .prop-card .label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
  .prop-card .value { font-size:18px; font-weight:700; color:#1a1a1a; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  th { text-align:left; font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px; padding:8px 12px; border-bottom:1px solid #e5e5e5; }
  th:last-child { text-align:right; }
  td { padding:9px 12px; font-size:13px; border-bottom:1px solid #f0f0f0; }
  td:last-child { text-align:right; font-variant-numeric:tabular-nums; }
  tr.bold td { font-weight:700; }
  tr.divider td { border-bottom:2px solid #e5e5e5; }
  tr.header-row td { font-size:11px; font-weight:700; color:#c9a96e; text-transform:uppercase; letter-spacing:1px; padding-top:16px; border-bottom:none; }
  tr.spacer td { padding:4px 0; border-bottom:none; }
  tr.highlight td { background:#f0f7f0; font-size:15px; font-weight:700; border-radius:4px; }
  .negative { color:#c0392b; }
  .positive { color:#27ae60; }
  .summary-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-top:28px; }
  .summary-card { background:#f8f6f3; border-radius:8px; padding:16px; text-align:center; }
  .summary-card .label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
  .summary-card .value { font-size:20px; font-weight:700; }
  .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e5e5e5; font-size:11px; color:#aaa; text-align:center; }
  .loan-info { font-size:12px; color:#666; margin-top:4px; }
  @media print { body { padding:32px 40px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Monthly Cash Flow Statement</h1>
      <div class="subtitle">${data.propertyAddress}</div>
    </div>
    <div class="header-right">
      ${logoBlock}
      ${data.companyName ? `<div class="company">${data.companyName}</div>` : ''}
      <div class="date">Prepared ${today}</div>
    </div>
  </div>

  <div class="section-title">Monthly Income &amp; Expense Breakdown</div>
  <table>
    <thead>
      <tr><th>Line Item</th><th>Monthly Amount</th></tr>
    </thead>
    <tbody>
      ${rows.map(r => {
        if (r.spacer) return `<tr class="spacer"><td colspan="2"></td></tr>`;
        if (r.header) return `<tr class="header-row"><td colspan="2">${r.label}</td></tr>`;
        const cls = [r.bold ? 'bold' : '', r.divider ? 'divider' : '', r.highlight ? 'highlight' : ''].filter(Boolean).join(' ');
        const colorCls = r.amount < 0 ? 'negative' : r.amount > 0 && r.highlight ? 'positive' : '';
        return `<tr class="${cls}"><td>${r.label}</td><td class="${colorCls}">${fmt(r.amount)}</td></tr>`;
      }).join('\n')}
    </tbody>
  </table>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="label">Monthly Cash Flow</div>
      <div class="value ${monthlyCashFlow >= 0 ? 'positive' : 'negative'}">${fmt(monthlyCashFlow)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Annual Cash Flow</div>
      <div class="value ${annualCashFlow >= 0 ? 'positive' : 'negative'}">${fmt(annualCashFlow)}</div>
    </div>
    ${data.monthlyMortgage > 0 ? `<div class="summary-card">
      <div class="label">Cash-on-Cash ROI</div>
      <div class="value">${fmtPct(cocRoi)}</div>
    </div>` : ''}
    <div class="summary-card">
      <div class="label">Cap Rate</div>
      <div class="value">${fmtPct(capRate)}</div>
    </div>
  </div>

  <div class="footer">
    This report is for informational purposes only and does not constitute financial advice.
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
