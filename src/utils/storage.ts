// ===========================
// FUNÇÕES DE PERSISTÊNCIA
// ===========================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem, ListItem, ShoppingList } from '../types';
import { migrateListSchema } from './schemaUtils';

// ===========================
// CONFIGURAÇÕES DO APP
// ===========================

export interface AppSettings {
  theme?: string; // 'auto' | 'claro' | 'escuro'
  accentColor?: string; // 'roxo' | 'vermelho' | 'azul' | 'verde'
  language?: string; // 'pt' | 'en' | 'es'
  sharingEnabled?: boolean;
  onboardingDone?: boolean;
  displayName?: string; // nome visível para outros usuários
  // Termos de uso
  termsAccepted?: boolean;
  termsAcceptedAt?: string; // ISO timestamp
}

const SETTINGS_KEY = '@suplista_settings';

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

const LISTS_KEY = '@suplista_lists';

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

// ===========================
// CATÁLOGO DE ITENS (histórico universal)
// ===========================
const CATALOG_KEY = '@suplista_item_catalog';
const CATALOG_MAX = 500;

const normName = (s: string) => s.trim().toLowerCase();

export const loadCatalog = async (): Promise<CatalogItem[]> => {
  try {
    const data = await AsyncStorage.getItem(CATALOG_KEY);
    const raw: any[] = data ? JSON.parse(data) : [];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(e => e && typeof e.name === 'string' && e.name.trim())
      .map((e: any) => ({
        name: e.name,
        type: e.type === 'tarefas' ? 'tarefas' : 'compras',
        unit: e.unit ?? null,
        lastPrice: typeof e.lastPrice === 'number' ? e.lastPrice : null,
        priceType: e.priceType === 'total' ? 'total' : 'unit',
        lastUsedAt: typeof e.lastUsedAt === 'number' ? e.lastUsedAt : 0,
        useCount: typeof e.useCount === 'number' ? e.useCount : 1,
      }));
  } catch (error) {
    console.error('Erro ao carregar catálogo:', error);
    return [];
  }
};

export const saveCatalog = async (items: CatalogItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Erro ao salvar catálogo:', error);
  }
};

/**
 * Funde uma leva de itens no catálogo. Chave = nome normalizado + tipo.
 * Item já conhecido: incrementa useCount, atualiza lastUsedAt e (quando vierem
 * preenchidos) unit/lastPrice/priceType. Item novo: adiciona.
 * Acima de CATALOG_MAX entradas, poda as menos usadas recentemente (LRU).
 */
export const mergeIntoCatalog = (
  catalog: CatalogItem[],
  items: ListItem[],
  type: 'compras' | 'tarefas',
): CatalogItem[] => {
  const now = Date.now();
  const map = new Map<string, CatalogItem>();
  catalog.forEach(e => map.set(`${e.type}::${normName(e.name)}`, { ...e }));

  items.forEach(item => {
    const name = item.name?.trim();
    if (!name) return;
    const key = `${type}::${normName(name)}`;
    const existing = map.get(key);
    if (existing) {
      existing.useCount += 1;
      existing.lastUsedAt = now;
      if (item.unit != null) existing.unit = item.unit;
      if (item.price != null) {
        existing.lastPrice = item.price;
        existing.priceType = item.priceType ?? 'unit';
      }
    } else {
      map.set(key, {
        name,
        type,
        unit: item.unit ?? null,
        lastPrice: item.price ?? null,
        priceType: item.priceType ?? 'unit',
        lastUsedAt: now,
        useCount: 1,
      });
    }
  });

  const merged = Array.from(map.values());
  if (merged.length <= CATALOG_MAX) return merged;
  return merged.sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, CATALOG_MAX);
};

/** Semeia o catálogo a partir das listas atuais (primeira execução). */
export const seedCatalogFromLists = (lists: ShoppingList[]): CatalogItem[] => {
  let catalog: CatalogItem[] = [];
  lists.forEach(l => {
    catalog = mergeIntoCatalog(catalog, l.items, l.type);
  });
  return catalog;
};
