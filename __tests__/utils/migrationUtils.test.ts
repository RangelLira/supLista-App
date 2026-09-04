// ===========================
// TESTES: migrationUtils
// ===========================

import {
  cleanupCompletedItems,
  cleanupCompletedRotinas,
  cleanupCompletedLists,
  migrateExpiredEvents,
} from '../../src/utils/migrationUtils';
import { Event, Rotina, ShoppingList } from '../../src/types';
import { AppSettings } from '../../src/utils/storage';

// Data base fixa para testes: 2026-06-17
const NOW = new Date('2026-06-17T12:00:00').getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;

// Spy no Date.now para controle nos testes de cleanup
const realDateNow = Date.now;

beforeEach(() => {
  Date.now = () => NOW;
});

afterEach(() => {
  Date.now = realDateNow;
});

// ===========================
// HELPERS
// ===========================

function makeEvent(overrides: Partial<Event>): Event {
  return {
    id: 1,
    title: 'Evento Teste',
    tag_name: 'Geral',
    start_time: null,
    is_completed: false,
    is_pending: false,
    steps: [],
    notes: [],
    linkedListId: null,
    serieId: null,
    isRecurring: false,
    isScheduledFromPending: false,
    isPreFilled: false,
    sharedWithUid: null,
    isSharedWithMe: false,
    completedAt: null,
    ...overrides,
  };
}

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    autoMigrationEnabled: true,
    ...overrides,
  };
}

function makeList(overrides: Partial<ShoppingList>): ShoppingList {
  return {
    id: 1,
    name: 'Lista Teste',
    type: 'compras',
    suppliers: [],
    items: [],
    createdAt: new Date().toISOString(),
    isCompleted: false,
    isArchived: false,
    totalSpent: 0,
    linkedEventId: null,
    linkedPendingId: null,
    completedAt: null,
    ...overrides,
  };
}

// ===========================
// cleanupCompletedItems
// ===========================

describe('cleanupCompletedItems', () => {
  const freshCompletedAt = new Date(NOW - ONE_DAY_MS / 2).toISOString(); // 12h atrás
  const oldCompletedAt1Day = new Date(NOW - ONE_DAY_MS - 1000).toISOString(); // 25h atrás
  const oldCompletedAt1Week = new Date(NOW - ONE_WEEK_MS - 1000).toISOString(); // 8 dias atrás
  const oldCompletedAt1Month = new Date(NOW - ONE_MONTH_MS - 1000).toISOString(); // 31 dias atrás

  describe('política "never"', () => {
    it('nunca remove itens concluídos', () => {
      const events = [
        makeEvent({ id: 1, is_completed: true, completedAt: oldCompletedAt1Month }),
        makeEvent({ id: 2, is_completed: false }),
      ];
      const settings = makeSettings({ deleteCompletedEventsAfter: 'never' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(2);
    });
  });

  describe('política "1day"', () => {
    it('mantém evento concluído há menos de 1 dia', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: freshCompletedAt })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1day' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(1);
    });

    it('remove evento concluído há mais de 1 dia', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: oldCompletedAt1Day })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1day' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(0);
    });
  });

  describe('política "1week"', () => {
    it('mantém evento concluído há menos de 1 semana', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: oldCompletedAt1Day })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1week' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(1);
    });

    it('remove evento concluído há mais de 1 semana', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: oldCompletedAt1Week })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1week' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(0);
    });
  });

  describe('política "1month"', () => {
    it('mantém evento concluído há menos de 1 mês', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: oldCompletedAt1Week })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1month' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(1);
    });

    it('remove evento concluído há mais de 1 mês', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: oldCompletedAt1Month })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1month' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(0);
    });
  });

  describe('distinção evento vs pendência', () => {
    it('aplica política de eventos para eventos (is_pending=false)', () => {
      const events = [
        makeEvent({ id: 1, is_completed: true, is_pending: false, completedAt: oldCompletedAt1Day }),
      ];
      const settings = makeSettings({
        deleteCompletedEventsAfter: '1day',
        deleteCompletedPendingsAfter: 'never',
      });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(0);
    });

    it('aplica política de pendências para pendências (is_pending=true)', () => {
      const events = [
        makeEvent({ id: 1, is_completed: true, is_pending: true, completedAt: oldCompletedAt1Day }),
      ];
      const settings = makeSettings({
        deleteCompletedEventsAfter: 'never',
        deleteCompletedPendingsAfter: '1day',
      });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(0);
    });
  });

  describe('itens sem completedAt', () => {
    it('mantém item concluído sem timestamp (proteção de dados)', () => {
      const events = [makeEvent({ id: 1, is_completed: true, completedAt: null })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1day' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(1);
    });
  });

  describe('não toca em itens não concluídos', () => {
    it('mantém evento ativo independente da política', () => {
      const events = [makeEvent({ id: 1, is_completed: false })];
      const settings = makeSettings({ deleteCompletedEventsAfter: '1day' });
      expect(cleanupCompletedItems(events, settings)).toHaveLength(1);
    });
  });
});

