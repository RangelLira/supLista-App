// ===========================
// MIGRAÇÃO DE DADOS
// ===========================

import { Event, Rotina, ShoppingList } from '../types';
import { AppSettings } from './storage';
import { formatDate } from './dateUtils';

// Remove itens concluídos com base na política de auto-exclusão
export const cleanupCompletedItems = (events: Event[], settings: AppSettings): Event[] => {
  const now = Date.now();

  const threshold = (policy?: string): number | null => {
    if (!policy || policy === 'never') return null;
    if (policy === '1day')   return now - 24 * 60 * 60 * 1000;
    if (policy === '1week')  return now - 7  * 24 * 60 * 60 * 1000;
    if (policy === '1month') return now - 30 * 24 * 60 * 60 * 1000;
    return null;
  };

  const eventLimit   = threshold(settings.deleteCompletedEventsAfter);
  const pendingLimit = threshold(settings.deleteCompletedPendingsAfter);

  return events.filter(e => {
    if (!e.is_completed) return true;
    if (e.isSharedWithMe) return true; // itens recebidos nunca são deletados localmente
    if (!e.completedAt)  return true; // sem timestamp → mantém
    const t = new Date(e.completedAt).getTime();
    const limit = e.is_pending ? pendingLimit : eventLimit;
    return limit === null || t > limit;
  });
};

// Remove instâncias concluídas de rotinas com base na política de auto-exclusão
export const cleanupCompletedRotinas = (rotinas: Rotina[], settings: AppSettings): Rotina[] => {
  const policy = settings.deleteCompletedRotinasAfter;
  if (!policy || policy === 'never') return rotinas;

  const now = Date.now();
  const ms = policy === '1day' ? 24 * 60 * 60 * 1000
    : policy === '1week' ? 7 * 24 * 60 * 60 * 1000
    : 30 * 24 * 60 * 60 * 1000;
  const limit = now - ms;

  return rotinas.map(rotina => {
    const filtered = rotina.completed_instances.filter(key => {
      const datePart = key.split('T')[0];
      return new Date(datePart).getTime() > limit;
    });
    if (filtered.length === rotina.completed_instances.length) return rotina;
    return { ...rotina, completed_instances: filtered };
  });
};

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

// Migra eventos vencidos para pendências automaticamente
export const migrateExpiredEvents = (events: Event[]): Event[] => {
  const today = new Date();
  const todayStr = formatDate(today);

  return events.map(event => {
    if (event.start_time && !event.is_completed && !event.is_pending) {
      const eventDateStr = event.start_time.split('T')[0];
      if (eventDateStr < todayStr) {
        console.log(`Migrando evento vencido: ${event.title}`);
        return {
          ...event,
          start_time: null,
          is_pending: true,
          is_completed: false,
        };
      }
    }
    return event;
  });
};