// ===========================
// MIGRAÇÃO DE DADOS
// ===========================

import { ShoppingList } from '../types';
import { AppSettings } from './storage';

// Remove listas concluídas com base na política de auto-exclusão
export const cleanupCompletedLists = (lists: ShoppingList[], settings: AppSettings): ShoppingList[] => {
  const policy = settings.deleteCompletedListsAfter;
  if (!policy || policy === 'never') return lists;

  const now = Date.now();
  const ms = policy === '1day' ? 24 * 60 * 60 * 1000
    : policy === '1week' ? 7 * 24 * 60 * 60 * 1000
    : 30 * 24 * 60 * 60 * 1000;
  const limit = now - ms;

  return lists.filter(l => {
    if (!l.isCompleted) return true;
    if (!l.completedAt) return true;
    return new Date(l.completedAt).getTime() > limit;
  });
};
