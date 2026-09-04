// ===========================
// COMPONENTE: CARD DE EVENTO
// ===========================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFirebase } from '../contexts/FirebaseContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';
import { darkColors } from '../styles/theme';
import { Event, ShoppingList } from '../types';
import { exitSharedEvent, shareEvent, unshareEvent } from '../utils/firestore';
import ShareModal from './ShareModal';
import { CreateListForm } from './ShoppingList';

interface Props {
  event: Event;
  lists?: ShoppingList[];
  onEdit: (event: Event) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  onReopen?: (id: number) => void;
  onReopenAsPending?: (event: Event) => void;
  onReopenAndReschedule?: (event: Event) => void;
  onSchedule?: (event: Event) => void;
  onPostpone?: (event: Event) => void;
  onLinkList?: (eventId: number, listId: number) => void;
  onUnlinkList?: (eventId: number) => void;
  onNavigateToList?: (listId: number) => void;
  onSaveNewList?: (list: ShoppingList) => void;
  onSaveAndLinkList?: (list: ShoppingList, itemId: number) => void;
  showDate?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: (event: Event) => void;
  hidePendingBadge?: boolean;
  autoMigrationEnabled?: boolean;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    swipeContainer: {
      marginBottom: 10,
      position: 'relative',
    },
    swipeBg: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 12,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    swipeBgLeft: {
      flex: 1,
      backgroundColor: c.success,
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingLeft: 24,
    },
    swipeBgRight: {
      flex: 1,
      backgroundColor: c.danger,
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 24,
    },
    swipeBgIcon: {
      fontSize: 26,
      color: 'white',
    },

    card: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      marginBottom: 0, // marginBottom handled by swipeContainer
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    cardCompleted: {
      backgroundColor: c.successBg,
      borderColor: c.successBorder,
      opacity: 0.8,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 8,
    },
    timeContainer: { minWidth: 52, alignItems: 'center' },
    timeText: { color: c.primary, fontSize: 14, fontWeight: '700' },
    allDayText: { color: c.textSecondary, fontSize: 11, fontWeight: '600' },
    dateText: { color: c.textSecondary, fontSize: 11 },
    pendingBadge: { color: c.warning, fontSize: 10, fontWeight: '700' },
    completedDateText: { color: c.success, fontSize: 10, fontWeight: '600' },
    completedTimeText: { color: c.success, fontSize: 10 },
    createdDateText: { color: c.warning, fontSize: 10, fontWeight: '600' },
    createdTimeText: { color: c.warning, fontSize: 10 },
    title: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    titleCompleted: { textDecorationLine: 'line-through', color: c.textSecondary },
    linkedBadge: { fontSize: 14 },
    badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    expandArrow: { color: c.textSecondary, fontSize: 16, paddingHorizontal: 6, paddingVertical: 4 },

    expandedContent: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      padding: 14,
      paddingTop: 12,
    },
    section: { marginBottom: 12 },
    sectionTitle: { color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    noteText: { color: c.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 2 },

    linkedListContainer: {
      backgroundColor: c.bgSecondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.primary + '44',
    },
    linkedListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    linkedListLabel: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    linkedListStatus: { backgroundColor: c.warning + '33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    linkedListStatusDone: { backgroundColor: c.success + '33' },
    linkedListStatusText: { color: c.textPrimary, fontSize: 11, fontWeight: '600' },
    linkedListName: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 8 },
    linkedListActions: { flexDirection: 'row', gap: 8 },
    linkedListButton: { backgroundColor: c.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
    linkedListButtonDanger: { backgroundColor: c.danger },
    linkedListButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },

    actionsGrid: { marginTop: 8, gap: 8 },
    actionsRow: { flexDirection: 'row', gap: 8 },
    gridBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    gridBtnText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    gridBtnTextDisabled: { color: c.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    gridBtnNeutral: { backgroundColor: c.bgSecondary },
    gridBtnPrimary: { backgroundColor: c.primary },
    gridBtnSuccess: { backgroundColor: c.success },
    gridBtnDanger: { backgroundColor: c.danger },
    gridBtnWarning: { backgroundColor: c.warning },
    gridBtnDisabled: { backgroundColor: c.bgSecondary, opacity: 0.4 },
    atrasadoBadge: { color: c.danger, fontSize: 9, fontWeight: '700', marginTop: 2 },

    createNewButton: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 8,
    },
    createNewButtonText: {
      color: 'white',
      fontSize: 15,
      fontWeight: '600',
    },
    orDivider: {
      color: c.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginVertical: 10,
    },
    listOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: c.bgCard, marginBottom: 8, gap: 12 },
    listOptionIcon: { fontSize: 20 },
    listOptionName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    listOptionMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  });
}

