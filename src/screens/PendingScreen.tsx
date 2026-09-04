// ===========================
// TELA: PENDÊNCIAS
// ===========================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EventCard from '../components/EventCard';
import TaskDetailScreen from './TaskDetailScreen';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/useToast';
import { darkColors } from '../styles/theme';
import { Event, ShoppingList } from '../types';
import { formatHeaderDate } from '../utils/dateUtils';

let hasPlayedAnimation = false;

interface Props {
  userName: string;
  events: Event[];
  lists: ShoppingList[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: number) => void;
  onCompleteEvent: (id: number) => void;
  onReopenEvent: (id: number) => void;
  onScheduleEvent: (event: Event) => void;
  onNewPending: () => void;
  onLinkList: (pendingId: number, listId: number) => void;
  onUnlinkList: (pendingId: number) => void;
  onNavigateToList: (listId: number) => void;
  onSaveNewList: (list: ShoppingList) => void;
  onSaveAndLinkList: (list: ShoppingList, itemId: number) => void;
  onSaveEventNotes?: (id: number, notes: string[]) => void;
  onShareEventUpdate?: (id: number, sharedWithUid: string | null) => void;
  onExitSharedEvent?: (eventId: number) => void;
  resetKey?: number;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
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
    greetingContainer: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    greetingHello: {
      color: c.textPrimary,
      fontSize: 36,
      fontWeight: '800',
      textAlign: 'center',
    },
    greetingSubtitle: {
      color: c.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 4,
    },
    doneSectionTitle: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      marginTop: 16,
      marginBottom: 10,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 40,
    },
    emptyEmoji: { fontSize: 64, marginBottom: 16 },
    emptyTitle: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 8,
    },
    emptySubtitle: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: 'center',
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