// ===========================
// cleanupCompletedRotinas
// ===========================

describe('cleanupCompletedRotinas', () => {
  const recentKey = '2026-06-16'; // ontem
  const oldKey1Week = '2026-06-08'; // 9 dias atrás
  const oldKey1Month = '2026-05-01'; // 47 dias atrás

  function makeRotina(completedInstances: string[]): Rotina {
    return {
      id: 1,
      title: 'Rotina Teste',
      tag_name: 'Saúde',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      time: '08:00',
      end_time: null,
      recurrence_type: 'daily',
      weekdays: [],
      month_day: null,
      custom_interval: null,
      custom_unit: null,
      custom_reps: null,
      notes: [],
      is_suspended: false,
      suspended_from_date: null,
      completed_instances: completedInstances,
      linked_lists: {},
    };
  }

  it('política "never" mantém todas as instâncias', () => {
    const rotinas = [makeRotina([recentKey, oldKey1Month])];
    const settings = makeSettings({ deleteCompletedRotinasAfter: 'never' });
    expect(cleanupCompletedRotinas(rotinas, settings)[0].completed_instances).toHaveLength(2);
  });

  it('política "1week" remove instâncias antigas, mantém recentes', () => {
    const rotinas = [makeRotina([recentKey, oldKey1Week])];
    const settings = makeSettings({ deleteCompletedRotinasAfter: '1week' });
    const result = cleanupCompletedRotinas(rotinas, settings);
    expect(result[0].completed_instances).toContain(recentKey);
    expect(result[0].completed_instances).not.toContain(oldKey1Week);
  });

  it('política "1month" mantém instâncias da última semana', () => {
    const rotinas = [makeRotina([recentKey, oldKey1Week])];
    const settings = makeSettings({ deleteCompletedRotinasAfter: '1month' });
    const result = cleanupCompletedRotinas(rotinas, settings);
    expect(result[0].completed_instances).toHaveLength(2);
  });

  it('política "1month" remove instâncias de mais de 30 dias', () => {
    const rotinas = [makeRotina([oldKey1Month])];
    const settings = makeSettings({ deleteCompletedRotinasAfter: '1month' });
    const result = cleanupCompletedRotinas(rotinas, settings);
    expect(result[0].completed_instances).toHaveLength(0);
  });

  it('retorna rotina idêntica se nada precisa ser removido (sem mutação)', () => {
    const rotinas = [makeRotina([recentKey])];
    const settings = makeSettings({ deleteCompletedRotinasAfter: '1week' });
    const result = cleanupCompletedRotinas(rotinas, settings);
    expect(result[0]).toBe(rotinas[0]); // mesma referência = sem mutação
  });
});

// ===========================
// cleanupCompletedLists
// ===========================

