// ===========================
// APP.TSX — TASKFLOW V2
// Navegação principal + gerenciamento de estado global
// ===========================

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import EventForm from './src/components/EventForm';
import EventTypeModal from './src/components/EventTypeModal';
import PendingForm from './src/components/PendingForm';
import RoutineForm from './src/components/RoutineForm';
import SearchModal from './src/components/SearchModal';
import { ToastProvider } from './src/components/Toast';
import { FirebaseProvider, useFirebase } from './src/contexts/FirebaseContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import EventsScreen from './src/screens/EventsScreen';
import HomeScreen from './src/screens/HomeScreen';
import ListsScreen from './src/screens/ListsScreen';
import PendingScreen from './src/screens/PendingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Event, Rotina, ScreenName, ShoppingList } from './src/types';
import { formatDate } from './src/utils/dateUtils';
import { migrateExpiredEvents, cleanupCompletedItems, cleanupCompletedRotinas, cleanupCompletedLists } from './src/utils/migrationUtils';
import { getOccurrencesForDate } from './src/utils/rotinaUtils';
import {
  loadEvents, loadLists, loadRotinas, loadSettings, loadWaterLog,
  saveEvents, saveLists, saveRotinas, saveSettings, saveWaterLog,
  DeleteAfterPolicy,
} from './src/utils/storage';
import { WaterDayLog } from './src/types';
import { scheduleAllNotifications, scheduleWaterReminders } from './src/utils/notificationUtils';
import { runAutoBackupIfEnabled, scheduleAutoBackup, applyBackupRestore, BackupPayload } from './src/utils/backupUtils';
import auth from '@react-native-firebase/auth';
import {
  listenToSharedEventsWithMe, listenToSharedListsWithMe,
  listenToMySharedEvents, listenToMySharedLists,
  updateSharedEvent, updateSharedList,
  deleteSharedEventDoc, deleteSharedListDoc,
} from './src/utils/firestore';

const NAVBAR_BOTTOM_PADDING = Platform.OS === 'android' ? 48 : 8;

// Contexto para criação de evento (compromisso ou rotina)
interface EventTypeContext {
  date?: string;
  fromPending?: Event | null;
}

