// ===========================
// SEED LOADER — Injeta banco de dados artificial no AsyncStorage
//
// Uso no terminal de debug do app (ou em __DEV__):
//   import { injectSeedData, clearSeedData, printSeedStats } from './seedLoader';
//   await injectSeedData();
//
// Como teste Jest:
//   jest __tests__/fixtures/seedLoader.ts
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  allEvents,
  allLists,
  rotinas,
  seedSettings,
  seedStats,
  shoppingLists,
} from '../../src/dev/seedDatabase';
import { migrateEventSchema, migrateListSchema } from '../../src/utils/schemaUtils';

const EVENTS_KEY = '@taskflow_events_clean';
const LISTS_KEY = '@taskflow_lists';
const ROTINAS_KEY = '@taskflow_rotinas';
const SETTINGS_KEY = '@taskflow_settings';

// Injeta todos os dados no AsyncStorage (sobrescreve tudo)
export async function injectSeedData(): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(allEvents)),
    AsyncStorage.setItem(LISTS_KEY, JSON.stringify(allLists)),
    AsyncStorage.setItem(ROTINAS_KEY, JSON.stringify(rotinas)),
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(seedSettings)),
  ]);
  console.log('[SeedLoader] Dados injetados com sucesso:', seedStats);
}

// Remove todos os dados injetados
export async function clearSeedData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(EVENTS_KEY),
    AsyncStorage.removeItem(LISTS_KEY),
    AsyncStorage.removeItem(ROTINAS_KEY),
    AsyncStorage.removeItem(SETTINGS_KEY),
  ]);
  console.log('[SeedLoader] AsyncStorage limpo.');
}

// Lê o que está no AsyncStorage e imprime estatísticas
export async function printSeedStats(): Promise<void> {
  const [eventsRaw, listsRaw, rotinasRaw] = await Promise.all([
    AsyncStorage.getItem(EVENTS_KEY),
    AsyncStorage.getItem(LISTS_KEY),
    AsyncStorage.getItem(ROTINAS_KEY),
  ]);
  const events = eventsRaw ? JSON.parse(eventsRaw) : [];
  const lists = listsRaw ? JSON.parse(listsRaw) : [];
  const rots = rotinasRaw ? JSON.parse(rotinasRaw) : [];
  console.log('[SeedLoader] Estatísticas no storage:', {
    events: events.length,
    lists: lists.length,
    rotinas: rots.length,
  });
}

// Re-exporta para uso em outros testes
export { allEvents, allLists, rotinas, seedSettings, seedStats, shoppingLists } from '../../src/dev/seedDatabase';

// ===========================
// MOCKS (apenas quando executado como teste Jest)
// ===========================

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockSetItem = (AsyncStorage.setItem as jest.Mock);
const mockGetItem = (AsyncStorage.getItem as jest.Mock);
const mockRemoveItem = (AsyncStorage.removeItem as jest.Mock);

beforeEach(() => {
  jest.clearAllMocks();
  mockSetItem.mockResolvedValue(undefined);
  mockGetItem.mockResolvedValue(null);
  mockRemoveItem.mockResolvedValue(undefined);
});

// ===========================
// TESTES DE INTEGRIDADE DO SEED
// ===========================

describe('Integridade do Banco de Dados Artificial', () => {
  it('possui pelo menos 500 registros totais', () => {
    console.log('Estatísticas do seed:', seedStats);
    expect(seedStats.total).toBeGreaterThanOrEqual(500);
  });

  it('todos os eventos têm IDs únicos', () => {
    const ids = allEvents.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('todas as listas têm IDs únicos', () => {
    const ids = allLists.map(l => l.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('todos os itens de lista têm IDs únicos dentro de sua lista', () => {
    allLists.forEach(list => {
      const ids = list.items.map(i => i.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  it('todas as rotinas têm IDs únicos', () => {
    const ids = rotinas.map(r => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('eventos com is_pending=true não têm start_time', () => {
    allEvents
      .filter(e => e.is_pending)
      .forEach(e => {
        expect(e.start_time).toBeNull();
      });
  });

  it('eventos concluídos têm completedAt preenchido', () => {
    allEvents
      .filter(e => e.is_completed)
      .forEach(e => {
        expect(e.completedAt).not.toBeNull();
      });
  });

  it('eventos agendados ativos têm start_time no futuro (>=2026-06-17)', () => {
    const TODAY = '2026-06-17';
    const scheduled = allEvents.filter(e => !e.is_pending && !e.is_completed && e.start_time);
    scheduled.forEach(e => {
      const dateStr = e.start_time!.substring(0, 10);
      expect(dateStr >= TODAY).toBe(true);
    });
  });

  it('listas arquivadas estão marcadas como concluídas', () => {
    allLists
      .filter(l => l.isArchived)
      .forEach(l => {
        expect(l.isCompleted).toBe(true);
      });
  });

  it('rotinas suspensas têm suspended_from_date', () => {
    rotinas
      .filter(r => r.is_suspended)
      .forEach(r => {
        expect(r.suspended_from_date).not.toBeNull();
      });
  });

  it('migrateEventSchema processa todos os eventos sem erros', () => {
    expect(() => allEvents.map(migrateEventSchema)).not.toThrow();
  });

  it('migrateListSchema processa todas as listas sem erros', () => {
    expect(() => allLists.map(migrateListSchema)).not.toThrow();
  });

  it('todos os tipos de tag_name são strings não-vazias', () => {
    allEvents.forEach(e => {
      expect(typeof e.tag_name).toBe('string');
      expect(e.tag_name.length).toBeGreaterThan(0);
    });
  });

  it('listas de compras têm pelo menos 1 item', () => {
    shoppingLists.forEach(l => {
      expect(l.items.length).toBeGreaterThan(0);
    });
  });

  it('tem pelo menos uma rotina de cada tipo de recorrência', () => {
    const types = rotinas.map(r => r.recurrence_type);
    expect(types).toContain('daily');
    expect(types).toContain('weekly');
    expect(types).toContain('monthly');
    expect(types).toContain('yearly');
    expect(types).toContain('custom');
  });

  it('tem pelo menos uma rotina suspensa', () => {
    const suspended = rotinas.filter(r => r.is_suspended);
    expect(suspended.length).toBeGreaterThan(0);
  });

  it('tem pendências adiadas (isScheduledFromPending=true)', () => {
    const postponed = allEvents.filter(e => e.isScheduledFromPending && e.is_pending);
    expect(postponed.length).toBeGreaterThan(0);
  });

  it('injectSeedData chama setItem 4 vezes', async () => {
    await injectSeedData();
    expect(mockSetItem).toHaveBeenCalledTimes(4);
    expect(mockSetItem).toHaveBeenCalledWith(EVENTS_KEY, expect.any(String));
    expect(mockSetItem).toHaveBeenCalledWith(LISTS_KEY, expect.any(String));
    expect(mockSetItem).toHaveBeenCalledWith(ROTINAS_KEY, expect.any(String));
    expect(mockSetItem).toHaveBeenCalledWith(SETTINGS_KEY, expect.any(String));
  });

  it('clearSeedData chama removeItem 4 vezes', async () => {
    await clearSeedData();
    expect(mockRemoveItem).toHaveBeenCalledTimes(4);
  });
});
