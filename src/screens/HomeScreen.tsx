// ===========================
// TELA: HOJE (Dashboard) — redesenhada com Animated nativo (NDK-safe)
// ===========================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import EventCard from '../components/EventCard';
import RoutineCard from '../components/RoutineCard';
import TaskDetailScreen from './TaskDetailScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import { darkColors } from '../styles/theme';
import { Event, Rotina, RotinaInstance, ShoppingList, WaterDayLog, WaterEntry } from '../types';
import { formatDate, formatHeaderDate } from '../utils/dateUtils';
import { getOccurrencesForDate } from '../utils/rotinaUtils';

// Variável de sessão — animação reproduzida apenas uma vez por montagem do app
let hasPlayedAnimation = false;

type ActiveHomeView = 'overview' | 'routines' | 'appointments' | 'waterlog';

interface Props {
  userName: string;
  events: Event[];
  rotinas: Rotina[];
  lists: ShoppingList[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: number) => void;
  onCompleteEvent: (id: number) => void;
  onReopenEvent: (id: number) => void;
  onPostponeEvent: (event: Event) => void;
  onNewEvent: () => void;
  onNewEventOnDate?: (date: string) => void;
  onLinkList: (eventId: number, listId: number) => void;
  onUnlinkList: (eventId: number) => void;
  onNavigateToList: (listId: number) => void;
  onSaveNewList: (list: ShoppingList) => void;
  onSaveAndLinkList: (list: ShoppingList, itemId: number) => void;
  // Rotinas
  onEditRotina: (rotina: Rotina) => void;
  onDeleteRotina: (rotinaId: number) => void;
  onCompleteRotinaInstance: (rotinaId: number, instanceKey: string) => void;
  onUncompleteRotinaInstance: (rotinaId: number, instanceKey: string) => void;
  onSuspendRotina: (rotinaId: number) => void;
  onResumeRotina: (rotinaId: number) => void;
  onLinkListToRotina: (rotinaId: number, instanceKey: string, listId: number) => void;
  onUnlinkListFromRotina: (rotinaId: number, instanceKey: string) => void;
  onSaveAndLinkListToRotina: (list: ShoppingList, rotinaId: number, instanceKey: string) => void;
  autoMigrationEnabled: boolean;
  onReopenAsPending: (event: Event) => void;
  onReopenAndReschedule: (event: Event) => void;
  onSaveEventNotes?: (id: number, notes: string[]) => void;
  onSaveRotinaInstanceNotes?: (rotinaId: number, notes: string[]) => void;
  onShareEventUpdate?: (id: number, sharedWithUid: string | null) => void;
  onExitSharedEvent?: (eventId: number) => void;
  // Hidratação
  waterTrackerEnabled: boolean;
  waterDailyGoalMl: number;
  waterLog: WaterDayLog | null;
  onAddWaterEntry: (amountMl: number) => void;
  onDeleteWaterEntry: (entryId: number) => void;
  onUpdateWaterEntry: (entryId: number, newAmountMl: number) => void;
  // Data inicial (vinda do duplo-clique no Calendário)
  targetDate?: string;
  onTargetDateConsumed?: () => void;
  resetKey?: number;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    // ——— Header com botão RESET (__DEV__) ———
    headerResetBtn: {
      position: 'absolute',
      right: 12,
      top: 4,
    },
    headerResetText: {
      fontSize: 9,
      color: c.textSecondary,
      opacity: 0.5,
    },

