// ===========================
// DEV SEED INJECTOR
// Disponível apenas em __DEV__.
// Importa os dados de teste e os injeta no AsyncStorage.
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  allEvents,
  allLists,
  rotinas,
  seedSettings,
  seedStats,
} from './seedDatabase';

const EVENTS_KEY = '@taskflow_events_clean';
const LISTS_KEY = '@taskflow_lists';
const ROTINAS_KEY = '@taskflow_rotinas';
const SETTINGS_KEY = '@taskflow_settings';

export async function injectSeedData(): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(allEvents)),
    AsyncStorage.setItem(LISTS_KEY, JSON.stringify(allLists)),
    AsyncStorage.setItem(ROTINAS_KEY, JSON.stringify(rotinas)),
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(seedSettings)),
  ]);
  console.log('[DevSeed] Injetado:', seedStats.total, 'registros');
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(EVENTS_KEY),
    AsyncStorage.removeItem(LISTS_KEY),
    AsyncStorage.removeItem(ROTINAS_KEY),
    AsyncStorage.removeItem(SETTINGS_KEY),
  ]);
  console.log('[DevSeed] AsyncStorage limpo.');
}

export { seedStats };
