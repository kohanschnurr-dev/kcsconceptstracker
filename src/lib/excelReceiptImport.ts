import ExcelJS from 'exceljs';
import { parseDateString, formatDateString } from './dateUtils';

export interface SpreadsheetItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax: number;
  suggested_category: string;
  notes: string;
}
export interface SpreadsheetReceipt {
  import_key: string;
  receipt_number: string;
  vendor_name: string;
  purchase_date: string;
  job: string;
  store: string;
  isReturn: boolean;
  items: SpreadsheetItem[];
  raw_text: string;
}
export const money = (n: number) => Math.round((n + Math.sign(n) * Number.EPSILON) * 100) / 100;
export const receiptTotal = (r: SpreadsheetReceipt) => money(r.items.reduce((s, i) => s + i.total_price + i.tax, 0));
export const selectedReceipts = (receipts: SpreadsheetReceipt[], ids: Set<string>) => receipts.filter(r => ids.has(r.import_key));

function text(v: ExcelJS.CellValue): string {
  if (v == null) return '';
  if (typeof v === 'object' && !(v instanceof Date)) {
    if ('result' in v) return text(v.result ?? null);
    if ('richText' in v) return v.richText.map(t => t.text).join('');
    if ('text' in v) return String(v.text);
    return '';
  }
  return String(v).trim();
}
function number(v: ExcelJS.CellValue): number {
  const s = text(v).replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  return s === '' ? NaN : Number(s);
}
function date(v: ExcelJS.CellValue): string {
  let s = '';
  if (v instanceof Date) {
    // Excel serial dates are decoded by ExcelJS as UTC, not local time.
    s = `${v.getUTCFullYear()}-${String(v.getUTCMonth()+1).padStart(2,'0')}-${String(v.getUTCDate()).padStart(2,'0')}`;
  } else if (typeof v === 'number') {
    const d = new Date(Date.UTC(1899,11,30) + Math.floor(v)*86400000);
    return date(d);
  } else {
    s = text(v).slice(0,10);
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) s = `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || formatDateString(parseDateString(s)) !== s) throw new Error('A receipt date is missing or invalid.');
  return s;
}
function category(description: string): string {
  return refineCategory(description, null, loadCorrections());
}

export async function parseExcelReceipts(buffer: ArrayBuffer, filename: string): Promise<SpreadsheetReceipt[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const groups = new Map<string, SpreadsheetReceipt>();
  let recognized = false;
  for (const sheet of workbook.worksheets) {
    let headers = new Map<string, number>();
    let headerRow = 0;
    for (let n=1; n<=Math.min(sheet.rowCount,30); n++) {
      const candidate = new Map<string, number>();
      sheet.getRow(n).eachCell((cell, col) => candidate.set(text(cell.value).toLowerCase(), col));
      if (candidate.has('date') && candidate.has('description') && (candidate.has('receipt #') || candidate.has('receipt number'))) { headers=candidate; headerRow=n; break; }
    }
    if (!headerRow) continue; // Do not import summary sheets a second time.
    recognized = true;
    for (let n=headerRow+1; n<=sheet.rowCount; n++) {
      const row = sheet.getRow(n);
      const get = (...keys: string[]): ExcelJS.CellValue => {
        const col = keys.map(k => headers.get(k)).find(c => c !== undefined);
        return col === undefined ? null : row.getCell(col).value;
      };
      const description = text(get('description'));
      if (!description) continue;
      try {
        const receipt_number = text(get('receipt #', 'receipt number'));
        if (!receipt_number) throw new Error('Receipt number is missing.');
        const purchase_date = date(get('date'));
        const store = text(get('store'));
        const vendor_name = text(get('vendor', 'vendor name')) || (/home.?depot/i.test(filename) || headers.has('po / job') ? 'Home Depot' : '');
        if (!vendor_name) throw new Error('Add a Vendor column to this spreadsheet.');
        const quantity = Math.abs(number(get('qty', 'quantity')) || 1);
        const ext = number(get('ext. price (pre-discount)', 'extended price'));
        const net = number(get('net unit price'));
        const discount = number(get('discount')) || 0;
        let total_price = Number.isFinite(ext) ? money(ext + discount) : Number.isFinite(net) ? money(net*quantity) : number(get('amount', 'total', 'line total'));
        if (!Number.isFinite(total_price)) throw new Error('Line amount is missing or invalid.');
        const isReturn = /return|refund|credit/i.test(text(get('type'))) || total_price < 0;
        if (isReturn) total_price = -Math.abs(total_price);
        let tax = number(get('line tax', 'tax')) || 0;
        if (isReturn) tax = -Math.abs(tax);
        const job = text(get('po / job', 'job', 'project'));
        const import_key = JSON.stringify([vendor_name.toLowerCase(), store.toLowerCase(), purchase_date, receipt_number, isReturn]);
        let group = groups.get(import_key);
        if (!group) {
          group = { import_key, receipt_number, purchase_date, vendor_name, store, job, isReturn, items: [], raw_text: '' };
          groups.set(import_key, group);
        }
        group.items.push({item_name: description, quantity, unit_price: money(total_price/quantity), total_price, tax: money(tax), suggested_category: category(description), notes: [job && `Job: ${job}`, store && `Store: ${store}`, text(get('sku')) && `SKU: ${text(get('sku'))}`, `Receipt: ${receipt_number}`, `Discount: ${discount.toFixed(2)}`, `Tax: ${tax.toFixed(2)}`].filter(Boolean).join(' · ')});
      } catch (e) { throw new Error(`${sheet.name}, row ${n}: ${e instanceof Error ? e.message : 'Invalid receipt row'}`); }
    }
  }
  if (!recognized) throw new Error('No receipt worksheet found. Required columns: Date, Receipt #, Description, and Amount or Ext. Price (pre-discount).');
  if (!groups.size) throw new Error('This workbook contains no receipt items.');
  if (groups.size > 500) throw new Error('Upload no more than 500 receipts at a time.');
  return Array.from(groups.values()).map(r => ({...r, raw_text: JSON.stringify({source: filename, receipt_number:r.receipt_number, store:r.store, job:r.job, items:r.items})}));
}