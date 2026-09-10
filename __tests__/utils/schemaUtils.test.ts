// ===========================
// TESTES: schemaUtils
// ===========================

import { migrateListSchema } from '../../src/utils/schemaUtils';

describe('migrateListSchema', () => {
  describe('campos obrigatórios com dados mínimos', () => {
    const minimal = { id: 1, name: 'Mercado' };

    it('preenche suppliers com [] se ausente', () => {
      expect(migrateListSchema(minimal).suppliers).toEqual([]);
    });

    it('preenche items com [] se ausente', () => {
      expect(migrateListSchema(minimal).items).toEqual([]);
    });

    it('preenche isCompleted com false se ausente', () => {
      expect(migrateListSchema(minimal).isCompleted).toBe(false);
    });

    it('preenche isArchived/archivedAt se ausentes', () => {
      expect(migrateListSchema(minimal).isArchived).toBe(false);
      expect(migrateListSchema(minimal).archivedAt).toBeNull();
    });

    it('preenche totalSpent com 0 se ausente', () => {
      expect(migrateListSchema(minimal).totalSpent).toBe(0);
    });

    it('preenche completedAt com null se ausente', () => {
      expect(migrateListSchema(minimal).completedAt).toBeNull();
    });

    it('mantém o id quando é número válido', () => {
      expect(migrateListSchema({ id: 173900, name: 'X' }).id).toBe(173900);
    });
  });

  describe('id corrompido / ausente (achado #6)', () => {
    it('id ausente → gera um número finito', () => {
      const r = migrateListSchema({ name: 'Sem id' });
      expect(typeof r.id).toBe('number');
      expect(Number.isFinite(r.id)).toBe(true);
    });

    it('id string/null → gera um número finito', () => {
      expect(typeof migrateListSchema({ id: 'abc', name: 'X' }).id).toBe('number');
      expect(typeof migrateListSchema({ id: null, name: 'X' }).id).toBe('number');
      expect(Number.isNaN(migrateListSchema({ id: NaN, name: 'X' }).id)).toBe(false);
    });

    it('id ausente mas createdAt válido → deriva de createdAt (estável entre reinícios)', () => {
      const iso = '2026-06-17T08:00:00.000Z';
      const a = migrateListSchema({ name: 'X', createdAt: iso });
      const b = migrateListSchema({ name: 'X', createdAt: iso });
      expect(a.id).toBe(Date.parse(iso));
      expect(a.id).toBe(b.id);
    });

    it('itens sem id recebem ids distintos', () => {
      const r = migrateListSchema({
        id: 1, name: 'X',
        items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      });
      const ids = r.items.map(i => i.id);
      expect(new Set(ids).size).toBe(3);
      ids.forEach(id => expect(Number.isFinite(id)).toBe(true));
    });
  });

  describe('migração de itens', () => {
    it('migra items com campos faltantes', () => {
      const raw = {
        id: 1,
        name: 'Lista',
        items: [
          { id: 10, name: 'Arroz' }, // sem quantity, unit, price, isChecked
        ],
      };
      const result = migrateListSchema(raw);
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].unit).toBeNull();
      expect(result.items[0].price).toBeNull();
      expect(result.items[0].isChecked).toBe(false);
      expect(result.items[0].priceType).toBe('unit');
    });

    it('preserva dados existentes dos itens', () => {
      const raw = {
        id: 1,
        name: 'Lista',
        items: [
          { id: 10, name: 'Feijão', quantity: 2, unit: 'kg', price: 8.99, isChecked: true, priceType: 'total' },
        ],
      };
      const result = migrateListSchema(raw);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].unit).toBe('kg');
      expect(result.items[0].price).toBe(8.99);
      expect(result.items[0].isChecked).toBe(true);
      expect(result.items[0].priceType).toBe('total');
    });
  });

  describe('migração sharedWith[] → sharedWithUid', () => {
    it('extrai primeiro UID de sharedWith[] legado', () => {
      const raw = { id: 1, name: 'Lista', sharedWith: ['uid_a', 'uid_b'] };
      expect(migrateListSchema(raw).sharedWithUid).toBe('uid_a');
    });

    it('usa sharedWithUid se já presente', () => {
      const raw = { id: 1, name: 'Lista', sharedWithUid: 'uid_novo' };
      expect(migrateListSchema(raw).sharedWithUid).toBe('uid_novo');
    });
  });

  describe('campo notes (opcional)', () => {
    it('notes é undefined quando ausente', () => {
      const raw = { id: 1, name: 'Lista' };
      expect(migrateListSchema(raw).notes).toBeUndefined();
    });

    it('preserva notes quando presente', () => {
      const raw = { id: 1, name: 'Lista', notes: 'Comprar antes do vencimento' };
      expect(migrateListSchema(raw).notes).toBe('Comprar antes do vencimento');
    });
  });
});
