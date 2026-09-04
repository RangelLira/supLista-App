// ===========================
// SCHEMA UTILS — DEFAULTS PARA DADOS ANTIGOS
// ===========================
// Garante que dados carregados de versões anteriores do app tenham
// todos os campos com valores válidos (evita crashes por undefined).

import { Event, ShoppingList } from '../types';

/**
 * Garante que um Event carregado do AsyncStorage tenha todos os campos.
 * Trata a migração: sharedWith[] (v1.x) → sharedWithUid (v1.3+).
 */
export const migrateEventSchema = (raw: any): Event => {
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
    title: raw.title ?? '',
    tag_name: raw.tag_name ?? 'Geral',
    start_time: raw.start_time ?? null,
    is_completed: raw.is_completed ?? false,
    is_pending: raw.is_pending ?? false,
    steps: raw.steps ?? [],
    notes: raw.notes ?? [],
    linkedListId: raw.linkedListId ?? null,
    serieId: raw.serieId ?? null,
    isRecurring: raw.isRecurring ?? false,
    isScheduledFromPending: raw.isScheduledFromPending ?? false,
    isPreFilled: raw.isPreFilled ?? false,
    sharedWithUid,
    ownerUid: raw.ownerUid ?? undefined,
    isSharedWithMe: raw.isSharedWithMe ?? false,
    completedAt: raw.completedAt ?? null,
    createdAt: raw.createdAt ?? null,
  };
};

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
    linkedEventId: raw.linkedEventId ?? null,
    linkedPendingId: raw.linkedPendingId ?? null,
    linkedRotinaId: raw.linkedRotinaId ?? null,
    linkedRotinaInstance: raw.linkedRotinaInstance ?? null,
    sharedWithUid,
    ownerUid: raw.ownerUid ?? undefined,
    isSharedWithMe: raw.isSharedWithMe ?? false,
    completedAt: raw.completedAt ?? null,
    notes: raw.notes ?? undefined,
    tag_name: raw.tag_name ?? 'Geral',
  };
};
