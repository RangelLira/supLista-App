// ===========================
// TESTES: migrationUtils
// ===========================

import { cleanupCompletedLists } from '../../src/utils/migrationUtils';
import { ShoppingList } from '../../src/types';
import { AppSettings } from '../../src/utils/storage';

const NOW = new Date('2026-06-17T12:00:00').getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

const realDateNow = Date.now;

beforeEach(() => {
  Date.now = () => NOW;
});

afterEach(() => {
  Date.now = realDateNow;
});

function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return { ...overrides };
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
    completedAt: null,
    ...overrides,
  };
}

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

  describe('política "1week"', () => {
    it('remove lista concluída expirada', () => {
      const lists = [makeList({ id: 1, isCompleted: true, completedAt: oldCompletedAt1Week })];
      const settings = makeSettings({ deleteCompletedListsAfter: '1week' });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(0);
    });

    it('mantém lista concluída recente', () => {
      const lists = [makeList({ id: 1, isCompleted: true, completedAt: freshCompletedAt })];
      const settings = makeSettings({ deleteCompletedListsAfter: '1week' });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(1);
    });
  });

  describe('listas ativas não são afetadas', () => {
    it('mantém lista ativa independente da política', () => {
      const lists = [makeList({ id: 1, isCompleted: false })];
      const settings = makeSettings({ deleteCompletedListsAfter: '1day' });
      expect(cleanupCompletedLists(lists, settings)).toHaveLength(1);
    });
  });
});
