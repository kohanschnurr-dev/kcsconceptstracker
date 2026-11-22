/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { detectDuplicates, pairKey, topFlag, findLikelyDuplicates, type DupRecord } from './duplicateDetection';

const rec = (p: Partial<DupRecord> & { key: string }): DupRecord => ({
  source: 'qb_project', amount: 18.39, date: '2026-10-26', vendor: 'Amazon',
  description: 'Amazon Mktpl*dj7if6mw3', location: '2102 Columbia Dr', ids: [p.key], ...p,
});

describe('duplicate detection', () => {
  test('same amount, date and reference is a likely duplicate', () => {
    const f = detectDuplicates([rec({ key: 'qb:a' }), rec({ key: 'qb:b' })]);
    expect(topFlag(f.get('qb:a'))?.level).toBe('high');
  });
  test('same vendor and amount within 3 days is a possible duplicate', () => {
    const f = detectDuplicates([rec({ key: 'qb:a', description: 'x' }), rec({ key: 'qb:b', date: '2026-10-29', description: 'y' })]);
    expect(topFlag(f.get('qb:a'))?.level).toBe('medium');
  });
  test('4 days apart is not flagged', () => {
    const f = detectDuplicates([rec({ key: 'qb:a', description: 'x' }), rec({ key: 'qb:b', date: '2026-10-30', description: 'y' })]);
    expect(f.size).toBe(0);
  });
  test('one cent difference is not flagged', () => {
    const f = detectDuplicates([rec({ key: 'qb:a' }), rec({ key: 'qb:b', amount: 18.4 })]);
    expect(f.size).toBe(0);
  });
  test('pending charge matching an imported one is already imported', () => {
    const f = detectDuplicates([rec({ key: 'qb:p', source: 'qb_pending' }), rec({ key: 'biz:1', source: 'business' })]);
    expect(topFlag(f.get('qb:p'))?.level).toBe('imported');
  });
  test('split rows of the same charge never flag each other', () => {
    const f = detectDuplicates([rec({ key: 'qb:a' }), rec({ key: 'qb:a' })]);
    expect(f.size).toBe(0);
  });
  test('dismissed pairs are skipped', () => {
    const f = detectDuplicates([rec({ key: 'qb:a' }), rec({ key: 'qb:b' })], new Set([pairKey('qb:b', 'qb:a')]));
    expect(f.size).toBe(0);
  });
  test('import warning finds likely duplicates only', () => {
    const hits = findLikelyDuplicates({ key: 'qb:new', amount: 18.39, date: '2026-10-26', description: 'Amazon Mktpl*dj7if6mw3' }, [rec({ key: 'qb:a' })]);
    expect(hits.length).toBe(1);
  });
});

import { detectReceiptChargePairs } from './duplicateDetection';

describe('receipt vs bank charge pairing', () => {
  const charge = (p: Partial<DupRecord> & { key: string }) => rec({ source: 'qb_pending', amount: 100, date: '2026-11-01', vendor: 'HOME DEPOT #123', ...p });
  const receipt = (p: Partial<DupRecord> = {}) => rec({ key: 'rcpt:1', source: 'receipt', amount: 100, date: '2026-11-01', vendor: 'The Home Depot', ...p });
  test('same amount and vendor is an exact pair', () => {
    expect(detectReceiptChargePairs([receipt()], [charge({ key: 'qb:a' })]).get('qb:a')?.level).toBe('receipt_exact');
  });
  test('receipt 2 days before or 7 days after the charge pairs; 3 before / 8 after does not', () => {
    expect(detectReceiptChargePairs([receipt({ date: '2026-10-30' })], [charge({ key: 'qb:a' })]).size).toBe(2);
    expect(detectReceiptChargePairs([receipt({ date: '2026-11-08' })], [charge({ key: 'qb:a' })]).size).toBe(2);
    expect(detectReceiptChargePairs([receipt({ date: '2026-10-29' })], [charge({ key: 'qb:a' })]).size).toBe(0);
    expect(detectReceiptChargePairs([receipt({ date: '2026-11-09' })], [charge({ key: 'qb:a' })]).size).toBe(0);
  });
  test('within $1.00 is a close match, $1.01 off on $40 is not', () => {
    expect(detectReceiptChargePairs([receipt({ amount: 101 })], [charge({ key: 'qb:a' })]).get('qb:a')?.level).toBe('receipt_close');
    expect(detectReceiptChargePairs([receipt({ amount: 41.01 })], [charge({ key: 'qb:a', amount: 40 })]).size).toBe(0);
  });
  test('within 2% on a large charge is a close match', () => {
    expect(detectReceiptChargePairs([receipt({ amount: 1019 })], [charge({ key: 'qb:a', amount: 1000 })]).get('qb:a')?.level).toBe('receipt_close');
    expect(detectReceiptChargePairs([receipt({ amount: 1021 })], [charge({ key: 'qb:a', amount: 1000 })]).size).toBe(0);
  });
  test('different store never pairs', () => {
    expect(detectReceiptChargePairs([receipt({ vendor: 'Lowes' })], [charge({ key: 'qb:a' })]).size).toBe(0);
  });
  test('dismissed pair is not flagged', () => {
    expect(detectReceiptChargePairs([receipt()], [charge({ key: 'qb:a' })], new Set([pairKey('rcpt:1', 'qb:a')])).size).toBe(0);
  });
  test('exact beats close and each receipt pairs once', () => {
    const p = detectReceiptChargePairs([receipt()], [charge({ key: 'qb:close', amount: 100.5 }), charge({ key: 'qb:exact', date: '2026-10-28' })]);
    expect(p.get('rcpt:1')?.other.key).toBe('qb:exact');
    expect(p.has('qb:close')).toBe(false);
  });
});
