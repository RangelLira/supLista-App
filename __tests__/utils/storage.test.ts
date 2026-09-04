// ===========================
// TESTES: storage (com mock AsyncStorage)
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadSettings,
  saveSettings,
  loadEvents,
  saveEvents,
  loadLists,
  saveLists,
  loadRotinas,
  saveRotinas,
  AppSettings,
} from '../../src/utils/storage';
import { Event, ShoppingList, Rotina } from '../../src/types';

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
    expect(settings.autoMigrationEnabled).toBe(true);
    expect(settings.theme).toBe('escuro');
    expect(settings.language).toBe('pt');
  });

  it('mescla configurações salvas com defaults', async () => {
    const saved = { theme: 'claro', language: 'en' };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(saved));
    const settings = await loadSettings();
    expect(settings.theme).toBe('claro');
    expect(settings.language).toBe('en');
    expect(settings.autoMigrationEnabled).toBe(true); // default mantido
  });

  it('retorna defaults em caso de erro', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('AsyncStorage error'));
    const settings = await loadSettings();
    expect(settings.autoMigrationEnabled).toBe(true);
    expect(settings.theme).toBe('escuro');
  });

  it('carrega todas as configurações de notificação', async () => {
    const saved: Partial<AppSettings> = {
      notificationsEnabled: true,
      notificationMode: 'per-event',
      notificationTime: '09:00',
      notificationLeadMinutes: 15,
    };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(saved));
    const settings = await loadSettings();
    expect(settings.notificationsEnabled).toBe(true);
    expect(settings.notificationMode).toBe('per-event');
    expect(settings.notificationTime).toBe('09:00');
    expect(settings.notificationLeadMinutes).toBe(15);
  });

  it('carrega configurações de hidratação', async () => {
    const saved: Partial<AppSettings> = {
      waterTrackerEnabled: true,
      waterDailyGoalMl: 2500,
      waterReminderIntervalMinutes: 30,
    };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(saved));
    const settings = await loadSettings();
    expect(settings.waterTrackerEnabled).toBe(true);
    expect(settings.waterDailyGoalMl).toBe(2500);
    expect(settings.waterReminderIntervalMinutes).toBe(30);
  });
});

// ===========================
// saveSettings
// ===========================

describe('saveSettings', () => {
  it('salva configurações parciais mescladas com existentes', async () => {
    const existing = { theme: 'claro', language: 'en', autoMigrationEnabled: false };
    mockGetItem.mockResolvedValueOnce(JSON.stringify(existing));
    mockSetItem.mockResolvedValueOnce(undefined);

    await saveSettings({ language: 'es' });

    const callArgs = mockSetItem.mock.calls[0];
    const saved = JSON.parse(callArgs[1]);
    expect(saved.language).toBe('es');
    expect(saved.theme).toBe('claro'); // preservado
    expect(saved.autoMigrationEnabled).toBe(false); // preservado
  });

  it('não lança erro em caso de falha', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    mockSetItem.mockRejectedValueOnce(new Error('Disk full'));
    await expect(saveSettings({ theme: 'auto' })).resolves.toBeUndefined();
  });
});

// ===========================
// saveEvents / loadEvents
// ===========================

describe('saveEvents / loadEvents', () => {
  const eventBase: Event = {
    id: 1001,
    title: 'Reunião de Trabalho',
    tag_name: 'Trabalho',
    start_time: '2026-06-17T14:00:00',
    is_completed: false,
    is_pending: false,
    steps: [],
    notes: ['Preparar slides'],
    linkedListId: null,
    serieId: null,
    isRecurring: false,
    isScheduledFromPending: false,
    isPreFilled: false,
    sharedWithUid: null,
    isSharedWithMe: false,
    completedAt: null,
  };

  it('salva eventos como JSON no AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await saveEvents([eventBase]);
    expect(mockSetItem).toHaveBeenCalledWith(
      '@taskflow_events_clean',
      expect.any(String)
    );
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved[0].id).toBe(1001);
    expect(saved[0].title).toBe('Reunião de Trabalho');
  });

  it('carrega e executa migrateEventSchema em cada evento', async () => {
    const raw = [{ id: 1, title: 'Evento Antigo' }]; // sem campos novos
    mockGetItem.mockResolvedValueOnce(JSON.stringify(raw));
    const events = await loadEvents();
    expect(events[0].notes).toEqual([]); // adicionado pelo schema migration
    expect(events[0].completedAt).toBeNull();
    expect(events[0].sharedWithUid).toBeNull();
  });

  it('retorna [] quando AsyncStorage vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const events = await loadEvents();
    expect(events).toEqual([]);
  });

  it('retorna [] em caso de erro', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('Erro'));
    const events = await loadEvents();
    expect(events).toEqual([]);
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
    linkedEventId: null,
    linkedPendingId: null,
    completedAt: null,
  };

  it('salva listas no AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await saveLists([listBase]);
    expect(mockSetItem).toHaveBeenCalledWith('@taskflow_lists', expect.any(String));
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
// saveRotinas / loadRotinas
// ===========================

describe('saveRotinas / loadRotinas', () => {
  const rotinaBase: Rotina = {
    id: 3001,
    title: 'Exercício Matinal',
    tag_name: 'Saúde',
    start_date: '2026-06-01',
    end_date: '2026-12-31',
    time: '07:00',
    end_time: '08:00',
    recurrence_type: 'daily',
    weekdays: [],
    month_day: null,
    custom_interval: null,
    custom_unit: null,
    custom_reps: null,
    notes: [],
    is_suspended: false,
    suspended_from_date: null,
    completed_instances: [],
    linked_lists: {},
  };

  it('salva rotinas no AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);
    await saveRotinas([rotinaBase]);
    expect(mockSetItem).toHaveBeenCalledWith('@taskflow_rotinas', expect.any(String));
    const saved = JSON.parse(mockSetItem.mock.calls[0][1]);
    expect(saved[0].title).toBe('Exercício Matinal');
  });

  it('carrega rotinas do AsyncStorage', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify([rotinaBase]));
    const rotinas = await loadRotinas();
    expect(rotinas).toHaveLength(1);
    expect(rotinas[0].recurrence_type).toBe('daily');
    expect(rotinas[0].completed_instances).toEqual([]);
  });

  it('retorna [] quando AsyncStorage vazio', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const rotinas = await loadRotinas();
    expect(rotinas).toEqual([]);
  });
});
