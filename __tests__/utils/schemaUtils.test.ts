// ===========================
// TESTES: schemaUtils
// ===========================

import { migrateEventSchema, migrateListSchema } from '../../src/utils/schemaUtils';

describe('migrateEventSchema', () => {
  describe('campos obrigatórios com dados mínimos', () => {
    const minimal = { id: 1, title: 'Teste' };

    it('preenche tag_name com "Geral" se ausente', () => {
      expect(migrateEventSchema(minimal).tag_name).toBe('Geral');
    });

    it('preenche start_time com null se ausente', () => {
      expect(migrateEventSchema(minimal).start_time).toBeNull();
    });

    it('preenche is_completed com false se ausente', () => {
      expect(migrateEventSchema(minimal).is_completed).toBe(false);
    });

    it('preenche is_pending com false se ausente', () => {
      expect(migrateEventSchema(minimal).is_pending).toBe(false);
    });

    it('preenche steps com [] se ausente', () => {
      expect(migrateEventSchema(minimal).steps).toEqual([]);
    });

    it('preenche notes com [] se ausente', () => {
      expect(migrateEventSchema(minimal).notes).toEqual([]);
    });

    it('preenche linkedListId com null se ausente', () => {
      expect(migrateEventSchema(minimal).linkedListId).toBeNull();
    });

    it('preenche serieId com null se ausente', () => {
      expect(migrateEventSchema(minimal).serieId).toBeNull();
    });

    it('preenche isRecurring com false se ausente', () => {
      expect(migrateEventSchema(minimal).isRecurring).toBe(false);
    });

    it('preenche completedAt com null se ausente', () => {
      expect(migrateEventSchema(minimal).completedAt).toBeNull();
    });

    it('preenche isSharedWithMe com false se ausente', () => {
      expect(migrateEventSchema(minimal).isSharedWithMe).toBe(false);
    });
  });

  describe('migração sharedWith[] → sharedWithUid (v1.x → v1.3+)', () => {
    it('usa sharedWithUid se já presente', () => {
      const raw = { id: 1, title: 'X', sharedWithUid: 'uid_parceiro' };
      expect(migrateEventSchema(raw).sharedWithUid).toBe('uid_parceiro');
    });

    it('extrai primeiro elemento de sharedWith[] se sharedWithUid ausente', () => {
      const raw = { id: 1, title: 'X', sharedWith: ['uid_legado_1', 'uid_legado_2'] };
      expect(migrateEventSchema(raw).sharedWithUid).toBe('uid_legado_1');
    });

    it('define sharedWithUid como null se sharedWith[] vazio', () => {
      const raw = { id: 1, title: 'X', sharedWith: [] };
      expect(migrateEventSchema(raw).sharedWithUid).toBeNull();
    });

    it('define sharedWithUid como null se nenhum campo presente', () => {
      const raw = { id: 1, title: 'X' };
      expect(migrateEventSchema(raw).sharedWithUid).toBeNull();
    });
  });

  describe('preserva dados existentes válidos', () => {
    it('mantém todos os campos quando presentes', () => {
      const raw = {
        id: 42,
        title: 'Dentista',
        tag_name: 'Saúde',
        start_time: '2026-06-17T09:00:00',
        is_completed: true,
        is_pending: false,
        steps: [{ id: 1, text: 'Confirmar horário', completed: false }],
        notes: ['Levar carteirinha'],
        linkedListId: 10,
        serieId: 'serie_abc',
        isRecurring: true,
        completedAt: '2026-06-17T10:30:00',
        sharedWithUid: 'uid_123',
        ownerUid: 'owner_uid',
        isSharedWithMe: false,
      };

      const result = migrateEventSchema(raw);
      expect(result.id).toBe(42);
      expect(result.title).toBe('Dentista');
      expect(result.tag_name).toBe('Saúde');
      expect(result.start_time).toBe('2026-06-17T09:00:00');
      expect(result.is_completed).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.notes).toContain('Levar carteirinha');
      expect(result.linkedListId).toBe(10);
      expect(result.completedAt).toBe('2026-06-17T10:30:00');
    });
  });

  describe('title vazio (edge case)', () => {
    it('mantém string vazia como título', () => {
      const raw = { id: 1, title: '' };
      expect(migrateEventSchema(raw).title).toBe('');
    });

    it('usa string vazia se title ausente', () => {
      const raw = { id: 1 };
      expect(migrateEventSchema(raw).title).toBe('');
    });
  });
});

describe('migrateListSchema', () => {
  describe('campos obrigatórios com dados mínimos', () => {
    const minimal = { id: 1, name: 'Mercado' };

    it('preenche type com "compras" se ausente', () => {
      expect(migrateListSchema(minimal).type).toBe('compras');
    });

    it('preenche suppliers com [] se ausente', () => {
      expect(migrateListSchema(minimal).suppliers).toEqual([]);
    });

    it('preenche items com [] se ausente', () => {
      expect(migrateListSchema(minimal).items).toEqual([]);
    });

    it('preenche isCompleted com false se ausente', () => {
      expect(migrateListSchema(minimal).isCompleted).toBe(false);
    });

    it('preenche isArchived com false se ausente', () => {
      expect(migrateListSchema(minimal).isArchived).toBe(false);
    });

    it('preenche totalSpent com 0 se ausente', () => {
      expect(migrateListSchema(minimal).totalSpent).toBe(0);
    });

    it('preenche linkedEventId com null se ausente', () => {
      expect(migrateListSchema(minimal).linkedEventId).toBeNull();
    });

    it('preenche completedAt com null se ausente', () => {
      expect(migrateListSchema(minimal).completedAt).toBeNull();
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