export default function EventCard({
  event, lists = [], onEdit, onDelete, onComplete, onReopen,
  onReopenAsPending, onReopenAndReschedule,
  onSchedule, onPostpone, onLinkList, onUnlinkList, onNavigateToList, onSaveNewList,
  onSaveAndLinkList, showDate = false, isExpanded = false, onToggle, onPress,
  hidePendingBadge = false, autoMigrationEnabled = false,
}: Props) {
  const { colors, globalStyles } = useTheme();
  const { userId } = useFirebase();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [localSharedWithUid, setLocalSharedWithUid] = useState<string | null>(event.sharedWithUid ?? null);
  useEffect(() => { setLocalSharedWithUid(event.sharedWithUid ?? null); }, [event.sharedWithUid]);

  // Item 3.3 — sync indicator state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Item 3.6 — swipe gesture
  const translateX = useRef(new Animated.Value(0)).current;
  // Mutable ref so PanResponder callbacks always see latest handlers (avoid stale closures)
  const actionsRef = useRef({ handleComplete: () => {}, handleDelete: () => {}, handleReopen: () => {} });

  // D4: fundo direcional — só exibe o painel relevante para a direção do swipe
  const leftPanelOpacity = translateX.interpolate({
    inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const rightPanelOpacity = translateX.interpolate({
    inputRange: [-40, 0], outputRange: [1, 0], extrapolate: 'clamp',
  });

  const linkedList = event.linkedListId ? lists.find(l => l.id === event.linkedListId) : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const isAtrasado = !event.is_pending && !event.is_completed &&
    event.start_time != null && event.start_time.split('T')[0] < todayStr;

  const handleReopenSmart = () => {
    if (event.is_pending) {
      onReopen?.(event.id);
      if (isExpanded) onToggle?.();
      return;
    }
    const isPast = event.start_time && event.start_time.split('T')[0] < todayStr;
    if (autoMigrationEnabled && isPast) {
      Alert.alert(
        t.alerts.reopenEvent,
        t.alerts.reopenEventMsg,
        [
          { text: t.common.cancel, style: 'cancel' },
          { text: t.alerts.moveToPending, onPress: () => { onReopenAsPending?.(event); if (isExpanded) onToggle?.(); } },
          { text: t.alerts.reschedule, onPress: () => { onReopenAndReschedule?.(event); if (isExpanded) onToggle?.(); } },
        ]
      );
    } else {
      onReopen?.(event.id);
      if (isExpanded) onToggle?.();
    }
  };

  const handleComplete = () => {
    if (linkedList && !linkedList.isCompleted) {
      Alert.alert(t.alerts.linkedListPending, t.alerts.linkedListPendingMsg, [{ text: 'OK' }]);
      return;
    }
    onComplete(event.id);
    if (isExpanded) onToggle?.();
  };

  const handleDelete = () => {
    Alert.alert(
      t.alerts.deleteEvent,
      t.alerts.deleteEventMsg(event.title),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.delete, style: 'destructive', onPress: () => onDelete(event.id) },
      ]
    );
  };

  const handleUnlink = () => {
    const previousListId = event.linkedListId;
    onUnlinkList?.(event.id);
    showToast(
      t.toast.unlinked,
      previousListId && onLinkList ? () => onLinkList(event.id, previousListId) : undefined,
    );
  };

  // Keep actionsRef current on every render (avoids stale closures in PanResponder)
  actionsRef.current = { handleComplete, handleDelete, handleReopen: handleReopenSmart };

  // Item 3.6 — PanResponder setup (created once via useRef)
  const isCompletedRef = useRef(event.is_completed);
  useEffect(() => { isCompletedRef.current = event.is_completed; }, [event.is_completed]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy);
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        const { dx } = g;
        const isCompleted = isCompletedRef.current;
        if (dx > 80) {
          Animated.timing(translateX, { toValue: 500, duration: 150, useNativeDriver: true }).start(() => {
            // Dispara a ação antes do reset para evitar race condition com native driver.
            // setValue(0) pode ser perdido em trânsito; Animated.timing garante enfileiramento correto.
            if (isCompleted) {
              actionsRef.current.handleReopen();
            } else {
              actionsRef.current.handleComplete();
            }
            Animated.timing(translateX, { toValue: 0, duration: 100, useNativeDriver: true }).start();
          });
        } else if (dx < -80) {
          Animated.timing(translateX, { toValue: -500, duration: 150, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            actionsRef.current.handleDelete();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const formatCompletedAt = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return { date: `${day}/${month}`, time: `${hh}:${mm}` };
  };

  const formatTime = (startTime: string | null) => {
    if (!startTime) return null;
    const date = new Date(startTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) return t.common.allDay;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDateShort = (startTime: string | null) => {
    if (!startTime) return null;
    const date = new Date(startTime);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const timeStr = formatTime(event.start_time);
  const dateStr = formatDateShort(event.start_time);

  const availableLists = lists.filter(l =>
    !l.isCompleted && !l.isArchived &&
    (!l.linkedEventId || l.linkedEventId === event.id) &&
    (!l.linkedPendingId)
  );

  return (
    <>
      {/* Item 3.6 — Swipe container with background layer */}
      <View style={styles.swipeContainer}>
        {/* Fundo direcional — esquerda = concluir/reabrir, direita = excluir */}
        <View style={styles.swipeBg}>
          <Animated.View style={[
            styles.swipeBgLeft,
            { opacity: leftPanelOpacity, backgroundColor: colors.success },
          ]}>
            <Text style={styles.swipeBgIcon}>{event.is_completed ? '↩' : '✓'}</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeBgRight, { opacity: rightPanelOpacity }]}>
            <Text style={styles.swipeBgIcon}>🗑️</Text>
          </Animated.View>
        </View>

        {/* Animated card — slides over background */}
        <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPress ? onPress(event) : onToggle?.()}
            style={[styles.card, event.is_completed && styles.cardCompleted]}>

            {/* HEADER */}
            <View style={styles.cardHeader}>
              <View style={styles.timeContainer}>
                {event.is_pending && !hidePendingBadge ? (
                  <Text style={styles.pendingBadge}>{t.common.pending}</Text>
                ) : event.is_pending && hidePendingBadge ? (
                  event.completedAt ? (() => {
                    const { date, time } = formatCompletedAt(event.completedAt);
                    return (
                      <>
                        <Text style={styles.completedDateText}>{date}</Text>
                        <Text style={styles.completedTimeText}>{time}</Text>
                      </>
                    );
                  })() : event.createdAt ? (() => {
                    const { date, time } = formatCompletedAt(event.createdAt);
                    return (
                      <>
                        <Text style={styles.createdDateText}>{date}</Text>
                        <Text style={styles.createdTimeText}>{time}</Text>
                      </>
                    );
                  })() : null
                ) : (
                  <>
                    {showDate && dateStr && <Text style={styles.dateText}>{dateStr}</Text>}
                    {timeStr && (
                      <Text style={[styles.timeText, timeStr === t.common.allDay && styles.allDayText]}>
                        {timeStr}
                      </Text>
                    )}
                    {isAtrasado && <Text style={styles.atrasadoBadge}>{t.common.late}</Text>}
                  </>
                )}
              </View>

              <Text style={[styles.title, event.is_completed && styles.titleCompleted]} numberOfLines={isExpanded ? undefined : 1}>
                {event.title}
              </Text>

              {/* Badges à direita: 👥 compartilhamento | 🔗 vínculo */}
              <View style={styles.badgesRow}>
                {(localSharedWithUid || event.isSharedWithMe) && (
                  isSyncing ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ width: 14 }} />
                  ) : (
                    <Text style={[styles.linkedBadge, syncSuccess && { color: colors.success }]}>👥</Text>
                  )
                )}
                {linkedList && onNavigateToList && (
                  <TouchableOpacity
                    onPress={() => onNavigateToList(linkedList.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                    <Text style={styles.linkedBadge}>🔗</Text>
                  </TouchableOpacity>
                )}
                {linkedList && !onNavigateToList && (
                  <Text style={styles.linkedBadge}>🔗</Text>
                )}
              </View>

              {!onPress && <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>}
            </View>

            {/* EXPANDIDO */}
            {!onPress && isExpanded && (
              <View style={styles.expandedContent}>
                {/* NOTAS */}
                {(event.notes ?? []).length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.common.notes}</Text>
                    {(event.notes ?? []).map((note, index) => (
                      <Text key={index} style={styles.noteText}>• {note}</Text>
                    ))}
                  </View>
                )}

                {/* LISTA VINCULADA */}
                {linkedList && (
                  <View style={styles.linkedListContainer}>
                    <View style={styles.linkedListHeader}>
                      <Text style={styles.linkedListLabel}>
                        {linkedList.type === 'tarefas' ? '✅' : '🛒'} {t.common.linkedList}
                      </Text>
                      <View style={[styles.linkedListStatus, linkedList.isCompleted && styles.linkedListStatusDone]}>
                        <Text style={styles.linkedListStatusText}>
                          {linkedList.isCompleted ? t.common.completed : t.common.open}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.linkedListName}>{linkedList.name}</Text>
                    <View style={styles.linkedListActions}>
                      <TouchableOpacity
                        style={styles.linkedListButton}
                        onPress={() => onNavigateToList?.(linkedList.id)}>
                        <Text style={styles.linkedListButtonText}>{t.common.viewList}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* AÇÕES */}
                <View style={styles.actionsGrid}>
                  {event.is_completed ? (
                    /* CONCLUÍDO: 3 botões */
                    <View style={styles.actionsRow}>
                      <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                        <Text style={styles.gridBtnTextDisabled}>{t.common.edit}</Text>
                      </View>
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleDelete}>
                        <Text style={styles.gridBtnText}>{t.common.delete}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnSuccess]} onPress={handleReopenSmart}>
                        <Text style={styles.gridBtnText}>{t.common.reopen}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* ATIVO: 6 botões em 2 linhas */
                    <>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity style={[styles.gridBtn, styles.gridBtnWarning]} onPress={() => onEdit(event)}>
                          <Text style={styles.gridBtnText}>{t.common.edit}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleDelete}>
                          <Text style={styles.gridBtnText}>{t.common.delete}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridBtn, styles.gridBtnSuccess]} onPress={handleComplete}>
                          <Text style={styles.gridBtnText}>{t.common.complete}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.actionsRow}>
                        {event.is_pending && onSchedule ? (
                          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => onSchedule(event)}>
                            <Text style={styles.gridBtnText}>{t.common.schedule}</Text>
                          </TouchableOpacity>
                        ) : !event.is_pending && onPostpone ? (
                          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => onPostpone(event)}>
                            <Text style={styles.gridBtnText}>{t.common.postpone}</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                            <Text style={styles.gridBtnTextDisabled}>—</Text>
                          </View>
                        )}

                        {!event.linkedListId && onLinkList ? (
                          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => setShowLinkModal(true)}>
                            <Text style={styles.gridBtnText}>{t.common.link}</Text>
                          </TouchableOpacity>
                        ) : event.linkedListId && onUnlinkList ? (
                          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={handleUnlink}>
                            <Text style={styles.gridBtnText}>{t.common.unlink}</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                            <Text style={styles.gridBtnTextDisabled}>—</Text>
                          </View>
                        )}

                        {!event.isSharedWithMe ? (
                          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => setShowShareModal(true)}>
                            <Text style={styles.gridBtnText}>
                              {localSharedWithUid ? t.common.unshare : t.common.share}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.gridBtn, styles.gridBtnDanger]}
                            onPress={() => {
                              if (!event.ownerUid) return;
                              Alert.alert(
                                t.alerts.exitShare,
                                t.alerts.exitShareMsg,
                                [
                                  { text: t.common.cancel, style: 'cancel' },
                                  { text: t.alerts.exitShareBtn, style: 'destructive', onPress: () => exitSharedEvent(event.ownerUid!, event.id) },
                                ]
                              );
                            }}>
                            <Text style={styles.gridBtnText}>{t.common.exit}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* MODAL DE COMPARTILHAMENTO */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        currentSharedWithUid={localSharedWithUid}
        onToggle={async (partnerUid, _partnerName, isCurrentlyShared) => {
          if (!userId) return;
          setIsSyncing(true);
          setSyncSuccess(false);
          try {
            if (isCurrentlyShared) {
              await unshareEvent(event, userId);
              setLocalSharedWithUid(null);
              showToast(t.toast.shareDisabled);
            } else {
              await shareEvent({ ...event, sharedWithUid: localSharedWithUid }, userId, partnerUid);
              setLocalSharedWithUid(partnerUid);
              showToast(t.toast.shareEnabled);
            }
          } finally {
            setIsSyncing(false);
            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 1000);
          }
        }}
      />

      {/* CRIAR NOVA LISTA E VINCULAR */}
      <CreateListForm
        visible={showCreateList}
        onClose={() => setShowCreateList(false)}
        onSave={(newList) => {
          onSaveAndLinkList?.(newList, event.id);
          setShowCreateList(false);
          showToast(t.toast.linked);
        }}
        existingLists={lists}
      />

      {/* MODAL VINCULAR LISTA */}
      <Modal visible={showLinkModal} animationType="fade" transparent>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 16 }]}>
              {t.lists.linkModalTitle}
            </Text>

            <TouchableOpacity
              style={styles.createNewButton}
              onPress={() => { setShowLinkModal(false); setShowCreateList(true); }}>
              <Text style={styles.createNewButtonText}>{t.linkList.createNew}</Text>
            </TouchableOpacity>

            {availableLists.length > 0 && (
              <>
                <Text style={styles.orDivider}>{t.linkList.orChoose}</Text>
                <ScrollView style={{ maxHeight: 240 }}>
                  {availableLists.map(list => (
                    <TouchableOpacity
                      key={list.id}
                      style={styles.listOption}
                      onPress={() => {
                        onLinkList?.(event.id, list.id);
                        setShowLinkModal(false);
                        showToast(t.toast.linked);
                      }}>
                      <Text style={styles.listOptionIcon}>
                        {list.type === 'tarefas' ? '✅' : '🛒'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listOptionName}>{list.name}</Text>
                        <Text style={styles.listOptionMeta}>
                          {list.items.length} {list.items.length !== 1 ? t.lists.noneYet : 'item'} • {list.type === 'tarefas' ? t.lists.typeTasks : t.lists.typeShopping}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, { marginTop: 16 }]}
              onPress={() => setShowLinkModal(false)}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
