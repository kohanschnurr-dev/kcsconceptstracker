// Shared CSV import utilities used by both ImportExpensesModal and QuickExpenseModal

export interface ParsedRow {
  date: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  expenseType: string;
  notes: string;
  matchedCategory: string | null;
  suggestedCategory: string | null;
  hasError: boolean;
  errorMsg?: string;
}

// Simple CSV parser that handles quoted fields
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim());
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        current = '';
        if (ch === '\r') i++;
      } else {
        current += ch;
      }
    }
  }
  row.push(current.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

// Normalize for comparison
export function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Simple similarity score (longest common subsequence ratio)
export function similarity(a: string, b: string): number {
  const an = normalize(a);
  const bn = normalize(b);
  if (!an || !bn) return 0;
  const len = Math.max(an.length, bn.length);
  let matches = 0;
  let bi = 0;
  for (let ai = 0; ai < an.length && bi < bn.length; ai++) {
    if (an[ai] === bn[bi]) { matches++; bi++; }
    else {
      const nextInB = bn.indexOf(an[ai], bi);
      if (nextInB !== -1 && nextInB - bi < 3) { matches++; bi = nextInB + 1; }
    }
  }
  return matches / len;
}

export function matchCategory(input: string, categories: { value: string; label: string }[]): { exact: string | null; suggested: string | null } {
  const norm = normalize(input);
  const exact = categories.find(c => normalize(c.label) === norm);
  if (exact) return { exact: exact.value, suggested: null };
  const exactVal = categories.find(c => normalize(c.value) === norm);
  if (exactVal) return { exact: exactVal.value, suggested: null };
  let bestScore = 0;
  let bestCat: string | null = null;
  for (const c of categories) {
    const s = Math.max(similarity(input, c.label), similarity(input, c.value));
    if (s > bestScore) { bestScore = s; bestCat = c.value; }
  }
  return { exact: null, suggested: bestScore > 0.4 ? bestCat : categories[0]?.value || null };
}

export function parseDate(input: string): string | null {
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
    const [y, m, d] = input.split('-').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const [m, d, y] = input.split('/').map(Number);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return null;
}

export const AI_IMPORT_PROMPT = `Role: You are a specialized construction bookkeeper for a DFW real estate developer. Your goal is to convert messy financial documents into clean, structured data for a master expense tracker.

Task: Extract every individual expense from the uploaded file (PDF, Excel, or Image) and prepare it for a CSV export.

Strict Extraction Rules:

Identify All Data: Scan the entire document. Do not summarize; extract every line item separately.

Date: Convert to MM/DD/YYYY.

Category: Map each expense to exactly one of these: Appliances, Bathroom, Cabinets, Cleaning, Closing Costs, Concrete, Countertops, Demolition, Doors, Drain Line Repair, Drywall, Electrical, Exterior Finish, Fencing, Filler, Final Punch, Flooring, Food, Foundation, Framing, Garage, Gas, Hardware, HOA, HVAC, Inspections, Insulation, Insurance, Kitchen, Landscaping, Light Fixtures, Main Bathroom, Misc., Painting, Permits, Pest Control, Plumbing, Pool, Railing, Roofing, Staging, Taxes, Tile, Trash Hauling, Trims, Utilities, Variable, Water Heater, Wholesale Fee, Windows.

Expense Type: Use 'product' for materials/retailers or 'labor' for contractors/service providers.

Amount: Numerical only (no currency symbols or commas). Use negative amounts to represent refunds or credits.

Payment Method: card, check, cash, or transfer.

Notes: Include project-specific details or credentials (e.g., "Licensed & insured").

Output Format: Create a downloadable CSV file with these exact headers: Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes.

If the file exceeds response limits, process it programmatically and ensure 100% of line items are extracted before generating the CSV. Do not partially complete.

Please upload your file (PDF, Excel, or Receipt image) now.`;

export function processCSVText(
  text: string,
  allCategories: { value: string; label: string }[]
): { rows: ParsedRow[]; error?: string } {
  const cleaned = text.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
  const parsed = parseCSV(cleaned);
  if (parsed.length < 2) {
    return { rows: [], error: 'CSV must have a header row and at least one data row' };
  }

  const header = parsed[0].map(h => h.toLowerCase().trim());
  const colMap = {
    date: header.indexOf('date'),
    vendor: header.indexOf('vendor'),
    category: header.indexOf('category'),
    description: header.indexOf('description'),
    amount: Math.max(header.indexOf('amount'), header.indexOf('total')),
    paymentMethod: Math.max(header.indexOf('payment method'), header.indexOf('paymentmethod'), header.indexOf('payment_method'), header.indexOf('payment')),
    expenseType: Math.max(header.indexOf('expense type'), header.indexOf('expensetype'), header.indexOf('expense_type'), header.indexOf('type')),
    notes: header.indexOf('notes'),
  };

  const missing: string[] = [];
  if (colMap.date === -1) missing.push('Date');
  if (colMap.amount === -1) missing.push('Amount (or Total)');
  if (colMap.category === -1) missing.push('Category');
  if (missing.length > 0) {
    return { rows: [], error: `Missing required columns: ${missing.join(', ')}. Found: ${header.join(', ')}` };
  }

  const dataRows = parsed.slice(1);
  const result: ParsedRow[] = dataRows.map(cols => {
    const get = (idx: number) => (idx >= 0 && idx < cols.length ? cols[idx] : '');
    const rawDate = get(colMap.date);
    const parsedDate = parseDate(rawDate);
    const rawAmount = get(colMap.amount).replace(/[$,]/g, '');
    const amount = parseFloat(rawAmount);
    const rawCategory = get(colMap.category);
    const { exact, suggested } = matchCategory(rawCategory, allCategories);
    const pm = get(colMap.paymentMethod).toLowerCase();
    const validPm = ['cash', 'check', 'card', 'transfer'].includes(pm) ? pm : 'card';
    const rawExpenseType = get(colMap.expenseType).toLowerCase();
    const expenseType = rawExpenseType === 'labor' ? 'labor' : 'product';

    let hasError = false;
    let errorMsg: string | undefined;
    if (!parsedDate) { hasError = true; errorMsg = 'Invalid date'; }
    if (isNaN(amount)) { hasError = true; errorMsg = 'Invalid amount'; }

    return {
      date: parsedDate || rawDate,
      vendor: get(colMap.vendor),
      category: rawCategory,
      description: get(colMap.description),
      amount: isNaN(amount) ? 0 : amount,
      paymentMethod: validPm,
      expenseType,
      notes: get(colMap.notes),
      matchedCategory: exact,
      suggestedCategory: exact ? null : suggested,
      hasError,
      errorMsg,
    };
  });

  return { rows: result };
}

export function downloadSampleCSV(allCategories: { value: string; label: string }[]) {
  const catList = allCategories.map(c => c.label).join(', ');
  const header = 'Date,Vendor,Category,Description,Amount,Payment Method,Expense Type,Notes';
  const example1 = '2025-01-15,Home Depot,Flooring,LVP for living room,2450.00,card,product,';
  const example2 = '2025-01-18,Mike\'s Plumbing,Plumbing,Rough-in for 2 bathrooms,3200.00,check,labor,Licensed & insured';
  const example3 = '2025-02-01,Lowe\'s,Electrical,Panels and wiring,1875.50,card,product,';
  const example4 = '2025-02-10,Home Depot,Flooring,Returned excess LVP,-320.00,card,product,Refund';
  const content = [
    '# SAMPLE CSV - Delete these instruction lines before importing',
    `# Valid Categories: ${catList}`,
    '#',
    '# Date: YYYY-MM-DD or MM/DD/YYYY',
    '# Payment Method: cash, check, card, transfer (optional, defaults to card)',
    '# Expense Type: product or labor (optional, defaults to product)',
    '#',
    header,
    example1,
    example2,
    example3,
    example4,
  ].join('\n');
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expense_import_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
