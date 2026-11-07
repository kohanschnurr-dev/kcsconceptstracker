import { describe, expect, test } from 'bun:test';
import ExcelJS from 'exceljs';
import { parseExcelReceipts, receiptTotal, selectedReceipts } from './excelReceiptImport';

async function workbook(rows: unknown[][]) {
  const w = new ExcelJS.Workbook();
  const sheet = w.addWorksheet('Line Items');
  sheet.addRow(['Date','Receipt #','Store','PO / Job','Type','Description','Qty','Net Unit Price','Ext. Price (pre-discount)','Discount','Line Tax']);
  rows.forEach(row=>sheet.addRow(row));
  const b = await w.xlsx.writeBuffer();
  return b as unknown as ArrayBuffer;
}
describe('Excel receipts',()=>{
  test('groups receipt items and applies signed discounts and tax exactly once',async()=>{
    const data = await workbook([
      [new Date('2026-09-26T00:00:00Z'),'00090-84781','Keller #6548','columbia','Sale','Drywall',20,9.73,259.60,-65,16.05],
      [new Date('2026-09-26T00:00:00Z'),'00090-84781','Keller #6548','columbia','Sale','Cement Board',20,15.21,317,-12.8,25.09],
      [new Date('2026-09-26T00:00:00Z'),'00090-84781','Keller #6548','columbia','Sale','Stud',18,3.98,71.64,0,5.92],
    ]);
    const receipts=await parseExcelReceipts(data,'HomeDepot.xlsx');
    expect(receipts.length).toBe(1);
    expect(receipts[0].items.length).toBe(3);
    expect(receiptTotal(receipts[0])).toBe(617.50);
    expect(receipts[0].purchase_date).toBe('2026-09-26');
  });
  test('return selection is optional and credits stay negative',async()=>{
    const receipts=await parseExcelReceipts(await workbook([
      ['2026-11-03','return','Store','Job','Return','Underlayment',1,-33.15,-39,5.85,-2.73],
      ['2026-11-03','sale','Store','Job','Sale','Drywall',1,10,10,0,1],
    ]),'HomeDepot.xlsx');
    const ids=new Set(receipts.filter(r=>!r.isReturn).map(r=>r.import_key));
    expect(selectedReceipts(receipts,ids).length).toBe(1);
    expect(receiptTotal(receipts[0])).toBe(-35.88);
    ids.add(receipts[0].import_key);
    expect(selectedReceipts(receipts,ids).length).toBe(2);
  });
  test('malformed dates stop import rather than silently skipping receipts',async()=>{
    expect(parseExcelReceipts(await workbook([['2026-02-30','1','Store','Job','Sale','Drywall',1,10,10,0,1]]),'HomeDepot.xlsx')).rejects.toThrow('row 2');
  });
});