function AppContent() {
  const { colors, globalStyles, theme } = useTheme();
  const { t } = useLanguage();
  const { userId, sharingEnabled } = useFirebase();

  // ===========================
  // HELPERS DE SYNC — COMPARTILHAMENTO
  // ===========================
  const syncSharedEvent = async (event: Event) => {
    if (!userId) return;
    try {
      if (event.isSharedWithMe && event.ownerUid) {
        // Receptor editando — propaga para o documento do dono
        await updateSharedEvent(event, event.ownerUid);
      } else if (!event.isSharedWithMe && event.sharedWithUid) {
        // Dono editando — propaga para o próprio documento
        await updateSharedEvent(event, userId);
      }
    } catch (err) {
      // Falha de sync: estado local está correto mas Firestore ficará desatualizado.
      // O listener de sharedEvents preserva o estado local de conclusão até o próximo sync.
      console.warn('[syncSharedEvent] falha ao sincronizar evento compartilhado:', err);
    }
  };
  const syncSharedList = async (list: ShoppingList) => {
    if (!userId) return;
    try {
      if (list.isSharedWithMe && list.ownerUid) {
        // Receptor editando — propaga para o documento do dono
        await updateSharedList(list, list.ownerUid);
      } else if (!list.isSharedWithMe && list.sharedWithUid) {
        // Dono editando — propaga para o próprio documento
        await updateSharedList(list, userId);
      }
    } catch (err) {
      console.warn('[syncSharedList] falha ao sincronizar lista compartilhada:', err);
    }
  };
  const removeSharedEvent = async (event: Event) => {
    if (!userId || event.isSharedWithMe || !event.sharedWithUid) return;
    try { await deleteSharedEventDoc(userId, event.id); } catch {}
  };
  const removeSharedList = async (list: ShoppingList) => {
    if (!userId || list.isSharedWithMe || !list.sharedWithUid) return;
    try { await deleteSharedListDoc(userId, list.id); } catch {}
  };

  const [events, setEvents] = useState<Event[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('eventos');
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);
  const [homeResetKey, setHomeResetKey] = useState(0);
  const [listsResetKey, setListsResetKey] = useState(0);
  const [pendingResetKey, setPendingResetKey] = useState(0);

  // Formulários
  const [showEventForm, setShowEventForm] = useState(false);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);

  // Editando
  const [editingPending, setEditingPending] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingRotina, setEditingRotina] = useState<Rotina | null>(null);

  // Contexto de criação
  const [eventTypeContext, setEventTypeContext] = useState<EventTypeContext | null>(null);
  const [pendingToConvertId, setPendingToConvertId] = useState<number | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [navigateToDate, setNavigateToDate] = useState<string | undefined>(undefined);
  const [navigateToListId, setNavigateToListId] = useState<number | undefined>(undefined);
  const [navigateToEventsDate, setNavigateToEventsDate] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState('');
  const [autoMigrationEnabled, setAutoMigrationEnabled] = useState(true);
  const [deleteCompletedEventsAfter, setDeleteCompletedEventsAfter] = useState<DeleteAfterPolicy>('never');
  const [deleteCompletedPendingsAfter, setDeleteCompletedPendingsAfter] = useState<DeleteAfterPolicy>('never');
  const [deleteCompletedRotinasAfter, setDeleteCompletedRotinasAfter] = useState<DeleteAfterPolicy>('never');
  const [deleteCompletedListsAfter, setDeleteCompletedListsAfter] = useState<DeleteAfterPolicy>('never');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null); // null = ainda carregando
  // Notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMode, setNotificationMode] = useState<'daily' | 'per-event'>('daily');
  const [notificationTime, setNotificationTime] = useState('08:00');
  const [notificationLeadMinutes, setNotificationLeadMinutes] = useState(30);
  // Hidratação
  const [waterTrackerEnabled, setWaterTrackerEnabled] = useState(false);
  const [waterDailyGoalMl, setWaterDailyGoalMl] = useState(2000);
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(false);
  const [waterReminderIntervalMinutes, setWaterReminderIntervalMinutes] = useState(60);
  const [waterStartTime, setWaterStartTime] = useState('08:00');
  const [waterEndTime, setWaterEndTime] = useState('18:00');
  const [waterLog, setWaterLog] = useState<WaterDayLog | null>(null);
  // Notificações por tipo
  const [notificationsListsEnabled, setNotificationsListsEnabled] = useState(false);
  const [notificationsPendingsEnabled, setNotificationsPendingsEnabled] = useState(false);
  // Perfil
  const [birthDate, setBirthDate] = useState('');

  // ===========================
  // INICIALIZAÇÃO
  // ===========================
  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings();
      setUserName(settings.displayName ?? '');
      setAutoMigrationEnabled(settings.autoMigrationEnabled);
      setOnboardingDone(settings.onboardingDone ?? false);
      if (settings.deleteCompletedEventsAfter) setDeleteCompletedEventsAfter(settings.deleteCompletedEventsAfter);
      if (settings.deleteCompletedPendingsAfter) setDeleteCompletedPendingsAfter(settings.deleteCompletedPendingsAfter);
      if (settings.deleteCompletedRotinasAfter) setDeleteCompletedRotinasAfter(settings.deleteCompletedRotinasAfter);
      if (settings.deleteCompletedListsAfter) setDeleteCompletedListsAfter(settings.deleteCompletedListsAfter);
      // Notificações
      if (settings.notificationsEnabled != null) setNotificationsEnabled(settings.notificationsEnabled);
      if (settings.notificationMode) setNotificationMode(settings.notificationMode);
      if (settings.notificationTime) setNotificationTime(settings.notificationTime);
      if (settings.notificationLeadMinutes != null) setNotificationLeadMinutes(settings.notificationLeadMinutes);
      // Hidratação
      if (settings.waterTrackerEnabled != null) setWaterTrackerEnabled(settings.waterTrackerEnabled);
      if (settings.waterDailyGoalMl != null) setWaterDailyGoalMl(settings.waterDailyGoalMl);
      if (settings.waterReminderEnabled != null) setWaterReminderEnabled(settings.waterReminderEnabled);
      if (settings.waterReminderIntervalMinutes != null) setWaterReminderIntervalMinutes(settings.waterReminderIntervalMinutes);
      if (settings.waterStartTime) setWaterStartTime(settings.waterStartTime);
      if (settings.waterEndTime) setWaterEndTime(settings.waterEndTime);
      if (settings.notificationsListsEnabled != null) setNotificationsListsEnabled(settings.notificationsListsEnabled);
      if (settings.notificationsPendingsEnabled != null) setNotificationsPendingsEnabled(settings.notificationsPendingsEnabled);
      if (settings.birthDate) setBirthDate(settings.birthDate);

      // Log de água — carrega somente o dia atual (W6)
      const today = new Date().toISOString().split('T')[0];
      const loadedWaterLog = await loadWaterLog();
      const todayWaterLog = loadedWaterLog && loadedWaterLog.date === today
        ? loadedWaterLog
        : { date: today, entries: [] };
      setWaterLog(todayWaterLog);

      const loadedEvents = await loadEvents();
      let processed = loadedEvents;
      if (settings.autoMigrationEnabled) {
        processed = migrateExpiredEvents(processed);
      }
      processed = cleanupCompletedItems(processed, settings);
      if (JSON.stringify(processed) !== JSON.stringify(loadedEvents)) {
        await saveEvents(processed);
      }
      setEvents(processed);

      const loadedLists = await loadLists();
      const processedLists = cleanupCompletedLists(loadedLists, settings);
      if (JSON.stringify(processedLists) !== JSON.stringify(loadedLists)) {
        await saveLists(processedLists);
      }
      setLists(processedLists);

      const loadedRotinas = await loadRotinas();
      const processedRotinas = cleanupCompletedRotinas(loadedRotinas, settings);
      if (JSON.stringify(processedRotinas) !== JSON.stringify(loadedRotinas)) {
        await saveRotinas(processedRotinas);
      }
      setRotinas(processedRotinas);

      // Agendamento de notificações no início
      await scheduleAllNotifications(processed, settings).catch(() => {});
      // Agendamento de lembretes de água
      const initConsumedMl = todayWaterLog.entries.reduce((s, e) => s + e.amountMl, 0);
      await scheduleWaterReminders(settings, initConsumedMl).catch(() => {});
      // Auto-backup em nuvem (se configurado)
      await runAutoBackupIfEnabled(auth().currentUser?.uid ?? null).catch(() => {});
    };
    init();
  }, []);

  // ─── Recarrega todos os dados após restore de backup ─────────────────────
  const reloadAllData = async () => {
    const settings = await loadSettings();
    setUserName(settings.displayName ?? '');
    setAutoMigrationEnabled(settings.autoMigrationEnabled);
    if (settings.deleteCompletedEventsAfter) setDeleteCompletedEventsAfter(settings.deleteCompletedEventsAfter);
    if (settings.deleteCompletedPendingsAfter) setDeleteCompletedPendingsAfter(settings.deleteCompletedPendingsAfter);
    if (settings.deleteCompletedRotinasAfter) setDeleteCompletedRotinasAfter(settings.deleteCompletedRotinasAfter);
    if (settings.deleteCompletedListsAfter) setDeleteCompletedListsAfter(settings.deleteCompletedListsAfter);
    if (settings.notificationsEnabled != null) setNotificationsEnabled(settings.notificationsEnabled);
    if (settings.notificationMode) setNotificationMode(settings.notificationMode);
    if (settings.notificationTime) setNotificationTime(settings.notificationTime);
    if (settings.notificationLeadMinutes != null) setNotificationLeadMinutes(settings.notificationLeadMinutes);
    if (settings.waterTrackerEnabled != null) setWaterTrackerEnabled(settings.waterTrackerEnabled);
    if (settings.waterDailyGoalMl != null) setWaterDailyGoalMl(settings.waterDailyGoalMl);
    if (settings.waterReminderEnabled != null) setWaterReminderEnabled(settings.waterReminderEnabled);
    if (settings.waterReminderIntervalMinutes != null) setWaterReminderIntervalMinutes(settings.waterReminderIntervalMinutes);
    if (settings.waterStartTime) setWaterStartTime(settings.waterStartTime);
    if (settings.waterEndTime) setWaterEndTime(settings.waterEndTime);
    if (settings.birthDate) setBirthDate(settings.birthDate);
    setEvents(await loadEvents());
    setLists(await loadLists());
    setRotinas(await loadRotinas());
    const today = new Date().toISOString().split('T')[0];
    const wl = await loadWaterLog();
    setWaterLog(wl?.date === today ? wl : { date: today, entries: [] });
  };

  // ─── Auto backup debounced: dispara após mutações em eventos/listas/rotinas ─
  const autoBackupInitRef = useRef(false);
  useEffect(() => {
    if (!autoBackupInitRef.current) {
      if (events.length > 0 || lists.length > 0 || onboardingDone === true) {
        autoBackupInitRef.current = true;
      }
      return;
    }
    scheduleAutoBackup(auth().currentUser?.uid ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, lists, rotinas]);

  // ===========================
  // LISTENERS: ITENS COMPARTILHADOS COMIGO
  // ===========================
  useEffect(() => {
    if (!userId || !sharingEnabled) return;

    // Itens que outros compartilharam comigo
    const unsubEvents = listenToSharedEventsWithMe(userId, (sharedEvents) => {
      setEvents(current => {
        const mine = current.filter(e => !e.isSharedWithMe);
        const merged = sharedEvents.map(incoming => {
          // Preserva estado local de conclusão que ainda não sincronizou com o Firestore.
          // Sem isso, se syncSharedEvent falhar silenciosamente, o listener reverteria
          // o item concluído localmente para ativo na próxima entrega do Firestore.
          const local = current.find(
            e => e.isSharedWithMe && e.id === incoming.id && e.ownerUid === incoming.ownerUid,
          );
          if (local?.is_completed && !incoming.is_completed) {
            return {
              ...incoming,
              isSharedWithMe: true as const,
              is_completed: true,
              completedAt: local.completedAt ?? null,
            };
          }
          return { ...incoming, isSharedWithMe: true as const };
        });
        return [...mine, ...merged];
      });
    });
    const unsubLists = listenToSharedListsWithMe(userId, (sharedLists) => {
      setLists(current => {
        const mine = current.filter(l => !l.isSharedWithMe);
        const merged = sharedLists.map(incoming => {
          // Mesma proteção para listas: preserva isCompleted local se Firestore ainda
          // não recebeu a atualização (evita reaparecer como ativa após conclusão)
          const local = current.find(
            l => l.isSharedWithMe && l.id === incoming.id && l.ownerUid === incoming.ownerUid,
          );
          if (local?.isCompleted && !incoming.isCompleted) {
            return { ...incoming, isSharedWithMe: true as const, isCompleted: true };
          }
          return { ...incoming, isSharedWithMe: true as const };
        });
        return [...mine, ...merged];
      });
    });

    // Meus itens que compartilhei — mantém sharedWithUid sincronizado no estado local
    const unsubMyEvents = listenToMySharedEvents(userId, (updates) => {
      setEvents(current => current.map(e => {
        const u = updates.find(x => x.id === e.id);
        return u ? { ...e, sharedWithUid: u.sharedWithUid } : e;
      }));
    });
    const unsubMyLists = listenToMySharedLists(userId, (updates) => {
      setLists(current => current.map(l => {
        const u = updates.find(x => x.id === l.id);
        return u ? { ...l, sharedWithUid: u.sharedWithUid } : l;
      }));
    });

    return () => { unsubEvents(); unsubLists(); unsubMyEvents(); unsubMyLists(); };
  }, [userId, sharingEnabled]);

  // BackHandler global — pilha de navegação: sub-telas das screens → screens → sai só de 'eventos'
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 1. Modais/formulários têm prioridade máxima
      if (showEventTypeModal) { setShowEventTypeModal(false); return true; }
      if (showRoutineForm) { setShowRoutineForm(false); setEditingRotina(null); setPendingToConvertId(null); return true; }
      if (showEventForm) { setShowEventForm(false); setEditingEvent(null); return true; }
      if (showPendingForm) { setShowPendingForm(false); setEditingPending(null); return true; }
      if (showSearch) { setShowSearch(false); return true; }
      // 2. Desempilha a pilha de telas (sub-telas de EventsScreen e ListsScreen
      //    registram seus próprios handlers de maior prioridade via LIFO — chegam aqui
      //    apenas quando não há mais sub-tela aberta)
      if (screenHistory.length > 0) {
        const prev = screenHistory[screenHistory.length - 1];
        setScreenHistory(h => h.slice(0, -1));
        setActiveScreen(prev);
        return true;
      }
      // 3. Fallback: se por algum motivo não há histórico mas não estamos em 'eventos'
      if (activeScreen !== 'eventos') {
        setActiveScreen('eventos');
        return true;
      }
      // 4. Em 'eventos' sem histórico → sai do app
      return false;
    });
    return () => backHandler.remove();
  }, [showEventForm, showPendingForm, showRoutineForm, showEventTypeModal, showSearch, screenHistory, activeScreen]);

  // ===========================
  // NAVEGAÇÃO
  // ===========================
  const handleNavPress = (screen: ScreenName) => {
    if (screen === activeScreen) {
      // Botão da tela atual: reseta sub-views (volta à raiz da tela)
      if (screen === 'eventos') setHomeResetKey(k => k + 1);
      else if (screen === 'listas') setListsResetKey(k => k + 1);
      else if (screen === 'pendencias') setPendingResetKey(k => k + 1);
      return;
    }
    setScreenHistory(prev => [...prev, activeScreen]);
    setActiveScreen(screen);
    if (screen !== 'listas') setNavigateToListId(undefined);
    if (screen === 'calendario') setNavigateToDate(undefined); // nav direta → abre em hoje
  };

  // Navega para a tela de Listas abrindo uma lista específica, registrando o histórico
  const navigateToListScreen = (listId: number) => {
    setNavigateToListId(listId);
    setScreenHistory(prev => [...prev, activeScreen]);
    setActiveScreen('listas');
  };

  // ===========================
  // MODAL TIPO DE EVENTO
  // ===========================
  const openEventTypeModal = (ctx: EventTypeContext) => {
    setEventTypeContext(ctx);
    setShowEventTypeModal(true);
  };

  const handleEventTypeSelect = (type: 'compromisso' | 'rotina') => {
    setShowEventTypeModal(false);
    const ctx = eventTypeContext;

    if (type === 'compromisso') {
      if (ctx?.fromPending) {
        setEditingEvent({
          ...ctx.fromPending,
          is_pending: false,
          isScheduledFromPending: true,
          isPreFilled: true,
          start_time: null,
        });
      } else if (ctx?.date) {
        setEditingEvent({
          id: 0, title: '', tag_name: '',
          start_time: `${ctx.date}T00:00:00`,
          is_completed: false, is_pending: false, steps: [], notes: [], isPreFilled: true,
        });
      } else {
        setEditingEvent(null);
      }
      setShowEventForm(true);
    } else {
      // Rotina
      if (ctx?.fromPending) {
        setPendingToConvertId(ctx.fromPending.id);
        setEditingRotina({
          id: 0,
          title: ctx.fromPending.title,
          tag_name: ctx.fromPending.tag_name,
          start_date: '',
          end_date: '',
          time: null,
          recurrence_type: 'daily',
          weekdays: [],
          month_day: null,
          custom_interval: null,
          custom_unit: null,
          custom_reps: null,
          notes: ctx.fromPending.notes || [],
          is_suspended: false,
          suspended_from_date: null,
          completed_instances: [],
          linked_lists: {},
        });
      } else {
        setEditingRotina(null);
      }
      setShowRoutineForm(true);
    }
  };

  // ===========================
  // EVENTOS (COMPROMISSOS) — CRUD
  // ===========================
  const handleSaveEvent = async (eventData: Event) => {
    let updated: Event[];
    const exists = events.find(e => e.id === eventData.id);
    if (exists) {
      updated = events.map(e => e.id === eventData.id ? eventData : e);
    } else {
      updated = [eventData, ...events];
    }
    setEvents(updated);
    await saveEvents(updated);
    await syncSharedEvent(eventData);
    await scheduleAllNotifications(updated, currentNotifSettings()).catch(() => {});

    if (eventData.isScheduledFromPending && eventData.linkedListId) {
      const updatedLists = lists.map(l =>
        l.id === eventData.linkedListId
          ? { ...l, linkedEventId: eventData.id, linkedPendingId: null }
          : l
      );
      setLists(updatedLists);
      await saveLists(updatedLists);
    }
  };

  const handleSaveNotes = async (id: number, notes: string[]) => {
    const updated = events.map(e => e.id === id ? { ...e, notes } : e);
    setEvents(updated);
    await saveEvents(updated);
    const event = updated.find(e => e.id === id);
    if (event) await syncSharedEvent(event);
  };

  const handleDeleteEvent = async (id: number) => {
    const event = events.find(e => e.id === id);
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    await saveEvents(updated);
    if (event) await removeSharedEvent(event);
    await scheduleAllNotifications(updated, currentNotifSettings()).catch(() => {});
  };

  const handleCompleteEvent = async (id: number) => {
    const now = new Date().toISOString();
    const updated = events.map(e => e.id === id ? { ...e, is_completed: true, completedAt: now } : e);
    setEvents(updated);
    await saveEvents(updated);
    const event = updated.find(e => e.id === id);
    if (event) await syncSharedEvent(event);
    await scheduleAllNotifications(updated, currentNotifSettings()).catch(() => {});
  };

  const handleEditEvent = (event: Event) => {
    if (event.is_pending) {
      setEditingPending(event);
      setShowPendingForm(true);
    } else {
      setEditingEvent(event);
      setShowEventForm(true);
    }
  };

  const handleNewEvent = () => openEventTypeModal({});
  const handleNewEventOnDate = (date: string) => openEventTypeModal({ date });
  const handleNewEventToday = () => openEventTypeModal({ date: formatDate(new Date()) });

  const handleReopenEvent = async (id: number) => {
    const updated = events.map(e => e.id === id ? { ...e, is_completed: false, completedAt: null } : e);
    setEvents(updated);
    await saveEvents(updated);
    const event = updated.find(e => e.id === id);
    if (event) await syncSharedEvent(event);
    await scheduleAllNotifications(updated, currentNotifSettings()).catch(() => {});
  };

  const handleReopenAsPending = async (event: Event) => {
    const updated = events.map(e =>
      e.id === event.id
        ? { ...e, is_pending: true, start_time: null, is_completed: false, completedAt: null }
        : e
    );
    setEvents(updated);
    await saveEvents(updated);
    const updatedEvent = updated.find(e => e.id === event.id);
    if (updatedEvent) await syncSharedEvent(updatedEvent);
  };

  const handleReopenAndReschedule = (event: Event) => {
    const updated = events.map(e =>
      e.id === event.id ? { ...e, is_completed: false, completedAt: null } : e
    );
    setEvents(updated);
    saveEvents(updated);
    const updatedEvent = updated.find(e => e.id === event.id);
    if (updatedEvent) syncSharedEvent(updatedEvent); // fire-and-forget
    setEditingEvent({ ...event, is_completed: false, completedAt: null });
    setShowEventForm(true);
  };

  const handleEventShareUpdate = async (eventId: number, sharedWithUid: string | null) => {
    const updated = events.map(e => e.id === eventId ? { ...e, sharedWithUid } : e);
    setEvents(updated);
    await saveEvents(updated);
  };

  const handleExitSharedEvent = async (eventId: number) => {
    const updated = events.filter(e => !(e.id === eventId && e.isSharedWithMe));
    setEvents(updated);
    await saveEvents(updated);
  };

  const handleArchivePending = async (pendingId: number) => {
    const pending = events.find(e => e.id === pendingId);
    if (!pending) return;

    const today = formatDate(new Date());
    const historical: Event = {
      id: Date.now(),
      title: pending.title,
      tag_name: pending.tag_name,
      start_time: `${today}T00:00:00`,
      is_completed: true,
      is_pending: false,
      steps: [],
      notes: pending.notes || [],
    };

    const updatedEvents = events.filter(e => e.id !== pendingId).concat(historical);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);

    if (pending.linkedListId) {
      const updatedLists = lists.map(l =>
        l.id === pending.linkedListId ? { ...l, linkedPendingId: null } : l
      );
      setLists(updatedLists);
      await saveLists(updatedLists);
    }
  };

  const handleToggleAutoMigration = async (value: boolean) => {
    setAutoMigrationEnabled(value);
    await saveSettings({ autoMigrationEnabled: value });
    if (value) {
      const migrated = migrateExpiredEvents(events);
      if (JSON.stringify(migrated) !== JSON.stringify(events)) {
        setEvents(migrated);
        await saveEvents(migrated);
      }
    }
  };

  const handleSetDeleteCompletedEventsAfter = async (policy: DeleteAfterPolicy) => {
    setDeleteCompletedEventsAfter(policy);
    await saveSettings({ deleteCompletedEventsAfter: policy });
  };

  const handleSetDeleteCompletedPendingsAfter = async (policy: DeleteAfterPolicy) => {
    setDeleteCompletedPendingsAfter(policy);
    await saveSettings({ deleteCompletedPendingsAfter: policy });
  };

  const handleSetDeleteCompletedRotinasAfter = async (policy: DeleteAfterPolicy) => {
    setDeleteCompletedRotinasAfter(policy);
    await saveSettings({ deleteCompletedRotinasAfter: policy });
  };

  const handleSetDeleteCompletedListsAfter = async (policy: DeleteAfterPolicy) => {
    setDeleteCompletedListsAfter(policy);
    await saveSettings({ deleteCompletedListsAfter: policy });
  };

  // ===========================
  // NOTIFICAÇÕES — HANDLERS
  // ===========================
  const currentNotifSettings = () => ({
    autoMigrationEnabled,
    notificationsEnabled,
    notificationMode,
    notificationTime,
    notificationLeadMinutes,
  });

  const handleToggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    const newSettings = { ...currentNotifSettings(), notificationsEnabled: enabled };
    await saveSettings({ notificationsEnabled: enabled });
    await scheduleAllNotifications(events, newSettings).catch(() => {});
  };

  const handleSetNotificationMode = async (mode: 'daily' | 'per-event') => {
    setNotificationMode(mode);
    const newSettings = { ...currentNotifSettings(), notificationMode: mode };
    await saveSettings({ notificationMode: mode });
    await scheduleAllNotifications(events, newSettings).catch(() => {});
  };

  const handleSetNotificationTime = async (time: string) => {
    setNotificationTime(time);
    const newSettings = { ...currentNotifSettings(), notificationTime: time };
    await saveSettings({ notificationTime: time });
    await scheduleAllNotifications(events, newSettings).catch(() => {});
  };

  const handleSetNotificationLead = async (minutes: number) => {
    setNotificationLeadMinutes(minutes);
    const newSettings = { ...currentNotifSettings(), notificationLeadMinutes: minutes };
    await saveSettings({ notificationLeadMinutes: minutes });
    await scheduleAllNotifications(events, newSettings).catch(() => {});
  };

  // ===========================
  // HIDRATAÇÃO — HANDLERS
  // ===========================
  const currentWaterSettings = () => ({
    waterTrackerEnabled,
    waterDailyGoalMl,
    waterReminderEnabled,
    waterReminderIntervalMinutes,
    waterStartTime,
    waterEndTime,
  });

  const handleSetWaterTrackerEnabled = async (v: boolean) => {
    setWaterTrackerEnabled(v);
    await saveSettings({ waterTrackerEnabled: v });
    const consumed = (waterLog?.entries ?? []).reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders({ ...currentWaterSettings(), waterTrackerEnabled: v }, consumed).catch(() => {});
  };

  const handleSetWaterDailyGoalMl = async (ml: number) => {
    setWaterDailyGoalMl(ml);
    await saveSettings({ waterDailyGoalMl: ml });
    const consumed = (waterLog?.entries ?? []).reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders({ ...currentWaterSettings(), waterDailyGoalMl: ml }, consumed).catch(() => {});
  };

  const handleSetWaterReminderInterval = async (minutes: number) => {
    setWaterReminderIntervalMinutes(minutes);
    await saveSettings({ waterReminderIntervalMinutes: minutes });
    const consumed = (waterLog?.entries ?? []).reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders({ ...currentWaterSettings(), waterReminderIntervalMinutes: minutes }, consumed).catch(() => {});
  };

  const handleToggleWaterReminder = async (v: boolean) => {
    setWaterReminderEnabled(v);
    await saveSettings({ waterReminderEnabled: v });
    const consumed = (waterLog?.entries ?? []).reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders({ ...currentWaterSettings(), waterReminderEnabled: v }, consumed).catch(() => {});
  };

  const handleToggleNotificationsLists = async (v: boolean) => {
    setNotificationsListsEnabled(v);
    await saveSettings({ notificationsListsEnabled: v });
  };

  const handleToggleNotificationsPendings = async (v: boolean) => {
    setNotificationsPendingsEnabled(v);
    await saveSettings({ notificationsPendingsEnabled: v });
  };

  const handleSetBirthDate = async (date: string) => {
    setBirthDate(date);
    await saveSettings({ birthDate: date });
  };

  const handleSetWaterStartTime = async (time: string) => {
    setWaterStartTime(time);
    await saveSettings({ waterStartTime: time });
    const consumed = (waterLog?.entries ?? []).reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders({ ...currentWaterSettings(), waterStartTime: time }, consumed).catch(() => {});
  };

  const handleSetWaterEndTime = async (time: string) => {
    setWaterEndTime(time);
    await saveSettings({ waterEndTime: time });
    const consumed = (waterLog?.entries ?? []).reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders({ ...currentWaterSettings(), waterEndTime: time }, consumed).catch(() => {});
  };

  const handleAddWaterEntry = async (amountMl: number) => {
    const today = new Date().toISOString().split('T')[0];
    const base = waterLog && waterLog.date === today ? waterLog : { date: today, entries: [] };
    const entry = { id: Date.now(), timestamp: new Date().toISOString(), amountMl };
    const updated: WaterDayLog = { ...base, entries: [...base.entries, entry] };
    setWaterLog(updated);
    await saveWaterLog(updated);

    const newConsumedMl = updated.entries.reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders(currentWaterSettings(), newConsumedMl).catch(() => {});
  };

  const handleDeleteWaterEntry = async (entryId: number) => {
    if (!waterLog) return;
    const updated: WaterDayLog = { ...waterLog, entries: waterLog.entries.filter(e => e.id !== entryId) };
    setWaterLog(updated);
    await saveWaterLog(updated);
    const newConsumedMl = updated.entries.reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders(currentWaterSettings(), newConsumedMl).catch(() => {});
  };

  const handleUpdateWaterEntry = async (entryId: number, newAmountMl: number) => {
    if (!waterLog) return;
    const updated: WaterDayLog = {
      ...waterLog,
      entries: waterLog.entries.map(e => e.id === entryId ? { ...e, amountMl: newAmountMl } : e),
    };
    setWaterLog(updated);
    await saveWaterLog(updated);
    const newConsumedMl = updated.entries.reduce((s, e) => s + e.amountMl, 0);
    await scheduleWaterReminders(currentWaterSettings(), newConsumedMl).catch(() => {});
  };

  const handleNewPending = () => {
    setEditingPending(null);
    setShowPendingForm(true);
  };

  const handlePostponeEvent = async (event: Event) => {
    Alert.alert(
      t.alerts.postponeEvent,
      t.alerts.postponeEventMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.alerts.postponeEventBtn,
          onPress: async () => {
            const updated = events.map(e =>
              e.id === event.id ? { ...e, start_time: null, is_pending: true } : e
            );
            setEvents(updated);
            await saveEvents(updated);
            const updatedEvent = updated.find(e => e.id === event.id);
            if (updatedEvent) await syncSharedEvent(updatedEvent);
          },
        },
      ]
    );
  };

  const handleScheduleEvent = (event: Event) => {
    openEventTypeModal({ fromPending: event });
  };

  // ===========================
  // ROTINAS — CRUD
  // ===========================
  const handleSaveRotina = async (rotina: Rotina) => {
    let updatedRotinas: Rotina[];
    const exists = rotinas.find(r => r.id === rotina.id);
    if (exists) {
      updatedRotinas = rotinas.map(r => r.id === rotina.id ? rotina : r);
    } else {
      updatedRotinas = [rotina, ...rotinas];
    }
    setRotinas(updatedRotinas);
    await saveRotinas(updatedRotinas);

    // Conversão de pendência → rotina
    if (pendingToConvertId) {
      const pending = events.find(e => e.id === pendingToConvertId);
      if (pending) {
        const updatedEvents = events.filter(e => e.id !== pendingToConvertId);
        setEvents(updatedEvents);
        await saveEvents(updatedEvents);

        // Migrar lista vinculada para a primeira instância da rotina
        if (pending.linkedListId) {
          const firstInstances = getOccurrencesForDate(rotina, rotina.start_date);
          const firstKey = firstInstances.length > 0 ? firstInstances[0].instanceKey : rotina.start_date;

          const rotinaWithList: Rotina = {
            ...rotina,
            linked_lists: { ...rotina.linked_lists, [firstKey]: pending.linkedListId },
          };
          const finalRotinas = updatedRotinas.map(r => r.id === rotina.id ? rotinaWithList : r);
          setRotinas(finalRotinas);
          await saveRotinas(finalRotinas);

          const updatedLists = lists.map(l =>
            l.id === pending.linkedListId
              ? { ...l, linkedPendingId: null, linkedRotinaId: rotina.id, linkedRotinaInstance: firstKey }
              : l
          );
          setLists(updatedLists);
          await saveLists(updatedLists);
        }
      }
      setPendingToConvertId(null);
    }
  };

  const handleSaveRotinaNotesHot = async (rotinaId: number, notes: string[]) => {
    const updated = rotinas.map(r => r.id === rotinaId ? { ...r, notes } : r);
    setRotinas(updated);
    await saveRotinas(updated);
  };

  const handleDeleteRotina = async (rotinaId: number) => {
    const updatedRotinas = rotinas.filter(r => r.id !== rotinaId);
    setRotinas(updatedRotinas);
    await saveRotinas(updatedRotinas);

    // Limpar listas vinculadas
    const updatedLists = lists.map(l =>
      l.linkedRotinaId === rotinaId
        ? { ...l, linkedRotinaId: null, linkedRotinaInstance: null }
        : l
    );
    if (JSON.stringify(updatedLists) !== JSON.stringify(lists)) {
      setLists(updatedLists);
      await saveLists(updatedLists);
    }
  };

  const handleCompleteRotinaInstance = async (rotinaId: number, instanceKey: string) => {
    const updated = rotinas.map(r => {
      if (r.id !== rotinaId) return r;
      const already = r.completed_instances.includes(instanceKey);
      if (already) return r;
      return { ...r, completed_instances: [...r.completed_instances, instanceKey] };
    });
    setRotinas(updated);
    await saveRotinas(updated);
  };

  const handleUncompleteRotinaInstance = async (rotinaId: number, instanceKey: string) => {
    const updated = rotinas.map(r => {
      if (r.id !== rotinaId) return r;
      return { ...r, completed_instances: r.completed_instances.filter(k => k !== instanceKey) };
    });
    setRotinas(updated);
    await saveRotinas(updated);
  };

  const handleSuspendRotina = async (rotinaId: number) => {
    const today = formatDate(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow);

    const updated = rotinas.map(r => {
      if (r.id !== rotinaId) return r;
      // Auto-completar instâncias de hoje
      const todayInstances = getOccurrencesForDate(r, today);
      const newCompleted = [...r.completed_instances];
      todayInstances.forEach(inst => {
        if (!newCompleted.includes(inst.instanceKey)) newCompleted.push(inst.instanceKey);
      });
      return {
        ...r,
        is_suspended: true,
        suspended_from_date: tomorrowStr,
        completed_instances: newCompleted,
      };
    });
    setRotinas(updated);
    await saveRotinas(updated);
  };

  const handleResumeRotina = async (rotinaId: number) => {
    const updated = rotinas.map(r =>
      r.id === rotinaId ? { ...r, is_suspended: false, suspended_from_date: null } : r
    );
    setRotinas(updated);
    await saveRotinas(updated);
  };

  const handleEditRotina = (rotina: Rotina) => {
    setEditingRotina(rotina);
    setShowRoutineForm(true);
  };

  // ===========================
  // LISTAS — CRUD
  // ===========================
  const handleSaveList = async (list: ShoppingList) => {
    const updated = [list, ...lists];
    setLists(updated);
    await saveLists(updated);
  };

  const handleSaveAndLinkList = async (newList: ShoppingList, itemId: number) => {
    const item = events.find(e => e.id === itemId);
    const listWithLink: ShoppingList = {
      ...newList,
      linkedEventId: item && !item.is_pending ? itemId : null,
      linkedPendingId: item && item.is_pending ? itemId : null,
    };
    const updatedLists = [listWithLink, ...lists];
    setLists(updatedLists);
    await saveLists(updatedLists);

    const updatedEvents = events.map(e => e.id === itemId ? { ...e, linkedListId: newList.id } : e);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);
  };

  const handleSaveAndLinkListToRotina = async (
    newList: ShoppingList,
    rotinaId: number,
    instanceKey: string
  ) => {
    const listWithLink: ShoppingList = {
      ...newList,
      linkedRotinaId: rotinaId,
      linkedRotinaInstance: instanceKey,
    };
    const updatedLists = [listWithLink, ...lists];
    setLists(updatedLists);
    await saveLists(updatedLists);

    const updatedRotinas = rotinas.map(r => {
      if (r.id !== rotinaId) return r;
      return { ...r, linked_lists: { ...r.linked_lists, [instanceKey]: newList.id } };
    });
    setRotinas(updatedRotinas);
    await saveRotinas(updatedRotinas);
  };

  const handleUpdateList = async (list: ShoppingList) => {
    const prev = lists.find(l => l.id === list.id);
    let stamped = list;
    if (list.isCompleted && !prev?.isCompleted) {
      stamped = { ...list, completedAt: new Date().toISOString() };
    } else if (!list.isCompleted && prev?.isCompleted) {
      stamped = { ...list, completedAt: null };
    }
    const updated = lists.map(l => l.id === list.id ? stamped : l);
    setLists(updated);
    await saveLists(updated);
    await syncSharedList(stamped);
  };

  const handleDeleteList = async (id: number) => {
    const list = lists.find(l => l.id === id);
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    await saveLists(updated);
    if (list) await removeSharedList(list);
  };

  // ===========================
  // VÍNCULOS — EVENTO/PENDÊNCIA
  // ===========================
  const handleLinkListToEvent = async (eventId: number, listId: number) => {
    const updatedEvents = events.map(e => e.id === eventId ? { ...e, linkedListId: listId } : e);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);

    const updatedLists = lists.map(l =>
      l.id === listId ? { ...l, linkedEventId: eventId, linkedPendingId: null } : l
    );
    setLists(updatedLists);
    await saveLists(updatedLists);
    const linkedList = updatedLists.find(l => l.id === listId);
    if (linkedList) await syncSharedList(linkedList);
    const linkedEvent = updatedEvents.find(e => e.id === eventId);
    if (linkedEvent) await syncSharedEvent(linkedEvent);
  };

  const handleLinkListToPending = async (pendingId: number, listId: number) => {
    const updatedEvents = events.map(e => e.id === pendingId ? { ...e, linkedListId: listId } : e);
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);

    const updatedLists = lists.map(l =>
      l.id === listId ? { ...l, linkedPendingId: pendingId, linkedEventId: null } : l
    );
    setLists(updatedLists);
    await saveLists(updatedLists);
    const linkedList = updatedLists.find(l => l.id === listId);
    if (linkedList) await syncSharedList(linkedList);
  };

  const handleUnlinkList = async (eventOrPendingId: number) => {
    const event = events.find(e => e.id === eventOrPendingId);
    const listId = event?.linkedListId;
    const updatedEvents = events.map(e =>
      e.id === eventOrPendingId ? { ...e, linkedListId: null } : e
    );
    setEvents(updatedEvents);
    await saveEvents(updatedEvents);

    if (listId) {
      const updatedLists = lists.map(l =>
        l.id === listId ? { ...l, linkedEventId: null, linkedPendingId: null } : l
      );
      setLists(updatedLists);
      await saveLists(updatedLists);
      const unlinkedList = updatedLists.find(l => l.id === listId);
      if (unlinkedList) await syncSharedList(unlinkedList);
    }
  };

  // ===========================
  // VÍNCULOS — ROTINA
  // ===========================
  const handleLinkListToRotinaInstance = async (
    rotinaId: number,
    instanceKey: string,
    listId: number
  ) => {
    const updatedRotinas = rotinas.map(r => {
      if (r.id !== rotinaId) return r;
      return { ...r, linked_lists: { ...r.linked_lists, [instanceKey]: listId } };
    });
    setRotinas(updatedRotinas);
    await saveRotinas(updatedRotinas);

    const updatedLists = lists.map(l =>
      l.id === listId
        ? { ...l, linkedRotinaId: rotinaId, linkedRotinaInstance: instanceKey, linkedEventId: null, linkedPendingId: null }
        : l
    );
    setLists(updatedLists);
    await saveLists(updatedLists);
  };

  const handleUnlinkListFromRotinaInstance = async (rotinaId: number, instanceKey: string) => {
    const rotina = rotinas.find(r => r.id === rotinaId);
    const listId = rotina?.linked_lists[instanceKey];

    const updatedRotinas = rotinas.map(r => {
      if (r.id !== rotinaId) return r;
      const newLinked = { ...r.linked_lists };
      delete newLinked[instanceKey];
      return { ...r, linked_lists: newLinked };
    });
    setRotinas(updatedRotinas);
    await saveRotinas(updatedRotinas);

    if (listId) {
      const updatedLists = lists.map(l =>
        l.id === listId ? { ...l, linkedRotinaId: null, linkedRotinaInstance: null } : l
      );
      setLists(updatedLists);
      await saveLists(updatedLists);
    }
  };

  // ===========================
  // VÍNCULOS — LISTA → EVENTO/PENDÊNCIA (from ListsScreen)
  // ===========================
  const handleLinkFromList = async (listId: number, targetId: number, targetType: 'event' | 'pending') => {
    if (targetType === 'event') {
      await handleLinkListToEvent(targetId, listId);
    } else {
      await handleLinkListToPending(targetId, listId);
    }
  };

  const handleUnlinkFromList = async (listId: number) => {
    const list = lists.find(l => l.id === listId);
    const eventId = list?.linkedEventId;
    const pendingId = list?.linkedPendingId;
    const rotinaId = list?.linkedRotinaId;
    const rotinaInstance = list?.linkedRotinaInstance;

    const updatedLists = lists.map(l =>
      l.id === listId
        ? { ...l, linkedEventId: null, linkedPendingId: null, linkedRotinaId: null, linkedRotinaInstance: null }
        : l
    );
    setLists(updatedLists);
    await saveLists(updatedLists);
    const unlinkedList = updatedLists.find(l => l.id === listId);
    if (unlinkedList) await syncSharedList(unlinkedList);

    const targetId = eventId || pendingId;
    if (targetId) {
      const updatedEvents = events.map(e =>
        e.id === targetId ? { ...e, linkedListId: null } : e
      );
      setEvents(updatedEvents);
      await saveEvents(updatedEvents);
    }

    if (rotinaId && rotinaInstance) {
      const updatedRotinas = rotinas.map(r => {
        if (r.id !== rotinaId) return r;
        const newLinked = { ...r.linked_lists };
        delete newLinked[rotinaInstance];
        return { ...r, linked_lists: newLinked };
      });
      setRotinas(updatedRotinas);
      await saveRotinas(updatedRotinas);
    }
  };

  // ===========================
  // BUSCA
  // ===========================
  const handleGoToEventsDate = (dateStr: string) => {
    setNavigateToEventsDate(dateStr);
    setNavigateToDate(dateStr); // ao voltar para o calendário, mostra o dia selecionado
    setScreenHistory(prev => [...prev, activeScreen]);
    setActiveScreen('eventos');
  };

  const handleGoToDate = (date: Date) => {
    const dateStr = formatDate(date);
    setNavigateToDate(dateStr);
    setActiveScreen('calendario');
  };

  // ===========================
  // CONFIGURAÇÕES
  // ===========================
  const handleClearData = async (opts: { lists: boolean; pendencias: boolean; compromissos: boolean; rotinas: boolean; archivedLists: boolean }) => {
    let newEvents = events;
    let newLists = lists;
    let newRotinas = rotinas;

    if (opts.compromissos && opts.pendencias) {
      newEvents = [];
    } else if (opts.compromissos) {
      newEvents = newEvents.filter(e => e.is_pending);
    } else if (opts.pendencias) {
      newEvents = newEvents.filter(e => !e.is_pending);
    }

    if (opts.lists && opts.archivedLists) {
      newLists = [];
    } else if (opts.lists) {
      newLists = newLists.filter(l => l.isArchived);
    } else if (opts.archivedLists) {
      newLists = newLists.filter(l => !l.isArchived);
    }

    if (opts.rotinas) newRotinas = [];

    setEvents(newEvents);
    setLists(newLists);
    setRotinas(newRotinas);
    await saveEvents(newEvents);
    await saveLists(newLists);
    await saveRotinas(newRotinas);
  };

  // ===========================
  // CONTADORES NAVBAR
  // ===========================
  const todayStr = formatDate(new Date());
  const todayCount = events.filter(e =>
    e.start_time && e.start_time.startsWith(todayStr) && !e.is_pending && !e.is_completed
  ).length;

  const pendingCount = events.filter(e => e.is_pending && !e.is_completed).length;

  // ===========================
  // RENDER TELA ATIVA
  // ===========================
  const renderScreen = () => {
    switch (activeScreen) {
      case 'eventos':
        return (
          <HomeScreen
            userName={userName}
            events={events}
            rotinas={rotinas}
            lists={lists}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onCompleteEvent={handleCompleteEvent}
            onReopenEvent={handleReopenEvent}
            onPostponeEvent={handlePostponeEvent}
            onNewEvent={handleNewEvent}
            onNewEventOnDate={handleNewEventOnDate}
            onLinkList={handleLinkListToEvent}
            onUnlinkList={handleUnlinkList}
            onNavigateToList={navigateToListScreen}
            onSaveNewList={handleSaveList}
            onSaveAndLinkList={handleSaveAndLinkList}
            onEditRotina={handleEditRotina}
            onDeleteRotina={handleDeleteRotina}
            onCompleteRotinaInstance={handleCompleteRotinaInstance}
            onUncompleteRotinaInstance={handleUncompleteRotinaInstance}
            onSuspendRotina={handleSuspendRotina}
            onResumeRotina={handleResumeRotina}
            onLinkListToRotina={handleLinkListToRotinaInstance}
            onUnlinkListFromRotina={handleUnlinkListFromRotinaInstance}
            onSaveAndLinkListToRotina={handleSaveAndLinkListToRotina}
            autoMigrationEnabled={autoMigrationEnabled}
            onReopenAsPending={handleReopenAsPending}
            onReopenAndReschedule={handleReopenAndReschedule}
            onSaveEventNotes={handleSaveNotes}
            onSaveRotinaInstanceNotes={handleSaveRotinaNotesHot}
            onShareEventUpdate={handleEventShareUpdate}
            onExitSharedEvent={handleExitSharedEvent}
            waterTrackerEnabled={waterTrackerEnabled}
            waterDailyGoalMl={waterDailyGoalMl}
            waterLog={waterLog}
            onAddWaterEntry={handleAddWaterEntry}
            onDeleteWaterEntry={handleDeleteWaterEntry}
            onUpdateWaterEntry={handleUpdateWaterEntry}
            targetDate={navigateToEventsDate}
            onTargetDateConsumed={() => setNavigateToEventsDate(undefined)}
            resetKey={homeResetKey}
          />
        );
      case 'calendario':
        return (
          <EventsScreen
            events={events}
            rotinas={rotinas}
            lists={lists}
            initialDate={navigateToDate}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onCompleteEvent={handleCompleteEvent}
            onReopenEvent={handleReopenEvent}
            onPostponeEvent={handlePostponeEvent}
            onNewEvent={handleNewEvent}
            onNewEventOnDate={handleNewEventOnDate}
            onSearch={() => setShowSearch(true)}
            onLinkList={handleLinkListToEvent}
            onUnlinkList={handleUnlinkList}
            onNavigateToList={navigateToListScreen}
            onSaveNewList={handleSaveList}
            onSaveAndLinkList={handleSaveAndLinkList}
            onEditRotina={handleEditRotina}
            onDeleteRotina={handleDeleteRotina}
            onCompleteRotinaInstance={handleCompleteRotinaInstance}
            onUncompleteRotinaInstance={handleUncompleteRotinaInstance}
            onSuspendRotina={handleSuspendRotina}
            onResumeRotina={handleResumeRotina}
            onLinkListToRotina={handleLinkListToRotinaInstance}
            onUnlinkListFromRotina={handleUnlinkListFromRotinaInstance}
            onSaveAndLinkListToRotina={handleSaveAndLinkListToRotina}
            autoMigrationEnabled={autoMigrationEnabled}
            onReopenAsPending={handleReopenAsPending}
            onReopenAndReschedule={handleReopenAndReschedule}
            onNavigateToDay={handleGoToEventsDate}
          />
        );
      case 'listas':
        return (
          <ListsScreen
            userName={userName}
            lists={lists}
            events={events}
            initialListId={navigateToListId}
            onSaveList={handleSaveList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
            onLinkFromList={handleLinkFromList}
            onUnlinkList={handleUnlinkFromList}
            resetKey={listsResetKey}
          />
        );
      case 'pendencias':
        return (
          <PendingScreen
            userName={userName}
            events={events}
            lists={lists}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onCompleteEvent={handleCompleteEvent}
            onReopenEvent={handleReopenEvent}
            onScheduleEvent={handleScheduleEvent}
            onNewPending={handleNewPending}
            onLinkList={handleLinkListToPending}
            onUnlinkList={handleUnlinkList}
            onNavigateToList={navigateToListScreen}
            onSaveNewList={handleSaveList}
            onSaveAndLinkList={handleSaveAndLinkList}
            onSaveEventNotes={handleSaveNotes}
            onShareEventUpdate={handleEventShareUpdate}
            onExitSharedEvent={handleExitSharedEvent}
            resetKey={pendingResetKey}
          />
        );
      case 'config':
        return (
          <SettingsScreen
            onClearData={handleClearData}
            autoMigrationEnabled={autoMigrationEnabled}
            onToggleAutoMigration={handleToggleAutoMigration}
            lists={lists}
            onDeleteList={handleDeleteList}
            deleteCompletedEventsAfter={deleteCompletedEventsAfter}
            deleteCompletedPendingsAfter={deleteCompletedPendingsAfter}
            deleteCompletedRotinasAfter={deleteCompletedRotinasAfter}
            deleteCompletedListsAfter={deleteCompletedListsAfter}
            onSetDeleteCompletedEventsAfter={handleSetDeleteCompletedEventsAfter}
            onSetDeleteCompletedPendingsAfter={handleSetDeleteCompletedPendingsAfter}
            onSetDeleteCompletedRotinasAfter={handleSetDeleteCompletedRotinasAfter}
            onSetDeleteCompletedListsAfter={handleSetDeleteCompletedListsAfter}
            notificationsEnabled={notificationsEnabled}
            notificationMode={notificationMode}
            notificationTime={notificationTime}
            notificationLeadMinutes={notificationLeadMinutes}
            onToggleNotifications={handleToggleNotifications}
            onSetNotificationMode={handleSetNotificationMode}
            onSetNotificationTime={handleSetNotificationTime}
            onSetNotificationLead={handleSetNotificationLead}
            waterTrackerEnabled={waterTrackerEnabled}
            waterDailyGoalMl={waterDailyGoalMl}
            waterReminderEnabled={waterReminderEnabled}
            waterReminderIntervalMinutes={waterReminderIntervalMinutes}
            waterStartTime={waterStartTime}
            waterEndTime={waterEndTime}
            onSetWaterTrackerEnabled={handleSetWaterTrackerEnabled}
            onSetWaterDailyGoalMl={handleSetWaterDailyGoalMl}
            onToggleWaterReminder={handleToggleWaterReminder}
            onSetWaterReminderInterval={handleSetWaterReminderInterval}
            onSetWaterStartTime={handleSetWaterStartTime}
            onSetWaterEndTime={handleSetWaterEndTime}
            notificationsListsEnabled={notificationsListsEnabled}
            notificationsPendingsEnabled={notificationsPendingsEnabled}
            onToggleNotificationsLists={handleToggleNotificationsLists}
            onToggleNotificationsPendings={handleToggleNotificationsPendings}
            birthDate={birthDate}
            onSetBirthDate={handleSetBirthDate}
            onChangeUserName={(name) => setUserName(name)}
            onRestoreComplete={reloadAllData}
          />
        );
    }
  };

  // ===========================
  // NAVBAR
  // ===========================
  const NAV_ITEMS: { key: ScreenName; label: string; icon: string; badge?: number }[] = [
    { key: 'eventos', label: t.nav.eventos, icon: '📅', badge: todayCount },
    { key: 'listas', label: t.nav.listas, icon: '📝' },
    { key: 'pendencias', label: t.nav.pendencias, icon: '⏳', badge: pendingCount },
    { key: 'calendario', label: t.nav.calendario, icon: '🗓️' },
    { key: 'config', label: t.nav.config, icon: '⚙️' },
  ];

  const styles = React.useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgMain },
    content: { flex: 1 },
    navIconContainer: { position: 'relative' },
    navIcon: { fontSize: 22 },
    badge: {
      position: 'absolute', top: -4, right: -8,
      backgroundColor: colors.danger, borderRadius: 8,
      minWidth: 16, height: 16,
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    },
    badgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  }), [colors]);

  // Aguarda verificação inicial — evita flash
  if (onboardingDone === null) return null;

  const statusBarStyle = theme === 'claro' ? 'dark-content' : 'light-content';

  // Onboarding na primeira abertura
  if (!onboardingDone) {
    const handleOnboardingDone = async () => {
      const settings = await loadSettings();
      setUserName(settings.displayName ?? '');
      if (settings.waterTrackerEnabled != null) setWaterTrackerEnabled(settings.waterTrackerEnabled);
      if (settings.birthDate) setBirthDate(settings.birthDate);
      setOnboardingDone(true);
    };
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bgMain} />
        <OnboardingScreen onDone={handleOnboardingDone} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.bgMain} />

      <View style={styles.content}>{renderScreen()}</View>

      {/* NAVBAR INFERIOR */}
      <View style={[globalStyles.navbar, { paddingBottom: NAVBAR_BOTTOM_PADDING }]}>
        {NAV_ITEMS.map(item => {
          const isActive = activeScreen === item.key;
          return (
            <TouchableOpacity key={item.key} style={globalStyles.navItem} onPress={() => handleNavPress(item.key)}>
              <View style={styles.navIconContainer}>
                <Text style={styles.navIcon}>{item.icon}</Text>
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[globalStyles.navLabel, isActive && globalStyles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MODAL TIPO DE EVENTO */}
      <EventTypeModal
        visible={showEventTypeModal}
        onClose={() => setShowEventTypeModal(false)}
        onSelect={handleEventTypeSelect}
      />

      {/* FORMULÁRIO DE COMPROMISSO */}
      <EventForm
        visible={showEventForm}
        onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
        onSave={handleSaveEvent}
        onSaveNotes={handleSaveNotes}
        editingEvent={editingEvent}
        existingEvents={events}
      />

      {/* FORMULÁRIO DE PENDÊNCIA */}
      <PendingForm
        visible={showPendingForm}
        onClose={() => { setShowPendingForm(false); setEditingPending(null); }}
        onSave={handleSaveEvent}
        onSaveNotes={handleSaveNotes}
        editingEvent={editingPending}
        existingEvents={events}
      />

      {/* FORMULÁRIO DE ROTINA */}
      <RoutineForm
        visible={showRoutineForm}
        onClose={() => { setShowRoutineForm(false); setEditingRotina(null); setPendingToConvertId(null); }}
        onSave={handleSaveRotina}
        onSaveNotes={handleSaveRotinaNotesHot}
        editingRotina={editingRotina}
        preFilledDate={eventTypeContext?.date || null}
      />

      {/* MODAL DE BUSCA */}
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        events={events}
        lists={lists}
        onGoToDate={handleGoToDate}
        onEditEvent={(event) => { handleEditEvent(event); setShowSearch(false); }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FirebaseProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </FirebaseProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
