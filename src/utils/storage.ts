// ===========================
// FUNÇÕES DE PERSISTÊNCIA
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingList } from '../types';
import { migrateListSchema } from './schemaUtils';

// ===========================
// CONFIGURAÇÕES DO APP
// ===========================

export type DeleteAfterPolicy = 'never' | '1day' | '1week' | '1month';

export interface AppSettings {
  theme?: string; // 'auto' | 'claro' | 'escuro'
  language?: string; // 'pt' | 'en' | 'es'
  sharingEnabled?: boolean;
  onboardingDone?: boolean;
  displayName?: string; // nome visível para outros usuários
  deleteCompletedListsAfter?: DeleteAfterPolicy;
  completedListsAction?: 'excluir' | 'arquivar';
  // Perfil
  birthDate?: string; // 'DD/MM/AAAA'
  // Backup
  lastBackupAt?: string; // ISO timestamp do último backup bem-sucedido
  // Termos de uso
  termsAccepted?: boolean;
  termsAcceptedAt?: string; // ISO timestamp
}

const SETTINGS_KEY = '@suplist_settings';

const DEFAULT_SETTINGS: AppSettings = {
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

const LISTS_KEY = '@suplist_lists';

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
