// ===========================
// FUNÇÕES DE PERSISTÊNCIA
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, Rotina, ShoppingList, WaterDayLog } from '../types';
import { migrateEventSchema, migrateListSchema } from './schemaUtils';

// ===========================
// CONFIGURAÇÕES DO APP
// ===========================

export type DeleteAfterPolicy = 'never' | '1day' | '1week' | '1month';

export interface AppSettings {
  autoMigrationEnabled: boolean;
  theme?: string; // 'auto' | 'claro' | 'escuro'
  language?: string; // 'pt' | 'en' | 'es'
  sharingEnabled?: boolean;
  onboardingDone?: boolean;
  displayName?: string; // nome visível para outros usuários
  deleteCompletedEventsAfter?: DeleteAfterPolicy;
  deleteCompletedPendingsAfter?: DeleteAfterPolicy;
  deleteCompletedRotinasAfter?: DeleteAfterPolicy;
  deleteCompletedListsAfter?: DeleteAfterPolicy;
  completedListsAction?: 'excluir' | 'arquivar';
  // Notificações locais (notifee)
  notificationsEnabled?: boolean;          // default: false
  notificationMode?: 'daily' | 'per-event'; // default: 'daily'
  notificationTime?: string;               // default: '08:00' (HH:MM)
  notificationLeadMinutes?: number;        // default: 30 (só Modo per-event)
  // Hidratação
  waterTrackerEnabled?: boolean;           // default: false
  waterDailyGoalMl?: number;              // default: 2000 (2L)
  waterReminderEnabled?: boolean;          // default: false (alertas de hidratação, independente do tracker)
  waterReminderIntervalMinutes?: number;   // default: 60 (1h)
  waterStartTime?: string;                 // default: '08:00' (HH:MM)
  waterEndTime?: string;                   // default: '18:00' (HH:MM)
  // Novos toggles de notificação por tipo
  notificationsListsEnabled?: boolean;     // default: false
  notificationsPendingsEnabled?: boolean;  // default: false
  // Perfil
  birthDate?: string;                      // 'DD/MM/AAAA' — feature futura de aniversário
  // Backup
  backupMode?: 'auto' | 'manual';          // default: 'manual'
  backupLocation?: 'local' | 'cloud';      // default: 'local'
  lastBackupAt?: string;                   // ISO timestamp do último backup bem-sucedido
  // Termos de uso
  termsAccepted?: boolean;
  termsAcceptedAt?: string;                // ISO timestamp
}

const SETTINGS_KEY = '@taskflow_settings';

const DEFAULT_SETTINGS: AppSettings = {
  autoMigrationEnabled: true,
  theme: 'escuro',
  language: 'pt',
};

export const loadSettings = async (): Promise<AppSettings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (partial: Partial<AppSettings>): Promise<void> => {
  try {
    const current = await loadSettings();
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...partial }));
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
};

const EVENTS_KEY = '@taskflow_events_clean';
const LISTS_KEY = '@taskflow_lists';
const ROTINAS_KEY = '@taskflow_rotinas';
const WATER_KEY = '@taskflow_water';

// EVENTOS
export const saveEvents = async (events: Event[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Erro ao salvar eventos:', error);
  }
};

export const loadEvents = async (): Promise<Event[]> => {
  try {
    const data = await AsyncStorage.getItem(EVENTS_KEY);
    const raw: any[] = data ? JSON.parse(data) : [];
    return raw.map(migrateEventSchema);
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    return [];
  }
};

// LISTAS
export const saveLists = async (lists: ShoppingList[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch (error) {
    console.error('Erro ao salvar listas:', error);
  }
};

export const loadLists = async (): Promise<ShoppingList[]> => {
  try {
    const data = await AsyncStorage.getItem(LISTS_KEY);
    const raw: any[] = data ? JSON.parse(data) : [];
    return raw.map(migrateListSchema);
  } catch (error) {
    console.error('Erro ao carregar listas:', error);
    return [];
  }
};

// HIDRATAÇÃO
export const loadWaterLog = async (): Promise<WaterDayLog | null> => {
  try {
    const data = await AsyncStorage.getItem(WATER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Erro ao carregar log de água:', error);
    return null;
  }
};

export const saveWaterLog = async (log: WaterDayLog): Promise<void> => {
  try {
    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(log));
  } catch (error) {
    console.error('Erro ao salvar log de água:', error);
  }
};

// ROTINAS
export const saveRotinas = async (rotinas: Rotina[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ROTINAS_KEY, JSON.stringify(rotinas));
  } catch (error) {
    console.error('Erro ao salvar rotinas:', error);
  }
};

export const loadRotinas = async (): Promise<Rotina[]> => {
  try {
    const data = await AsyncStorage.getItem(ROTINAS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao carregar rotinas:', error);
    return [];
  }
};
