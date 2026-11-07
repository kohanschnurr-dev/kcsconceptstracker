/// <reference types="bun" />
import { describe, it, expect } from 'bun:test';
import { refineCategory } from './categorizeLineItem';

describe('refineCategory', () => {
  it('maps a prehung front door to doors when AI says misc', () => {
    expect(refineCategory('Reliant 32 in. x 80 in. 2 Panel Prehung Front Door', 'misc')).toBe('doors');
  });
  it('maps delivery charge to delivery_fee', () => {
    expect(refineCategory('Delivery charge', undefined)).toBe('delivery_fee');
  });
  it('learned correction overrides keywords', () => {
    expect(refineCategory('Front Door', 'misc', { 'front door': 'carpentry' })).toBe('carpentry');
  });
});