    // ——— Overview (sem scroll) ———
    overviewBody: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    blocksContainer: {
      gap: 10,
    },
    blockFlex: {
      minHeight: 76,
    },
    bodyTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      marginTop: 4,
    },
    sectionTitle: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 4,
    },
    progressBarContainer: {
      alignSelf: 'stretch',
      height: 4,
      backgroundColor: c.border,
      borderRadius: 2,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: 4,
      backgroundColor: c.success,
      borderRadius: 2,
    },

    // ——— Saudação ———
    greetingContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    greetingHello: {
      fontSize: 36,
      fontWeight: '800',
      textAlign: 'center',
      color: c.textPrimary,
    },
    greetingSubtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: c.textSecondary,
      marginTop: 4,
    },

    // ——— Blocos de navegação ———
    block: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.borderCard,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: c.bgCard,
      gap: 12,
    },
    blockEmoji: {
      fontSize: 30,
    },
    blockInfo: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    blockInfoEmpty: {
      color: c.textSecondary,
      fontStyle: 'italic',
      fontWeight: '400',
    },
    blockBtn: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 12,
      minWidth: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    blockBtnText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '700',
    },
    blockDone: {
      backgroundColor: c.successBg,
      borderColor: c.successBorder,
    },

    // ——— Footer com botão criar ———
    bottomBar: {
      padding: 16,
      backgroundColor: c.bgMain,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },

    // ——— Sub-telas (routines / appointments) ———
    detailScrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    bottomBarDetail: {
      padding: 16,
      backgroundColor: c.bgMain,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },

    // Bloco de hidratação (mesma estrutura de row dos outros blocos)
    waterBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgCard,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#2196F3' + '55',
      paddingVertical: 16,
      paddingHorizontal: 16,
      gap: 12,
    },
    waterBlockDone: {
      borderColor: c.success + '88',
    },

    // Modal de água
    waterModalTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 20,
    },
    waterInputField: {
      marginBottom: 12,
      textAlign: 'center',
    },

    backBtn: {
      backgroundColor: c.bgSecondary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    backBtnText: {
      color: c.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyTitle: { color: c.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 },
    emptySubtitle: { color: c.textSecondary, fontSize: 15, textAlign: 'center' },

    // Water log view
    waterEntryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgCard,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#2196F3' + '44',
      paddingVertical: 14,
      paddingHorizontal: 14,
      marginBottom: 8,
      gap: 10,
    },
    waterEntryEmoji: {
      fontSize: 22,
    },
    waterEntryMain: {
      flex: 1,
    },
    waterEntryAmount: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
    waterEntryTime: {
      color: c.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    waterEntryDeleteBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: c.danger,
      borderRadius: 8,
    },
    waterEntryDeleteText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    waterLogBottomBar: {
      padding: 16,
      backgroundColor: c.bgMain,
    },
    waterLogBtnSeparator: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: 12,
    },
  });
}

