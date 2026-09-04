// ===========================
// COMPONENTE: CARD DE ROTINA
// ===========================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors } from '../styles/theme';
import { Rotina, RotinaInstance, ShoppingList } from '../types';
import { getRotinaRecurrenceLabel } from '../utils/rotinaUtils';
import { CreateListForm } from './ShoppingList';

interface Props {
  rotina: Rotina;
  instance: RotinaInstance;
  lists: ShoppingList[];
  onEdit: (rotina: Rotina) => void;
  onDelete: (rotinaId: number) => void;
  onComplete: (rotinaId: number, instanceKey: string) => void;
  onUncomplete: (rotinaId: number, instanceKey: string) => void;
  onSuspend: (rotinaId: number) => void;
  onResume: (rotinaId: number) => void;
  onLinkList: (rotinaId: number, instanceKey: string, listId: number) => void;
  onUnlinkList: (rotinaId: number, instanceKey: string) => void;
  onNavigateToList?: (listId: number) => void;
  onSaveNewList?: (list: ShoppingList) => void;
  onSaveAndLinkList?: (list: ShoppingList, rotinaId: number, instanceKey: string) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
  onPress?: (rotina: Rotina, instance: RotinaInstance) => void;
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
    cardSuspended: {
      backgroundColor: '#2a2a3a',
      borderColor: '#4a4a6a',
      opacity: 0.85,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 8,
    },
    leftCol: { minWidth: 52, alignItems: 'center' },
    timeText: { color: c.primary, fontSize: 14, fontWeight: '700' },
    allDayText: { color: c.textSecondary, fontSize: 11, fontWeight: '600' },
    recurrenceLabel: { color: c.textSecondary, fontSize: 10, marginTop: 2, textAlign: 'center' },
    title: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    titleMuted: { color: c.textSecondary },
    suspendedBadgeText: { color: '#9090c0', fontSize: 10 },
    linkedBadge: { fontSize: 14 },
    badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    expandArrow: { color: c.textSecondary, fontSize: 16, paddingHorizontal: 6, paddingVertical: 4 },

    expandedContent: { borderTopWidth: 1, borderTopColor: c.border, padding: 14, paddingTop: 12 },
    section: { marginBottom: 12 },
    sectionTitle: {
      color: c.textSecondary, fontSize: 12, fontWeight: '600',
      marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    noteText: { color: c.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 2 },

    linkedListContainer: {
      backgroundColor: c.bgSecondary, borderRadius: 10, padding: 12,
      marginBottom: 12, borderWidth: 1, borderColor: c.primary + '44',
    },
    linkedListHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    linkedListLabel: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    linkedListStatus: { backgroundColor: c.warning + '33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    linkedListStatusDone: { backgroundColor: c.success + '33' },
    linkedListStatusText: { color: c.textPrimary, fontSize: 11, fontWeight: '600' },
    linkedListName: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 8 },
    linkedListButton: { backgroundColor: c.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
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

    createNewButton: {
      backgroundColor: c.primary, borderRadius: 10,
      paddingVertical: 14, alignItems: 'center', marginBottom: 8,
    },
    createNewButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
    orDivider: { color: c.textSecondary, fontSize: 12, textAlign: 'center', marginVertical: 10 },
    listOption: {
      flexDirection: 'row', alignItems: 'center', padding: 12,
      borderRadius: 8, backgroundColor: c.bgCard, marginBottom: 8, gap: 12,
    },
    listOptionIcon: { fontSize: 20 },
    listOptionName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    listOptionMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  });
}

