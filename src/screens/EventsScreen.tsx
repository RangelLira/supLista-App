// ===========================
// TELA: CALENDÁRIO
// ===========================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarView from '../components/CalendarView';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { darkColors } from '../styles/theme';
import { Event, Rotina, RotinaInstance, ShoppingList } from '../types';
import { formatDate, formatHeaderDate } from '../utils/dateUtils';
import { getOccurrencesForDate } from '../utils/rotinaUtils';

let hasPlayedAnimation = false;

interface Props {
  events: Event[];
  rotinas: Rotina[];
  lists: ShoppingList[];
  initialDate?: string;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: number) => void;
  onCompleteEvent: (id: number) => void;
  onReopenEvent: (id: number) => void;
  onPostponeEvent: (event: Event) => void;
  onNewEvent: () => void;
  onNewEventOnDate: (date: string) => void;
  onSearch: () => void;
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
  // Duplo-tap navega para tela Eventos naquela data
  onNavigateToDay?: (dateStr: string) => void;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    calendarContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
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
      marginBottom: 24,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: 4,
      backgroundColor: c.success,
      borderRadius: 2,
    },
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
    bottomBar: {
      padding: 16,
      backgroundColor: c.bgMain,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}

export default function EventsScreen({
  events, rotinas, lists, initialDate,
  onEditEvent, onDeleteEvent, onCompleteEvent, onReopenEvent, onPostponeEvent,
  onNewEvent, onNewEventOnDate, onSearch,
  onLinkList, onUnlinkList, onNavigateToList, onSaveNewList, onSaveAndLinkList,
  onEditRotina, onDeleteRotina, onCompleteRotinaInstance, onUncompleteRotinaInstance, onSuspendRotina, onResumeRotina,
  onLinkListToRotina, onUnlinkListFromRotina, onSaveAndLinkListToRotina,
  autoMigrationEnabled, onReopenAsPending, onReopenAndReschedule,
  onNavigateToDay,
}: Props) {
  const { colors, globalStyles } = useTheme();
  const { t, lang } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const todayStr = useMemo(() => formatDate(new Date()), []);
  // Sempre inicia com hoje selecionado (req 1)
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [animKey, setAnimKey] = useState(0);

  // Progresso do dia selecionado (req 5)
  const selectedDayEvents = useMemo(() =>
    events.filter(e => e.start_time?.startsWith(selectedDate) && !e.is_pending),
    [events, selectedDate]
  );

  const selectedDayRotinaInstances = useMemo((): RotinaInstance[] => {
    const result: RotinaInstance[] = [];
    rotinas.forEach(r => getOccurrencesForDate(r, selectedDate).forEach(inst => result.push(inst)));
    return result;
  }, [rotinas, selectedDate]);

  const totalItems = selectedDayEvents.length + selectedDayRotinaInstances.length;
  const completedItems =
    selectedDayEvents.filter(e => e.is_completed).length +
    selectedDayRotinaInstances.filter(i => i.is_completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // ——— Valores animados ———
  const headerY = useRef(new Animated.Value(hasPlayedAnimation ? 0 : -60)).current;
  const headerOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const sectionOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const progressWidth = useRef(new Animated.Value(hasPlayedAnimation ? progressPercent : 100)).current;
  const calendarOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const calendarY = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 20)).current;

  // ——— Sequência de animação ———
  useEffect(() => {
    if (hasPlayedAnimation) {
      headerY.setValue(0);
      headerOpacity.setValue(1);
      sectionOpacity.setValue(1);
      progressWidth.setValue(progressPercent);
      calendarOpacity.setValue(1);
      calendarY.setValue(0);
      return;
    }

    hasPlayedAnimation = true;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 120 }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(sectionOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(progressWidth, {
          toValue: progressPercent,
          duration: 800,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(calendarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(calendarY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  useEffect(() => {
    progressWidth.setValue(progressPercent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent]);

  const handleReset = useCallback(() => {
    hasPlayedAnimation = false;
    headerY.setValue(-60);
    headerOpacity.setValue(0);
    sectionOpacity.setValue(0);
    progressWidth.setValue(100);
    calendarOpacity.setValue(0);
    calendarY.setValue(20);
    setAnimKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={globalStyles.screen}>
      <Animated.View style={[globalStyles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Text style={globalStyles.headerTitle}>{t.nav.calendario}</Text>
        <Text style={globalStyles.headerSubtitle}>
          {formatHeaderDate(new Date(selectedDate + 'T12:00:00'), lang)}
        </Text>
        {__DEV__ && (
          <TouchableOpacity style={styles.headerResetBtn} onPress={handleReset}>
            <Text style={styles.headerResetText}>RESET</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <View style={styles.calendarContainer}>
        {/* Título de seção + barra de progresso */}
        <Animated.View style={{ opacity: sectionOpacity }}>
          <Text style={styles.sectionTitle}>{t.events.sectionCalendar}</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBarFill, {
              width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: calendarOpacity, transform: [{ translateY: calendarY }] }}>
          <CalendarView
            events={events}
            rotinas={rotinas}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
            onDoubleTapDate={(d) => {
              setSelectedDate(d);
              onNavigateToDay?.(d);
            }}
          />
        </Animated.View>
      </View>

      {/* Footer: sempre "Buscar Evento" (req 2) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={globalStyles.buttonPrimary}
          onPress={onSearch}>
          <Text style={globalStyles.buttonPrimaryText}>{t.events.searchBtn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