export default function PendingScreen({ userName, events, lists, onEditEvent, onDeleteEvent, onCompleteEvent, onReopenEvent, onScheduleEvent, onNewPending, onLinkList, onUnlinkList, onNavigateToList, onSaveNewList, onSaveAndLinkList, onSaveEventNotes, onShareEventUpdate, onExitSharedEvent, resetKey }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t, lang } = useLanguage();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedPending, setSelectedPending] = useState<Event | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const allPendingItems = events
    .filter(e => e.is_pending)
    .sort((a, b) => a.title.localeCompare(b.title));

  const completedCount = allPendingItems.filter(e => e.is_completed).length;
  const openCount = allPendingItems.length - completedCount;
  const total = allPendingItems.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isMantraState = openCount === 0;

  // ——— Valores animados ———
  const headerY = useRef(new Animated.Value(hasPlayedAnimation ? 0 : -60)).current;
  const headerOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const eventsOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const progressWidth = useRef(new Animated.Value(hasPlayedAnimation ? progressPercent : 100)).current;
  const greetingX = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 400)).current;
  const greetingOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const subtitleX = useRef(new Animated.Value(hasPlayedAnimation ? 0 : 400)).current;
  const subtitleOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const contentOpacity = useRef(new Animated.Value(hasPlayedAnimation ? 1 : 0)).current;
  const textFadeOpacity = useRef(new Animated.Value(1)).current;

  const [showMantra, setShowMantra] = useState(isMantraState);
  const prevIsMantraRef = useRef(isMantraState);
  const prevOpenCountRef = useRef(openCount);

  // Botão da navbar pressionado enquanto já está nesta tela → volta à raiz
  useEffect(() => {
    if (resetKey === undefined || resetKey === 0) return;
    setSelectedPending(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // ——— Sequência de animação ———
  useEffect(() => {
    if (hasPlayedAnimation) {
      headerY.setValue(0);
      headerOpacity.setValue(1);
      eventsOpacity.setValue(1);
      progressWidth.setValue(progressPercent);
      greetingX.setValue(0);
      greetingOpacity.setValue(1);
      subtitleX.setValue(0);
      subtitleOpacity.setValue(1);
      contentOpacity.setValue(1);
      return;
    }

    hasPlayedAnimation = true;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 120 }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(eventsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(progressWidth, {
          toValue: progressPercent,
          duration: 800,
          delay: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(greetingX, { toValue: 0, duration: 350, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(greetingOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleX, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animKey]);

  useEffect(() => {
    progressWidth.setValue(progressPercent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent]);

  useEffect(() => {
    if (prevIsMantraRef.current === isMantraState) return;
    prevIsMantraRef.current = isMantraState;
    Animated.timing(textFadeOpacity, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => {
      setShowMantra(isMantraState);
      Animated.timing(textFadeOpacity, {
        toValue: 1, duration: 250, useNativeDriver: true,
      }).start();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMantraState]);

  useEffect(() => {
    const prev = prevOpenCountRef.current;
    prevOpenCountRef.current = openCount;
    if (prev > 0 && openCount === 0) {
      showToast(t.pending.mantra);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCount]);

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
    contentOpacity.setValue(0);
    setAnimKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (selectedPending) {
    const current = events.find(e => e.id === selectedPending.id) ?? selectedPending;
    return (
      <TaskDetailScreen
        itemType="pending"
        event={current}
        lists={lists}
        onEdit={() => { onEditEvent(current); setSelectedPending(null); }}
        onDelete={() => { onDeleteEvent(current.id); setSelectedPending(null); }}
        onComplete={() => onCompleteEvent(current.id)}
        onReopen={() => onReopenEvent(current.id)}
        onSchedule={() => { onScheduleEvent(current); setSelectedPending(null); }}
        onLinkList={(listId) => onLinkList(current.id, listId)}
        onUnlinkList={() => onUnlinkList(current.id)}
        onSaveNewList={onSaveNewList}
        onSaveAndLinkList={(list) => onSaveAndLinkList(list, current.id)}
        onNavigateToList={onNavigateToList}
        onSaveNotes={(notes) => onSaveEventNotes?.(current.id, notes)}
        onShareUpdate={(uid) => onShareEventUpdate?.(current.id, uid)}
        onExitSharedEvent={onExitSharedEvent}
        onBack={() => setSelectedPending(null)}
      />
    );
  }

  return (
    <View style={globalStyles.screen}>
      <Animated.View style={[globalStyles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <Text style={globalStyles.headerTitle}>{t.pending.title}</Text>
        <Text style={globalStyles.headerSubtitle}>{formatHeaderDate(new Date(), lang)}</Text>
        {__DEV__ && (
          <TouchableOpacity style={styles.headerResetBtn} onPress={handleReset}>
            <Text style={styles.headerResetText}>RESET</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView contentContainerStyle={globalStyles.scrollContent}>
        {/* TÍTULO DA SEÇÃO + BARRA */}
        <Animated.View style={{ opacity: eventsOpacity }}>
          <Text style={styles.sectionTitle}>{t.pending.sectionPending}</Text>
          {total > 0 && (
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBarFill, {
                width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              }]} />
            </View>
          )}
        </Animated.View>

        <Animated.View style={{ opacity: textFadeOpacity }}>
          {/* SAUDAÇÃO — com pendências abertas */}
          {!showMantra && (
            <View style={styles.greetingContainer}>
              <Animated.Text style={[styles.greetingHello, { opacity: greetingOpacity, transform: [{ translateX: greetingX }] }]}>
                {t.home.greetingHello(userName || '...')}
              </Animated.Text>
              <Animated.Text style={[styles.greetingSubtitle, { opacity: subtitleOpacity, transform: [{ translateX: subtitleX }] }]}>
                {t.pending.greetingSubtitle}
              </Animated.Text>
            </View>
          )}

          {/* MANTRA — tudo concluído ou lista vazia */}
          {showMantra && (
            <View style={styles.greetingContainer}>
              <Animated.Text style={[styles.greetingHello, { opacity: greetingOpacity, transform: [{ translateX: greetingX }] }]}>
                ✅ {t.pending.emptyTitle}
              </Animated.Text>
              <Animated.Text style={[styles.greetingSubtitle, { opacity: subtitleOpacity, transform: [{ translateX: subtitleX }] }]}>
                {completedCount > 0 ? t.pending.allDoneSubtitle : t.pending.emptySubtitle}
              </Animated.Text>
            </View>
          )}
        </Animated.View>

        {/* CARDS — ordem estável, sem reorganização ao concluir */}
        <Animated.View style={{ opacity: contentOpacity }}>
          {allPendingItems.map(event => (
            <EventCard
              key={event.id}
              event={event}
              lists={lists}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
              onComplete={onCompleteEvent}
              onReopen={onReopenEvent}
              hidePendingBadge={true}
              onSchedule={onScheduleEvent}
              onLinkList={onLinkList}
              onUnlinkList={onUnlinkList}
              onNavigateToList={onNavigateToList}
              onSaveNewList={onSaveNewList}
              onSaveAndLinkList={onSaveAndLinkList}
              onPress={(evt) => setSelectedPending(evt)}
            />
          ))}
        </Animated.View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={globalStyles.buttonPrimary} onPress={onNewPending}>
          <Text style={globalStyles.buttonPrimaryText}>{t.pending.createBtn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