export default function RoutineCard({
  rotina, instance, lists, onEdit, onDelete, onComplete, onUncomplete, onSuspend, onResume,
  onLinkList, onUnlinkList, onNavigateToList, onSaveNewList, onSaveAndLinkList,
  isExpanded = false, onToggle, onPress,
}: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);

  // Swipe gesture (F2/F3)
  const translateX = useRef(new Animated.Value(0)).current;
  const actionsRef = useRef({ handleComplete: () => {}, handleDelete: () => {}, handleUncomplete: () => {} });

  // Fundo direcional: painel esquerdo (verde ✓) revelado no swipe direita
  const leftPanelOpacity = translateX.interpolate({
    inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp',
  });
  // Painel direito (vermelho 🗑️) revelado no swipe esquerda
  const rightPanelOpacity = translateX.interpolate({
    inputRange: [-40, 0], outputRange: [1, 0], extrapolate: 'clamp',
  });

  // Swipe desabilitado apenas quando suspenso; concluído agora tem swipe de reabrir
  const swipeDisabled = instance.is_suspended;
  const swipeDisabledRef = useRef(swipeDisabled);
  const isCompletedRef = useRef(instance.is_completed);
  useEffect(() => { swipeDisabledRef.current = swipeDisabled; }, [swipeDisabled]);
  useEffect(() => { isCompletedRef.current = instance.is_completed; }, [instance.is_completed]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (swipeDisabledRef.current) return false;
        return Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy);
      },
      onPanResponderMove: (_, g) => { translateX.setValue(g.dx); },
      onPanResponderRelease: (_, g) => {
        if (swipeDisabledRef.current) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          return;
        }
        const { dx } = g;
        const isCompleted = isCompletedRef.current;
        if (dx > 80) {
          Animated.timing(translateX, { toValue: 500, duration: 150, useNativeDriver: true }).start(() => {
            if (isCompleted) {
              actionsRef.current.handleUncomplete();
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

  const linkedList = instance.linkedListId ? lists.find(l => l.id === instance.linkedListId) : null;

  const availableLists = lists.filter(l =>
    !l.isCompleted && !l.isArchived &&
    !l.linkedEventId && !l.linkedPendingId &&
    (!l.linkedRotinaId || (l.linkedRotinaId === instance.rotinaId && l.linkedRotinaInstance === instance.instanceKey))
  );

  const recurrenceLabel = getRotinaRecurrenceLabel(rotina);

  const handleComplete = () => {
    if (linkedList && !linkedList.isCompleted) {
      Alert.alert(t.alerts.routineLinkedListTitle, t.alerts.routineLinkedListMsg, [{ text: 'OK' }]);
      return;
    }
    onComplete(instance.rotinaId, instance.instanceKey);
    if (isExpanded) onToggle?.();
  };

  const handleDelete = () => {
    Alert.alert(
      t.alerts.deleteRoutineTitle,
      t.alerts.deleteRoutineMsg(rotina.title),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.alerts.deleteRoutineConfirmBtn, style: 'destructive',
          onPress: () => Alert.alert(t.alerts.deleteRoutineConfirmTitle, t.alerts.deleteSure, [
            { text: t.common.cancel, style: 'cancel' },
            { text: t.common.delete, style: 'destructive', onPress: () => onDelete(instance.rotinaId) },
          ]),
        },
      ]
    );
  };

  const handleSuspend = () => {
    onSuspend(instance.rotinaId);
  };

  const handleUncomplete = () => {
    onUncomplete(instance.rotinaId, instance.instanceKey);
    if (isExpanded) onToggle?.();
  };

  const handleUnlink = () => {
    Alert.alert(t.alerts.unlinkRoutineList, t.alerts.unlinkRoutineListMsg, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.alerts.unlinkListBtn, onPress: () => onUnlinkList(instance.rotinaId, instance.instanceKey) },
    ]);
  };

  const cardStyle = instance.is_completed
    ? [styles.card, styles.cardCompleted]
    : instance.is_suspended
      ? [styles.card, styles.cardSuspended]
      : [styles.card];

  // Mantém actionsRef atualizado a cada render (evita closures stale no PanResponder)
  actionsRef.current = { handleComplete, handleDelete, handleUncomplete };

  return (
    <>
      {/* Swipe container com camada de fundo */}
      <View style={styles.swipeContainer}>
        {!swipeDisabled && (
          <View style={styles.swipeBg}>
            <Animated.View style={[
              styles.swipeBgLeft,
              { opacity: leftPanelOpacity, backgroundColor: colors.success },
            ]}>
              <Text style={styles.swipeBgIcon}>{instance.is_completed ? '↩' : '✓'}</Text>
            </Animated.View>
            <Animated.View style={[styles.swipeBgRight, { opacity: rightPanelOpacity }]}>
              <Text style={styles.swipeBgIcon}>🗑️</Text>
            </Animated.View>
          </View>
        )}

        <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onPress ? onPress(rotina, instance) : onToggle?.()} style={cardStyle}>
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <View style={styles.leftCol}>
            {instance.time ? (
              <Text style={styles.timeText}>{instance.time}</Text>
            ) : (
              <Text style={styles.allDayText}>{t.common.allDay}</Text>
            )}
          </View>

          <Text
            style={[styles.title, (instance.is_completed || instance.is_suspended) && styles.titleMuted]}
            numberOfLines={isExpanded ? undefined : 1}>
            {instance.title}
          </Text>

          {/* Badges à direita: estado suspenso | 🔗 vínculo */}
          <View style={styles.badgesRow}>
            {instance.is_suspended && (
              <Text style={styles.suspendedBadgeText}>{t.common.suspendedBadge}</Text>
            )}
            {linkedList && <Text style={styles.linkedBadge}>🔗</Text>}
          </View>

          {!onPress && <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>}
        </View>

        {/* EXPANDIDO */}
        {!onPress && isExpanded && (
          <View style={styles.expandedContent}>
            {/* NOTAS */}
            {(instance.notes ?? []).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.common.notes}</Text>
                {(instance.notes ?? []).map((note, i) => (
                  <Text key={i} style={styles.noteText}>• {note}</Text>
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
                {onNavigateToList && (
                  <TouchableOpacity style={styles.linkedListButton} onPress={() => onNavigateToList(linkedList.id)}>
                    <Text style={styles.linkedListButtonText}>{t.common.viewList}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* AÇÕES */}
            <View style={styles.actionsGrid}>
              {instance.is_suspended ? (
                // C1: Instância suspensa — Edit e Delete permanecem ativos; apenas Complete bloqueado
                <>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.gridBtn, styles.gridBtnWarning]} onPress={() => onEdit(rotina)}>
                      <Text style={styles.gridBtnText}>{t.common.edit}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleDelete}>
                      <Text style={styles.gridBtnText}>{t.common.delete}</Text>
                    </TouchableOpacity>
                    <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                      <Text style={styles.gridBtnTextDisabled}>{t.common.complete}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.gridBtn, styles.gridBtnPrimary]}
                      onPress={() => onResume(instance.rotinaId)}>
                      <Text style={styles.gridBtnText}>{t.common.resume}</Text>
                    </TouchableOpacity>
                    <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                      <Text style={styles.gridBtnTextDisabled}>—</Text>
                    </View>
                    <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                      <Text style={styles.gridBtnTextDisabled}>—</Text>
                    </View>
                  </View>
                </>
              ) : (
                // Instância normal (ativa ou concluída)
                <>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.gridBtn, styles.gridBtnWarning]} onPress={() => onEdit(rotina)}>
                      <Text style={styles.gridBtnText}>{t.common.edit}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleDelete}>
                      <Text style={styles.gridBtnText}>{t.common.delete}</Text>
                    </TouchableOpacity>
                    {!instance.is_completed ? (
                      // Ativa: botão Concluir (verde)
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnSuccess]} onPress={handleComplete}>
                        <Text style={styles.gridBtnText}>{t.common.complete}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnSuccess]} onPress={handleUncomplete}>
                        <Text style={styles.gridBtnText}>{t.common.reopen}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.actionsRow}>
                    {!instance.is_completed ? (
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={handleSuspend}>
                        <Text style={styles.gridBtnText}>{t.common.suspend}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                        <Text style={styles.gridBtnTextDisabled}>—</Text>
                      </View>
                    )}

                    {!instance.is_completed && !instance.linkedListId ? (
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => setShowLinkModal(true)}>
                        <Text style={styles.gridBtnText}>{t.common.link}</Text>
                      </TouchableOpacity>
                    ) : !instance.is_completed && instance.linkedListId ? (
                      <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleUnlink}>
                        <Text style={styles.gridBtnText}>{t.common.unlink}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
                        <Text style={styles.gridBtnTextDisabled}>—</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.gridBtn, instance.is_completed ? styles.gridBtnDisabled : styles.gridBtnPrimary]}
                      onPress={() => !instance.is_completed && Alert.alert(t.common.share, t.sharing.comingSoon)}>
                      <Text style={instance.is_completed ? styles.gridBtnTextDisabled : styles.gridBtnText}>
                        {t.common.share}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
        </Animated.View>
      </View>
      {/* fim swipeContainer */}

      {/* CRIAR NOVA LISTA */}
      <CreateListForm
        visible={showCreateList}
        onClose={() => setShowCreateList(false)}
        onSave={(newList) => {
          onSaveAndLinkList?.(newList, instance.rotinaId, instance.instanceKey);
          setShowCreateList(false);
        }}
        existingLists={lists}
      />

      {/* MODAL VINCULAR LISTA */}
      <Modal visible={showLinkModal} animationType="fade" transparent>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 16 }]}>
              {t.linkList.title}
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
                      onPress={() => { onLinkList(instance.rotinaId, instance.instanceKey, list.id); setShowLinkModal(false); }}>
                      <Text style={styles.listOptionIcon}>{list.type === 'tarefas' ? '✅' : '🛒'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listOptionName}>{list.name}</Text>
                        <Text style={styles.listOptionMeta}>{list.items.length} itens</Text>
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
