// ===========================
// TESTES: storage (com mock AsyncStorage)
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadSettings,
  saveSettings,
  loadLists,
  saveLists,
  loadCatalog,
  mergeIntoCatalog,
  seedCatalogFromLists,
} from '../../src/utils/storage';
import { CatalogItem, ListItem, ShoppingList } from '../../src/types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

// ===========================
// loadSettings
// ===========================

describe('loadSettings', () => {
  it('retorna defaults quando AsyncStorage vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const settings = await loadSettings();
    expect(settings.theme).toBe('escuro');
    expect(settings.language).toBe('pt');
  });

  it('mescla configurações salvas com defaults', async () => {
    const saved = { theme: 'claro', language: 'en' };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(saved));
    const settings = await loadSettings();
    expect(settings.theme).toBe('claro');
    expect(settings.language).toBe('en');
  });

  it('retorna defaults em caso de erro', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('AsyncStorage error'));
    const settings = await loadSettings();
    expect(settings.theme).toBe('escuro');
  });
});

// ===========================
// saveSettings
// ===========================

describe('saveSettings', () => {
  it('salva configurações parciais mescladas com existentes', async () => {
    const existing = { theme: 'claro', language: 'en' };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(existing));
    mockSetItem.mockResolvedValueOnce(undefined);

    await saveSettings({ language: 'es' });

    const callArgs = mockSetItem.mock.calls[0];
    const saved = JSON.parse(callArgs[1]);
    expect(saved.language).toBe('es');
    expect(saved.theme).toBe('claro'); // preservado
  });

  it('não lança erro em caso de falha', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    mockSetItem.mockRejectedValueOnce(new Error('Disk full'));
    await expect(saveSettings({ theme: 'auto' })).resolves.toBeUndefined();
  });
});

// ===========================
// saveLists / loadLists
// ===========================

describe('saveLists / loadLists', () => {
  const listBase: ShoppingList = {
    id: 2001,
    name: 'Mercado da Semana',
    type: 'compras',
    suppliers: ['Carrefour'],
    items: [
      { id: 1, name: 'Arroz', quantity: 2, unit: 'kg', isChecked: false, price: 12.99, priceType: 'unit' },
    ],
    createdAt: '2026-06-17T08:00:00',
    isCompleted: false,
    isArchived: false,
    totalSpent: 0,
    completedAt: null,
  };

  it('salva listas no AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await saveLists([listBase]);
    expect(mockSetItem).toHaveBeenCalledWith('@suplista_lists', expect.any(String));
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved[0].name).toBe('Mercado da Semana');
    expect(saved[0].items).toHaveLength(1);
  });

  it('carrega e migra schema de listas', async () => {
    const raw = [{ id: 2, name: 'Lista Velha' }];
    mockGetItem.mockResolvedValueOnce(JSON.stringify(raw));
    const lists = await loadLists();
    expect(lists[0].type).toBe('compras'); // default
    expect(lists[0].items).toEqual([]);
    expect(lists[0].isCompleted).toBe(false);
  });

  it('retorna [] quando AsyncStorage vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const lists = await loadLists();
    expect(lists).toEqual([]);
  });
});

// ===========================
// catálogo de itens
// ===========================

describe('mergeIntoCatalog', () => {
  const item = (over: Partial<ListItem> = {}): ListItem => ({
    id: 1, name: 'Arroz', quantity: 1, unit: 'kg', isChecked: false, price: null, ...over,
  });

  it('adiciona item novo', () => {
    const out = mergeIntoCatalog([], [item()], 'compras');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'Arroz', type: 'compras', unit: 'kg', useCount: 1 });
  });

  it('incrementa useCount e atualiza preço/unidade de item conhecido', () => {
    const seed: CatalogItem[] = [
      { name: 'Arroz', type: 'compras', unit: 'kg', lastPrice: null, priceType: 'unit', lastUsedAt: 1, useCount: 1 },
    ];
    const out = mergeIntoCatalog(seed, [item({ name: ' arroz ', price: 9.9, priceType: 'unit' })], 'compras');
    expect(out).toHaveLength(1);
    expect(out[0].useCount).toBe(2);
    expect(out[0].lastPrice).toBe(9.9);
    expect(out[0].lastUsedAt).toBeGreaterThan(1);
  });

  it('separa mesmo nome por tipo de lista', () => {
    let cat = mergeIntoCatalog([], [item({ name: 'Comprar leite' })], 'compras');
    cat = mergeIntoCatalog(cat, [item({ name: 'Comprar leite' })], 'tarefas');
    expect(cat).toHaveLength(2);
  });

  it('poda para no máximo 500 entradas mantendo as mais recentes', () => {
    const many: ListItem[] = Array.from({ length: 600 }, (_, i) => item({ id: i, name: `Item ${i}` }));
    const out = mergeIntoCatalog([], many, 'compras');
    expect(out).toHaveLength(500);
  });
});

describe('seedCatalogFromLists / loadCatalog', () => {
  it('semeia a partir dos itens das listas', () => {
    const lists: ShoppingList[] = [
      {
        id: 1, name: 'A', type: 'compras', suppliers: [], createdAt: '', isCompleted: false,
        isArchived: false, totalSpent: 0, completedAt: null,
        items: [
          { id: 1, name: 'Arroz', quantity: 1, unit: 'kg', isChecked: false, price: 5, priceType: 'unit' },
          { id: 2, name: 'Feijão', quantity: 1, unit: null, isChecked: true, price: null },
        ],
      },
    ];
    const cat = seedCatalogFromLists(lists);
    expect(cat.map(c => c.name).sort()).toEqual(['Arroz', 'Feijão']);
  });

  it('loadCatalog retorna [] quando vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    expect(await loadCatalog()).toEqual([]);
  });
});
