// ===========================
// TESTES: storage (com mock AsyncStorage)
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadSettings,
  saveSettings,
  loadLists,
  saveLists,
} from '../../src/utils/storage';
import { ShoppingList } from '../../src/types';

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

describe('loadSettings', () => {
  it('retorna defaults quando AsyncStorage vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const settings = await loadSettings();
    expect(settings.theme).toBe('escuro');
    expect(settings.language).toBe('pt');
  });

  it('mescla configurações salvas com defaults', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ theme: 'claro', language: 'en' }));
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

describe('saveSettings', () => {
  it('salva configurações parciais mescladas com existentes', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ theme: 'claro', language: 'en' }));
    mockSetItem.mockResolvedValueOnce(undefined);
    await saveSettings({ language: 'es' });
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved.language).toBe('es');
    expect(saved.theme).toBe('claro'); // preservado
  });

  it('não lança erro em caso de falha', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    mockSetItem.mockRejectedValueOnce(new Error('Disk full'));
    await expect(saveSettings({ theme: 'auto' })).resolves.toBeUndefined();
  });
});

describe('saveLists / loadLists', () => {
  const listBase: ShoppingList = {
    id: 2001,
    name: 'Mercado da Semana',
    suppliers: ['Carrefour'],
    items: [
      { id: 1, name: 'Arroz', quantity: 2, unit: 'kg', isChecked: false, price: 12.99, priceType: 'unit' },
    ],
    createdAt: '2026-06-17T08:00:00',
    isCompleted: false,
    isArchived: false,
    archivedAt: null,
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
    mockGetItem.mockResolvedValueOnce(JSON.stringify([{ id: 2, name: 'Lista Velha' }]));
    const lists = await loadLists();
    expect(lists[0].items).toEqual([]);
    expect(lists[0].isCompleted).toBe(false);
    expect(lists[0].isArchived).toBe(false);
  });

  it('retorna [] quando AsyncStorage vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    expect(await loadLists()).toEqual([]);
  });
});