export default function HomeScreen({
  userName, events, rotinas, lists,
  onEditEvent, onDeleteEvent, onCompleteEvent, onReopenEvent, onPostponeEvent, onNewEvent, onNewEventOnDate,
  onLinkList, onUnlinkList, onNavigateToList, onSaveNewList, onSaveAndLinkList,
  onEditRotina, onDeleteRotina, onCompleteRotinaInstance, onUncompleteRotinaInstance, onSuspendRotina, onResumeRotina,
  onLinkListToRotina, onUnlinkListFromRotina, onSaveAndLinkListToRotina,
  autoMigrationEnabled, onReopenAsPending, onReopenAndReschedule,
  onSaveEventNotes, onSaveRotinaInstanceNotes, onShareEventUpdate, onExitSharedEvent,
  waterTrackerEnabled, waterDailyGoalMl, waterLog, onAddWaterEntry,
  onDeleteWaterEntry, onUpdateWaterEntry,
  targetDate, onTargetDateConsumed, resetKey,
}: Props) {
  const { colors, globalStyles } = useTheme();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeHomeView, setActiveHomeView] = useState<ActiveHomeView>('overview');
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [expandedRotinaKey, setExpandedRotinaKey] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRotinaItem, setSelectedRotinaItem] = useState<{ rotina: Rotina; instance: RotinaInstance } | null>(null);

  // animKey força re-render para o botão RESET (__DEV__)
  const [animKey, setAnimKey] = useState(0);

  // ——— Data de hoje / selecionada ———
  const todayStr = useMemo(() => formatDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(targetDate || todayStr);
  const isToday = selectedDate === todayStr;

  // Quando chega data do duplo-clique no Calendário
  useEffect(() => {
    if (targetDate) {
      setSelectedDate(targetDate);
      onTargetDateConsumed?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  // Botão da navbar pressionado enquanto já está nesta tela → volta à raiz
  useEffect(() => {
    if (resetKey === undefined || resetKey === 0) return;
    setSelectedEvent(null);
    setSelectedRotinaItem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Hidratação
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterInputValue, setWaterInputValue] = useState('');
  const [editingWaterEntry, setEditingWaterEntry] = useState<WaterEntry | null>(null);

  const consumedMl = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!waterLog || waterLog.date !== today) return 0;
    return waterLog.entries.reduce((sum, e) => sum + e.amountMl, 0);
  }, [waterLog]);

  const waterGoalReached = consumedMl >= waterDailyGoalMl;

  // Unit helpers: EN uses fl oz, others use Litros/ml
  const isEnglish = lang === 'en';
  const FL_OZ_PER_ML = 1 / 29.5735;

  const formatWaterConsumed = (ml: number): string => {
    if (isEnglish) return `${(ml * FL_OZ_PER_ML).toFixed(1)} fl oz`;
    if (ml < 1000) return `${ml}ml`;
    const liters = ml / 1000;
    return `${liters % 1 === 0 ? liters : liters.toFixed(1).replace('.', ',')} Litros`;
  };

  const formatWaterGoal = (ml: number): string => {
    if (isEnglish) return `${(ml * FL_OZ_PER_ML).toFixed(1)} fl oz`;
    const liters = ml / 1000;
    return `${liters % 1 === 0 ? liters : liters.toFixed(1).replace('.', ',')} Litros`;
  };

  const handleSaveWater = () => {
    const ml = parseInt(waterInputValue, 10);
    if (isNaN(ml) || ml <= 0) return;
    if (editingWaterEntry) {
      onUpdateWaterEntry(editingWaterEntry.id, ml);
    } else {
      onAddWaterEntry(ml);
    }
    setShowWaterModal(false);
    setWaterInputValue('');
    setEditingWaterEntry(null);
  };

  const handleCancelWater = () => {
    setShowWaterModal(false);
    setWaterInputValue('');
    setEditingWaterEntry(null);
  };

  const handleOpenEditWaterEntry = (entry: WaterEntry) => {
    setEditingWaterEntry(entry);
    setWaterInputValue(entry.amountMl.toString());
    setShowWaterModal(true);
  };

  const handleDeleteWaterEntryConfirm = (entry: WaterEntry) => {
    Alert.alert(
      t.alerts.deleteSure,
      `${entry.amountMl}ml · ${formatEntryTime(entry.timestamp)}`,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.alerts.deleteSureBtn, style: 'destructive', onPress: () => onDeleteWaterEntry(entry.id) },
      ],
    );
  };

  const formatEntryTime = (timestamp: string): string => {
    const d = new Date(timestamp);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // ——— Dados derivados para o dia selecionado ———
  const allTodayEvents = useMemo(() =>
    events
      .filter(e => e.start_time && e.start_time.startsWith(selectedDate) && !e.is_pending)
      .sort((a, b) => {
        const aIsAllDay = a.start_time?.endsWith('T00:00:00');
        const bIsAllDay = b.start_time?.endsWith('T00:00:00');
        if (aIsAllDay && !bIsAllDay) return -1;
        if (!aIsAllDay && bIsAllDay) return 1;
        return (a.start_time || '').localeCompare(b.start_time || '');
      }),
    [events, selectedDate]
  );

  const activeTodayEvents = useMemo(() =>
    allTodayEvents.filter(e => !e.is_completed),
    [allTodayEvents]
  );

  const completedTodayEvents = useMemo(() =>
    allTodayEvents.filter(e => e.is_completed),
    [allTodayEvents]
  );

  const todayRotinaInstances = useMemo((): Array<{ rotina: Rotina; instance: RotinaInstance }> => {
    const result: Array<{ rotina: Rotina; instance: RotinaInstance }> = [];
    rotinas.forEach(rotina => {
      const instances = getOccurrencesForDate(rotina, selectedDate);
      instances.forEach(instance => result.push({ rotina, instance }));
    });
    result.sort((a, b) => {
      if (a.instance.is_suspended && !b.instance.is_suspended) return 1;
      if (!a.instance.is_suspended && b.instance.is_suspended) return -1;
      return (a.instance.time || '').localeCompare(b.instance.time || '');
    });
    return result;
  }, [rotinas, selectedDate]);

  const activeRotinaInstances = useMemo(() =>
    todayRotinaInstances.filter(r => !r.instance.is_completed),
    [todayRotinaInstances]
  );

  const completedRotinaInstances = useMemo(() =>
    todayRotinaInstances.filter(r => r.instance.is_completed),
    [todayRotinaInstances]
  );

  const totalCount = allTodayEvents.length + todayRotinaInstances.length;
  const completedCount = completedTodayEvents.length + completedRotinaInstances.length;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const allRotinasDone = todayRotinaInstances.length > 0 && completedRotinaInstances.length === todayRotinaInstances.length;
  const allEventsDone = allTodayEvents.length > 0 && completedTodayEvents.length === allTodayEvents.length;
  const isMantra = totalCount === 0 || allDone;

  const realProgressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const prevAllDoneRef = useRef(allDone);
  const prevWaterGoalRef = useRef(waterGoalReached);

  useEffect(() => {
    const prev = prevAllDoneRef.current;
    prevAllDoneRef.current = allDone;
    if (!prev && allDone) {
      showToast(t.home.allDone);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  useEffect(() => {
    const prev = prevWaterGoalRef.current;
    prevWaterGoalRef.current = waterGoalReached;
    if (!prev && waterGoalReached) {
      showToast(t.water.goalReached);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterGoalReached]);

  // ——— Valores animados (useRef para persistir entre renders) ———
  const headerY = useRef(new Animated.Value(hasPlayedAnimation ? 0 : -60)).current;
  const headerOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const eventsOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const progressWidth = useRef(new Animated.Value(hasPlayedAnimation ? realProgressPercent : 100)).current;
  const greetingX = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 400)).current;
  const greetingOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const subtitleX = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 400)).current;
  const subtitleOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const block1Opacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const block1Y = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 20)).current;
  const block2Opacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const block2Y = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 20)).current;
  const block3Opacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const block3Y = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 20)).current;
  const textFadeOpacity = useRef(new Animated.Value(1)).current;

  const [showMantra, setShowMantra] = useState(isMantra);
  const prevIsMantraRef = useRef(isMantra);

  // ——— Sequência de animação ———
  useEffect(() => {
    if (hasPlayedAnimation) {
      // Já animou: definir todos no estado final sem animar
      headerY.setValue(0);
      headerOpacity.setValue(1);
      eventsOpacity.setValue(1);
      progressWidth.setValue(realProgressPercent);
      greetingX.setValue(0);
      greetingOpacity.setValue(1);
      subtitleX.setValue(0);
      subtitleOpacity.setValue(1);
      block1Opacity.setValue(1);
      block1Y.setValue(0);
      block2Opacity.setValue(1);
      block2Y.setValue(0);
      block3Opacity.setValue(1);
      block3Y.setValue(0);
      return;
    }

    hasPlayedAnimation = true;

    Animated.sequence([
      // Fase 1: header cai (t=0)
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 120 }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Fase 2: "Eventos de hoje" + barra (t~300ms)
      Animated.parallel([
        Animated.timing(eventsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(progressWidth, {
          toValue: realProgressPercent,
          duration: 800,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false, // width não suporta nativeDriver
        }),
      ]),
      // Fase 3: "Olá," slide da direita (t~600ms)
      Animated.parallel([
        Animated.timing(greetingX, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(greetingOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Fase 4: "Hoje você tem:" (t~950ms)
      Animated.parallel([
        Animated.timing(subtitleX, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      // Fase 5: delay silencioso (t~1200ms)
      Animated.delay(150),
      // Fase 6: Bloco 1 fade in (t~1350ms)
      Animated.parallel([
        Animated.timing(block1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(block1Y, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // Fase 7: Bloco 2 (t~1600ms)
      Animated.parallel([
        Animated.timing(block2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(block2Y, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // Fase 8: Bloco 3 (t~1850ms)
      Animated.parallel([
        Animated.timing(block3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(block3Y, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  useEffect(() => {
    progressWidth.setValue(realProgressPercent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realProgressPercent]);

  useEffect(() => {
    if (prevIsMantraRef.current === isMantra) return;
    prevIsMantraRef.current = isMantra;
    Animated.timing(textFadeOpacity, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => {
      setShowMantra(isMantra);
      Animated.timing(textFadeOpacity, {
        toValue: 1, duration: 250, useNativeDriver: true,
      }).start();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMantra]);

  // ——— RESET (só __DEV__) ———
  const handleReset = useCallback(() => {
    hasPlayedAnimation = false;
    headerY.setValue(-60);
    headerOpacity.setValue(0);
    eventsOpacity.setValue(0);
    progressWidth.setValue(100);
    greetingX.setValue(400);
    greetingOpacity.setValue(0);
    subtitleX.setValue(400);
    subtitleOpacity.setValue(0);
    block1Opacity.setValue(0);
    block1Y.setValue(20);
    block2Opacity.setValue(0);
    block2Y.setValue(20);
    block3Opacity.setValue(0);
    block3Y.setValue(20);
    setAnimKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— BackHandler Android: detail → list → overview; carrossel volta para hoje ———
  useEffect(() => {
    if (activeHomeView === 'overview') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showWaterModal) { handleCancelWater(); return true; }
      if (selectedEvent) { setSelectedEvent(null); return true; }
      if (selectedRotinaItem) { setSelectedRotinaItem(null); return true; }
      setActiveHomeView('overview');
      return true;
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeView, selectedEvent, selectedRotinaItem, showWaterModal]);

  useEffect(() => {
    if (activeHomeView !== 'overview') return;
    if (isToday) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedDate(todayStr);
      return true;
    });
    return () => sub.remove();
  }, [activeHomeView, isToday, todayStr]);

  // ——— Handlers ———
  const handleToggleRotina = (key: string) => {
    setExpandedRotinaKey(expandedRotinaKey === key ? null : key);
    setExpandedEventId(null);
  };

  const handleToggleEvent = (id: number) => {
    setExpandedEventId(expandedEventId === id ? null : id);
    setExpandedRotinaKey(null);
  };

  // ——— Títulos dinâmicos ———
  const headerTitle = useMemo(() => {
    if (activeHomeView === 'routines') return t.home.altMyRoutines;
    if (activeHomeView === 'appointments') return t.home.altMyAppointments;
    if (activeHomeView === 'waterlog') return isToday ? t.water.myRecordsTitle : t.water.myRecordsDayTitle;
    return t.nav.eventos;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeView, t]);

  const headerSubtitle = useMemo(() => {
    return formatHeaderDate(new Date(selectedDate + 'T12:00:00'), lang);
  }, [lang, selectedDate]);

  // ——— RENDERIZAÇÃO ———

  // === Sub-tela: Rotinas ===
  if (activeHomeView === 'routines') {
    if (selectedRotinaItem) {
      const { rotina: selRotina, instance: selInstance } = selectedRotinaItem;
      const currentRotina = rotinas.find(r => r.id === selRotina.id) ?? selRotina;
      return (
        <TaskDetailScreen
          itemType="rotina"
          rotina={currentRotina}
          instance={selInstance}
          lists={lists}
          onEditRotina={(r) => onEditRotina(r)}
          onDeleteRotina={() => { onDeleteRotina(selInstance.rotinaId); setSelectedRotinaItem(null); setActiveHomeView('overview'); }}
          onCompleteRotina={() => {
            onCompleteRotinaInstance(selInstance.rotinaId, selInstance.instanceKey);
            setSelectedRotinaItem(prev => prev ? { ...prev, instance: { ...prev.instance, is_completed: true } } : null);
          }}
          onUncompleteRotina={() => {
            onUncompleteRotinaInstance(selInstance.rotinaId, selInstance.instanceKey);
            setSelectedRotinaItem(prev => prev ? { ...prev, instance: { ...prev.instance, is_completed: false } } : null);
          }}
          onSuspendRotina={() => {
            onSuspendRotina(selInstance.rotinaId);
            setSelectedRotinaItem(prev => prev ? { ...prev, instance: { ...prev.instance, is_suspended: true } } : null);
          }}
          onResumeRotina={() => {
            onResumeRotina(selInstance.rotinaId);
            setSelectedRotinaItem(prev => prev ? { ...prev, instance: { ...prev.instance, is_suspended: false } } : null);
          }}
          onLinkListToRotina={(listId) => onLinkListToRotina(selInstance.rotinaId, selInstance.instanceKey, listId)}
          onUnlinkListFromRotina={() => onUnlinkListFromRotina(selInstance.rotinaId, selInstance.instanceKey)}
          onSaveNewListToRotina={onSaveNewList}
          onSaveAndLinkListToRotina={(list) => onSaveAndLinkListToRotina(list, selInstance.rotinaId, selInstance.instanceKey)}
          onNavigateToList={onNavigateToList}
          onSaveRotinaInstanceNotes={(notes) => onSaveRotinaInstanceNotes?.(selInstance.rotinaId, notes)}
          onBack={() => setSelectedRotinaItem(null)}
        />
      );
    }

    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{headerTitle}</Text>
          <Text style={globalStyles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.detailScrollContent}>
          <Text style={styles.sectionTitle}>{isToday ? t.home.sectionRoutines : t.home.sectionRoutinesOtherDay}</Text>
          {todayRotinaInstances.length > 0 && (
            <View style={[styles.progressBarContainer, { marginBottom: 16 }]}>
              <View style={[styles.progressBarFill, {
                width: `${Math.round((completedRotinaInstances.length / todayRotinaInstances.length) * 100)}%`,
              }]} />
            </View>
          )}

          {todayRotinaInstances.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{t.home.emptyTitle}</Text>
              <Text style={styles.emptySubtitle}>{t.home.emptySubtitle}</Text>
            </View>
          ) : (
            todayRotinaInstances.map(({ rotina, instance }) => (
              <RoutineCard
                key={`${instance.rotinaId}-${instance.instanceKey}`}
                rotina={rotina}
                instance={instance}
                lists={lists}
                onEdit={onEditRotina}
                onDelete={onDeleteRotina}
                onComplete={onCompleteRotinaInstance}
                onUncomplete={onUncompleteRotinaInstance}
                onSuspend={onSuspendRotina}
                onResume={onResumeRotina}
                onLinkList={onLinkListToRotina}
                onUnlinkList={onUnlinkListFromRotina}
                onNavigateToList={onNavigateToList}
                onSaveNewList={onSaveNewList}
                onSaveAndLinkList={onSaveAndLinkListToRotina}
                onPress={(r, inst) => setSelectedRotinaItem({ rotina: r, instance: inst })}
              />
            ))
          )}
        </ScrollView>
        <View style={styles.bottomBarDetail}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveHomeView('overview')}
            activeOpacity={0.7}>
            <Text style={styles.backBtnText}>{t.home.altBack}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // === Sub-tela: Compromissos ===
  if (activeHomeView === 'appointments') {
    if (selectedEvent) {
      const current = events.find(e => e.id === selectedEvent.id) ?? selectedEvent;
      return (
        <TaskDetailScreen
          itemType="event"
          event={current}
          lists={lists}
          onEdit={() => onEditEvent(current)}
          onDelete={() => { onDeleteEvent(current.id); setSelectedEvent(null); setActiveHomeView('overview'); }}
          onComplete={() => onCompleteEvent(current.id)}
          onReopen={() => onReopenEvent(current.id)}
          onPostpone={() => { onPostponeEvent(current); setSelectedEvent(null); }}
          onLinkList={(listId) => onLinkList(current.id, listId)}
          onUnlinkList={() => onUnlinkList(current.id)}
          onSaveNewList={onSaveNewList}
          onSaveAndLinkList={(list) => onSaveAndLinkList(list, current.id)}
          onNavigateToList={onNavigateToList}
          onSaveNotes={(notes) => onSaveEventNotes?.(current.id, notes)}
          autoMigrationEnabled={autoMigrationEnabled}
          onReopenAsPending={() => { onReopenAsPending(current); setSelectedEvent(null); }}
          onReopenAndReschedule={() => { onReopenAndReschedule(current); setSelectedEvent(null); }}
          onShareUpdate={(uid) => onShareEventUpdate?.(current.id, uid)}
          onExitSharedEvent={onExitSharedEvent}
          onBack={() => setSelectedEvent(null)}
        />
      );
    }

    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{headerTitle}</Text>
          <Text style={globalStyles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.detailScrollContent}>
          <Text style={styles.sectionTitle}>{isToday ? t.home.sectionAppointments : t.home.sectionAppointmentsOtherDay}</Text>
          {allTodayEvents.length > 0 && (
            <View style={[styles.progressBarContainer, { marginBottom: 16 }]}>
              <View style={[styles.progressBarFill, {
                width: `${Math.round((completedTodayEvents.length / allTodayEvents.length) * 100)}%`,
              }]} />
            </View>
          )}

          {allTodayEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{t.home.emptyTitle}</Text>
              <Text style={styles.emptySubtitle}>{t.home.emptySubtitle}</Text>
            </View>
          ) : (
            allTodayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                lists={lists}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
                onComplete={onCompleteEvent}
                onReopen={onReopenEvent}
                onPostpone={onPostponeEvent}
                onLinkList={onLinkList}
                onUnlinkList={onUnlinkList}
                onNavigateToList={onNavigateToList}
                onSaveNewList={onSaveNewList}
                onSaveAndLinkList={onSaveAndLinkList}
                autoMigrationEnabled={autoMigrationEnabled}
                onReopenAsPending={onReopenAsPending}
                onReopenAndReschedule={onReopenAndReschedule}
                onPress={(evt) => setSelectedEvent(evt)}
              />
            ))
          )}
        </ScrollView>
        <View style={styles.bottomBarDetail}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveHomeView('overview')}
            activeOpacity={0.7}>
            <Text style={styles.backBtnText}>{t.home.altBack}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // === Sub-tela: Beba água (waterlog) ===
  if (activeHomeView === 'waterlog') {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = (waterLog && waterLog.date === today) ? waterLog.entries : [];
    const waterProgressPercent = Math.min(100, waterDailyGoalMl > 0 ? Math.round((consumedMl / waterDailyGoalMl) * 100) : 0);
    const waterSubtitle = `${formatWaterConsumed(consumedMl)} / ${formatWaterGoal(waterDailyGoalMl)}`;

    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.water.screenTitle}</Text>
          <Text style={globalStyles.headerSubtitle}>{waterSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.detailScrollContent}>
          {/* Título de seção + barra de progresso — mesmo padrão de "MEUS EVENTOS DE HOJE" */}
          <Text style={styles.sectionTitle}>{(isToday ? t.water.myRecordsTitle : t.water.myRecordsDayTitle).toUpperCase()}</Text>
          <View style={[styles.progressBarContainer, { marginBottom: 16 }]}>
            <View style={[styles.progressBarFill, { width: `${waterProgressPercent}%` }]} />
          </View>

          {/* Lista de registros */}
          {todayEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{'💧'}</Text>
              <Text style={styles.emptySubtitle}>{t.water.noEntriesToday}</Text>
            </View>
          ) : (
            todayEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.waterEntryCard}
                onPress={() => handleOpenEditWaterEntry(entry)}
                activeOpacity={0.75}>
                <Text style={styles.waterEntryEmoji}>{'💧'}</Text>
                <View style={styles.waterEntryMain}>
                  <Text style={styles.waterEntryAmount}>{entry.amountMl}ml</Text>
                  <Text style={styles.waterEntryTime}>{formatEntryTime(entry.timestamp)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.waterEntryDeleteBtn}
                  onPress={() => handleDeleteWaterEntryConfirm(entry)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.waterEntryDeleteText}>{t.common.delete}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.bottomBarDetail}>
          <TouchableOpacity
            style={globalStyles.buttonPrimary}
            onPress={() => {
              setEditingWaterEntry(null);
              setWaterInputValue('');
              setShowWaterModal(true);
            }}
            activeOpacity={0.8}>
            <Text style={globalStyles.buttonPrimaryText}>{t.water.registerBtn}</Text>
          </TouchableOpacity>
        </View>

        {/* Modal registrar / editar água */}
        <Modal
          visible={showWaterModal}
          transparent
          animationType="fade"
          onRequestClose={handleCancelWater}>
          <View style={globalStyles.modalOverlay}>
            <View style={globalStyles.modalContent}>
              <Text style={styles.waterModalTitle}>
                {editingWaterEntry ? t.water.entryEditTitle : t.water.modalTitle}
              </Text>
              <TextInput
                style={[globalStyles.input, styles.waterInputField]}
                value={waterInputValue}
                onChangeText={(val) => setWaterInputValue(val.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder={t.water.modalInputPlaceholder}
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
              <TouchableOpacity
                style={globalStyles.buttonPrimary}
                onPress={handleSaveWater}>
                <Text style={globalStyles.buttonPrimaryText}>{t.common.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.buttonSecondary, { marginTop: 10 }]}
                onPress={handleCancelWater}>
                <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // === Vista principal: Overview ===
  return (
    <View style={globalStyles.screen}>
      {/* HEADER animado — spring de cima para baixo */}
      <Animated.View style={[globalStyles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Text style={globalStyles.headerTitle}>{headerTitle}</Text>
        <Text style={globalStyles.headerSubtitle}>{headerSubtitle}</Text>
        {__DEV__ && (
          <TouchableOpacity style={styles.headerResetBtn} onPress={handleReset}>
            <Text style={styles.headerResetText}>RESET</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <View style={styles.overviewBody}>
        {/* 1. Seção + barra de progresso — oculta quando dia vazio */}
        <Animated.View style={{ opacity: eventsOpacity }}>
          <Text style={styles.sectionTitle}>{isToday ? t.home.sectionToday : t.home.sectionTodayOtherDay}</Text>
          {totalCount > 0 && (
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBarFill, {
                width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              }]} />
            </View>
          )}
        </Animated.View>

        {/* 2. Saudação (itens abertos) ou Mantra (concluído/vazio) */}
        <Animated.View style={[styles.greetingContainer, { opacity: textFadeOpacity }]}>
          <Animated.Text style={[styles.greetingHello, { opacity: greetingOpacity, transform: [{ translateX: greetingX }] }]}>
            {showMantra ? `✅ ${t.home.mantra}` : t.home.greetingHello(userName || '...')}
          </Animated.Text>
          <Animated.Text style={[styles.greetingSubtitle, { opacity: subtitleOpacity, transform: [{ translateX: subtitleX }] }]}>
            {showMantra
              ? (totalCount === 0 ? t.home.emptyDaySubtitle : t.home.allDoneSubtitle)
              : (isToday ? t.home.todayYouHave : t.home.thisDayYouHave)}
          </Animated.Text>
        </Animated.View>

        {/* 3. 3 Blocos fixos — SEMPRE */}
        <View style={styles.blocksContainer}>
          {/* Bloco Rotinas */}
          <Animated.View style={[styles.block, styles.blockFlex, allRotinasDone && styles.blockDone, { opacity: block1Opacity, transform: [{ translateY: block1Y }] }]}>
            <Text style={styles.blockEmoji}>{allRotinasDone ? '✅' : '🔄'}</Text>
            <Text style={[styles.blockInfo, todayRotinaInstances.length === 0 && styles.blockInfoEmpty]}>
              {todayRotinaInstances.length} {t.home.myRoutinesLabel}
            </Text>
            <TouchableOpacity style={styles.blockBtn} onPress={() => setActiveHomeView('routines')} activeOpacity={0.8}>
              <Text style={styles.blockBtnText}>{t.home.viewBtn}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bloco Compromissos */}
          <Animated.View style={[styles.block, styles.blockFlex, allEventsDone && styles.blockDone, { opacity: block2Opacity, transform: [{ translateY: block2Y }] }]}>
            <Text style={styles.blockEmoji}>{allEventsDone ? '✅' : '📅'}</Text>
            <Text style={[styles.blockInfo, allTodayEvents.length === 0 && styles.blockInfoEmpty]}>
              {allTodayEvents.length} {t.home.myAppointmentsLabel}
            </Text>
            <TouchableOpacity style={styles.blockBtn} onPress={() => setActiveHomeView('appointments')} activeOpacity={0.8}>
              <Text style={styles.blockBtnText}>{t.home.viewBtn}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bloco Hidratação */}
          {waterTrackerEnabled && (
            <Animated.View style={[styles.waterBlock, styles.blockFlex, waterGoalReached && styles.waterBlockDone, { opacity: block3Opacity, transform: [{ translateY: block3Y }] }]}>
              <Text style={styles.blockEmoji}>{waterGoalReached ? '✅' : '💧'}</Text>
              <Text style={styles.blockInfo} numberOfLines={1}>
                {waterGoalReached
                  ? t.water.goalReached
                  : `${formatWaterConsumed(consumedMl)} / ${formatWaterGoal(waterDailyGoalMl)}`}
              </Text>
              <TouchableOpacity style={styles.blockBtn} onPress={() => setActiveHomeView('waterlog')}>
                <Text style={styles.blockBtnText}>{t.home.viewBtn}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

      </View>

      {/* Botão criar evento */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={globalStyles.buttonPrimary}
          onPress={!isToday && onNewEventOnDate ? () => onNewEventOnDate(selectedDate) : onNewEvent}
          activeOpacity={0.8}>
          <Text style={globalStyles.buttonPrimaryText}>
            {!isToday ? t.events.createForDay : t.home.createBtn}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
