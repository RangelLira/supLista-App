// ===========================
// SCHEMA UTILS — DEFAULTS PARA DADOS ANTIGOS
// ===========================
// Garante que dados carregados de versões anteriores do app tenham
// todos os campos com valores válidos (evita crashes por undefined).

import { ShoppingList } from '../types';

/**
 * Garante que uma ShoppingList carregada do AsyncStorage tenha todos os campos.
 * Trata a migração: sharedWith[] (v1.x) → sharedWithUid (v1.3+).
 */
export const migrateListSchema = (raw: any): ShoppingList => {
  // Compatibilidade retroativa: sharedWith[] (v1.x) → sharedWithUid (v1.3+)
  let sharedWithUid: string | null = raw.sharedWithUid ?? null;
  if (!sharedWithUid) {
    const legacy = raw.sharedWith;
    if (Array.isArray(legacy) && legacy.length > 0) {
      sharedWithUid = legacy[0] as string;
    }
  }

  return {
    id: raw.id,
    name: raw.name ?? '',
    type: raw.type ?? 'compras',
    suppliers: raw.suppliers ?? [],
    items: (raw.items ?? []).map((item: any) => ({
      id: item.id,
      name: item.name ?? '',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? null,
      isChecked: item.isChecked ?? false,
      price: item.price ?? null,
      priceType: item.priceType ?? 'unit',
    })),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    isCompleted: raw.isCompleted ?? false,
    isArchived: raw.isArchived ?? false,
    totalSpent: raw.totalSpent ?? 0,
    sharedWithUid,
    ownerUid: raw.ownerUid ?? undefined,
    isSharedWithMe: raw.isSharedWithMe ?? false,
    completedAt: raw.completedAt ?? null,
    notes: raw.notes ?? undefined,
    tag_name: raw.tag_name ?? 'Geral',
  };
};
