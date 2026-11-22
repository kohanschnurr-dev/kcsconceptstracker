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