describe('cleanupCompletedLists', () => {
  const freshCompletedAt = new Date(NOW - ONE_DAY_MS / 2).toISOString();
  const oldCompletedAt1Week = new Date(NOW - ONE_WEEK_MS - 1000).toISOString();

  describe('política "never"', () => {
    it('mantém listas concluídas antigas', () => {
      const lists = [makeList({ id: 1, isCompleted: true, completedAt: oldCompletedAt1Week })];
      const settings = makeSettings({ deleteCompletedListsAfter: 'never' });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(1);
    });
  });

  describe('ação "excluir"', () => {
    it('remove lista concluída expirada', () => {
      const lists = [makeList({ id: 1, isCompleted: true, completedAt: oldCompletedAt1Week })];
      const settings = makeSettings({
        deleteCompletedListsAfter: '1week',
        completedListsAction: 'excluir',
      });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(0);
    });

    it('mantém lista concluída recente', () => {
      const lists = [makeList({ id: 1, isCompleted: true, completedAt: freshCompletedAt })];
      const settings = makeSettings({
        deleteCompletedListsAfter: '1week',
        completedListsAction: 'excluir',
      });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(1);
    });
  });

  describe('ação "arquivar" (padrão)', () => {
    it('arquiva lista concluída expirada em vez de excluir', () => {
      const lists = [makeList({ id: 1, isCompleted: true, completedAt: oldCompletedAt1Week })];
      const settings = makeSettings({
        deleteCompletedListsAfter: '1week',
        completedListsAction: 'arquivar',
      });
      const result = cleanupCompletedLists(lists, settings);
      expect(result).toHaveLength(1);
      expect(result[0].isArchived).toBe(true);
    });

    it('não arquiva lista já arquivada (idempotência)', () => {
      const lists = [
        makeList({ id: 1, isCompleted: true, isArchived: true, completedAt: oldCompletedAt1Week }),
      ];
      const settings = makeSettings({
        deleteCompletedListsAfter: '1week',
        completedListsAction: 'arquivar',
      });
      const result = cleanupCompletedLists(lists, settings);
      expect(result[0]).toBe(lists[0]); // sem mutação
    });
  });

  describe('listas ativas não são afetadas', () => {
    it('mantém lista ativa independente da política', () => {
      const lists = [makeList({ id: 1, isCompleted: false })];
      const settings = makeSettings({ deleteCompletedListsAfter: '1day', completedListsAction: 'excluir' });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(1);
    });
  });
});

// ===========================
// migrateExpiredEvents
// ===========================

describe('migrateExpiredEvents', () => {
  // Mocks a data "hoje" via sistema de datas reais (não usa Date.now)
  const TODAY = '2026-06-17';

  it('converte evento com data passada para pendência', () => {
    const events = [
      makeEvent({
        id: 1,
        start_time: '2026-06-10T10:00:00', // passado
        is_pending: false,
        is_completed: false,
      }),
    ];
    const result = migrateExpiredEvents(events);
    expect(result[0].is_pending).toBe(true);
    expect(result[0].start_time).toBeNull();
    expect(result[0].is_completed).toBe(false);
  });

  it('não converte evento futuro', () => {
    const events = [
      makeEvent({
        id: 1,
        start_time: '2026-12-25T10:00:00', // futuro
        is_pending: false,
        is_completed: false,
      }),
    ];
    const result = migrateExpiredEvents(events);
    expect(result[0].is_pending).toBe(false);
    expect(result[0].start_time).toBe('2026-12-25T10:00:00');
  });

  it('não converte evento já concluído', () => {
    const events = [
      makeEvent({
        id: 1,
        start_time: '2026-06-01T10:00:00',
        is_pending: false,
        is_completed: true,
      }),
    ];
    const result = migrateExpiredEvents(events);
    expect(result[0].is_pending).toBe(false);
    expect(result[0].start_time).toBe('2026-06-01T10:00:00');
  });

  it('não converte pendência existente (is_pending já true)', () => {
    const events = [
      makeEvent({
        id: 1,
        start_time: null,
        is_pending: true,
        is_completed: false,
      }),
    ];
    const result = migrateExpiredEvents(events);
    expect(result[0].is_pending).toBe(true);
    expect(result[0].start_time).toBeNull();
  });

  it('não converte evento sem start_time', () => {
    const events = [
      makeEvent({ id: 1, start_time: null, is_pending: false, is_completed: false }),
    ];
    const result = migrateExpiredEvents(events);
    expect(result[0].is_pending).toBe(false);
  });

  it('processa múltiplos eventos corretamente', () => {
    const events = [
      makeEvent({ id: 1, start_time: '2026-05-01T10:00:00', is_pending: false, is_completed: false }),
      makeEvent({ id: 2, start_time: '2026-08-01T10:00:00', is_pending: false, is_completed: false }),
      makeEvent({ id: 3, start_time: '2026-06-01T10:00:00', is_pending: false, is_completed: true }),
    ];
    const result = migrateExpiredEvents(events);
    expect(result[0].is_pending).toBe(true);  // passado ativo → pendência
    expect(result[1].is_pending).toBe(false); // futuro → mantém
    expect(result[2].is_pending).toBe(false); // concluído → mantém
  });
});
