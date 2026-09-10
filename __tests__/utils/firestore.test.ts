// ===========================
// TESTES: firestore.toSharedDoc (achado #9)
// ===========================

import { toSharedDoc } from '../../src/utils/firestore';
import { ShoppingList } from '../../src/types';

const base: ShoppingList = {
  id: 1,
  name: 'Feira',
  suppliers: [],
  items: [
    { id: 10, name: 'Arroz', quantity: 2, unit: 'kg', isChecked: true, price: 12.9, priceType: 'unit' },
    { id: 11, name: 'Feijão', quantity: 1, unit: null, isChecked: false, price: null },
  ],
  createdAt: '2026-06-17T08:00:00.000Z',
  isCompleted: false,
  isArchived: false,
  totalSpent: 0,
  sharedWithUid: 'partner',
  ownerUid: 'owner',
  isSharedWithMe: true,
  tag_name: 'Feira',
};

describe('toSharedDoc', () => {
  it('não inclui campos locais (isSharedWithMe, ownerUid)', () => {
    const d = toSharedDoc(base) as Record<string, unknown>;
    expect('isSharedWithMe' in d).toBe(false);
    expect('ownerUid' in d).toBe(false);
  });

  it('mantém os campos do documento compartilhado', () => {
    const d = toSharedDoc(base);
    expect(d.id).toBe(1);
    expect(d.name).toBe('Feira');
    expect((d as Record<string, unknown>).type).toBeUndefined();
    expect(d.sharedWithUid).toBe('partner');
    expect(d.items).toHaveLength(2);
    expect(d.items[0].price).toBe(12.9);
    expect(d.items[1].priceType).toBe('unit'); // default aplicado
  });

  it('nunca deixa um campo undefined (Firestore rejeita undefined)', () => {
    const d = toSharedDoc({ ...base, notes: undefined, completedAt: undefined, tag_name: undefined } as any);
    Object.values(d).forEach(v => expect(v).not.toBeUndefined());
    d.items.forEach(i => Object.values(i).forEach(v => expect(v).not.toBeUndefined()));
  });

  it('notes / completedAt viram null quando ausentes', () => {
    const d = toSharedDoc({ ...base, notes: undefined, completedAt: undefined } as any);
    expect(d.notes).toBeNull();
    expect(d.completedAt).toBeNull();
  });

  it('preserva notes / completedAt quando presentes', () => {
    const d = toSharedDoc({ ...base, notes: 'comprar hoje', completedAt: '2026-07-01T00:00:00.000Z' });
    expect(d.notes).toBe('comprar hoje');
    expect(d.completedAt).toBe('2026-07-01T00:00:00.000Z');
  });
});
