// ===========================
// TELA: DETALHE DE TAREFA (Pendência / Compromisso / Rotina)
// ===========================

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CreateListForm } from '../components/ShoppingList';
import ShareModal from '../components/ShareModal';
import { useFirebase } from '../contexts/FirebaseContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';
import { darkColors } from '../styles/theme';
import { Event, Rotina, RotinaInstance, ShoppingList } from '../types';
import { exitSharedEvent, shareEvent, unshareEvent } from '../utils/firestore';
import { formatHeaderDate } from '../utils/dateUtils';

type ItemType = 'pending' | 'event' | 'rotina';

interface Props {
  itemType: ItemType;

  // Event / Pending
  event?: Event;

  // Rotina
  rotina?: Rotina;
  instance?: RotinaInstance;

  lists: ShoppingList[];
  onBack: () => void;

  // Event / Pending handlers
  onEdit?: () => void;
  onDelete?: () => void;
  onComplete?: () => void;
  onReopen?: () => void;
  onSchedule?: () => void;
  onPostpone?: () => void;
  onLinkList?: (listId: number) => void;
  onUnlinkList?: () => void;
  onSaveNewList?: (list: ShoppingList) => void;
  onSaveAndLinkList?: (list: ShoppingList) => void;
  onNavigateToList?: (listId: number) => void;
  onSaveNotes?: (notes: string[]) => void;
  autoMigrationEnabled?: boolean;
  onReopenAsPending?: () => void;
  onReopenAndReschedule?: () => void;
  onShareUpdate?: (sharedWithUid: string | null) => void;
  onExitSharedEvent?: (eventId: number) => void;

  // Rotina handlers
  onEditRotina?: (rotina: Rotina) => void;
  onDeleteRotina?: () => void;
  onCompleteRotina?: () => void;
  onUncompleteRotina?: () => void;
  onSuspendRotina?: () => void;
  onResumeRotina?: () => void;
  onLinkListToRotina?: (listId: number) => void;
  onUnlinkListFromRotina?: () => void;
  onSaveNewListToRotina?: (list: ShoppingList) => void;
  onSaveAndLinkListToRotina?: (list: ShoppingList) => void;
  onSaveRotinaInstanceNotes?: (notes: string[]) => void;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bgMain },
    contentFlex: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

    sectionTitle: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 4,
    },

    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tagBadge: {
      backgroundColor: c.primary + '33',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: { color: c.primary, fontSize: 12, fontWeight: '600' },

    linkedListCard: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.primary + '44',
    },
    linkedListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    linkedListLabel: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
    linkedListStatus: {
      backgroundColor: c.warning + '33',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    linkedListStatusDone: { backgroundColor: c.success + '33' },
    linkedListStatusText: { color: c.textPrimary, fontSize: 11, fontWeight: '600' },
    linkedListName: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 8 },
    linkedListViewBtn: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 7,
      paddingHorizontal: 14,
      alignSelf: 'flex-start',
    },
    linkedListViewBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },

    notesInput: {
      backgroundColor: c.bgCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
      padding: 14,
      textAlignVertical: 'top',
    },

    // Bottom container (holds gridPanel + bottomBar)
    bottomContainer: {
      backgroundColor: c.bgMain,
    },
    gridPanel: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 8,
    },
    bottomBar: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      padding: 16,
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

    actionsRow: { flexDirection: 'row', gap: 8 },
    gridBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridBtnText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    gridBtnTextDisabled: { color: c.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    gridBtnPrimary: { backgroundColor: c.primary },
    gridBtnSuccess: { backgroundColor: c.success },
    gridBtnDanger: { backgroundColor: c.danger },
    gridBtnWarning: { backgroundColor: c.warning },
    gridBtnDisabled: { backgroundColor: c.bgSecondary, opacity: 0.4 },

    // Link modal
    createNewButton: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 8,
    },
    createNewButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
    orDivider: { color: c.textSecondary, fontSize: 12, textAlign: 'center', marginVertical: 10 },
    listOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: c.bgCard,
      marginBottom: 8,
      gap: 12,
    },
    listOptionIcon: { fontSize: 20 },
    listOptionName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    listOptionMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  });
}

export default function TaskDetailScreen({
  itemType, event, rotina, instance, lists, onBack,
  onEdit, onDelete, onComplete, onReopen,
  onSchedule, onPostpone,
  onLinkList, onUnlinkList, onSaveNewList, onSaveAndLinkList, onNavigateToList, onSaveNotes,
  autoMigrationEnabled, onReopenAsPending, onReopenAndReschedule, onShareUpdate, onExitSharedEvent,
  onEditRotina, onDeleteRotina, onCompleteRotina, onUncompleteRotina,
  onSuspendRotina, onResumeRotina,
  onLinkListToRotina, onUnlinkListFromRotina, onSaveNewListToRotina, onSaveAndLinkListToRotina,
  onSaveRotinaInstanceNotes,
}: Props) {
  const { colors, globalStyles } = useTheme();
  const { t, lang } = useLanguage();
  const { userId } = useFirebase();
  const { showToast } = useToast();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { height: windowHeight } = useWindowDimensions();

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [localSharedWithUid, setLocalSharedWithUid] = useState<string | null>(
    event?.sharedWithUid ?? null
  );
  useEffect(() => {
    setLocalSharedWithUid(event?.sharedWithUid ?? null);
  }, [event?.sharedWithUid]);

  // Notes
  const initialNotes = itemType === 'rotina'
    ? (instance?.notes ?? []).join('\n')
    : (event?.notes ?? []).join('\n');
  const [notesText, setNotesText] = useState(initialNotes);
  const notesRef = useRef(notesText);
  notesRef.current = notesText;
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Back handler
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  const saveNotes = () => {
    const raw = notesRef.current.trim();
    const notes = raw.length === 0 ? [] : raw.split('\n');
    if (itemType === 'rotina') {
      onSaveRotinaInstanceNotes?.(notes);
    } else {
      onSaveNotes?.(notes);
    }
  };

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    notesRef.current = text;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const raw = text.trim();
      const notes = raw.length === 0 ? [] : raw.split('\n');
      if (itemType === 'rotina') {
        onSaveRotinaInstanceNotes?.(notes);
      } else {
        onSaveNotes?.(notes);
      }
    }, 600);
  };

  const handleBack = () => {
    saveNotes();
    onBack();
  };

  const handleReopenEvent = () => {
    if (itemType === 'rotina') {
      saveNotes();
      onUncompleteRotina?.();
      return;
    }
    if (itemType === 'pending' || !event) {
      saveNotes();
      onReopen?.();
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const isPast = event.start_time && event.start_time.split('T')[0] < todayStr;
    if (autoMigrationEnabled && isPast && onReopenAsPending && onReopenAndReschedule) {
      Alert.alert(
        t.alerts.reopenEvent,
        t.alerts.reopenEventMsg,
        [
          { text: t.common.cancel, style: 'cancel' },
          { text: t.alerts.moveToPending, onPress: () => { saveNotes(); onReopenAsPending(); onBack(); } },
          { text: t.alerts.reschedule, onPress: () => { saveNotes(); onReopenAndReschedule(); onBack(); } },
        ]
      );
    } else {
      saveNotes();
      onReopen?.();
    }
  };

  const handleCompleteAction = () => {
    if (itemType === 'rotina') {
      const linkedId = instance?.linkedListId;
      if (linkedId) {
        const linked = lists.find(l => l.id === linkedId);
        if (linked && !linked.isCompleted) {
          Alert.alert(t.alerts.routineLinkedListTitle, t.alerts.routineLinkedListMsg, [{ text: 'OK' }]);
          return;
        }
      }
      saveNotes();
      onCompleteRotina?.();
    } else {
      const linkedId = event?.linkedListId;
      if (linkedId) {
        const linked = lists.find(l => l.id === linkedId);
        if (linked && !linked.isCompleted) {
          Alert.alert(t.alerts.linkedListPending, t.alerts.linkedListPendingMsg, [{ text: 'OK' }]);
          return;
        }
      }
      saveNotes();
      onComplete?.();
    }
  };

  const handleDeleteAction = () => {
    const title = itemType === 'rotina'
      ? rotina?.title ?? ''
      : event?.title ?? '';
    Alert.alert(
      t.alerts.deleteEvent,
      t.alerts.deleteEventMsg(title),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete, style: 'destructive',
          onPress: () => {
            if (itemType === 'rotina') {
              onDeleteRotina?.();
            } else {
              onDelete?.();
            }
            onBack();
          },
        },
      ]
    );
  };

  const handleUnlink = () => {
    if (itemType === 'rotina') {
      Alert.alert(t.alerts.unlinkRoutineList, t.alerts.unlinkRoutineListMsg, [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.alerts.unlinkListBtn, onPress: () => onUnlinkListFromRotina?.() },
      ]);
    } else {
      onUnlinkList?.();
      showToast(t.toast.unlinked);
    }
  };

  const availableLists = lists.filter(l => {
    if (l.isCompleted || l.isArchived) return false;
    if (itemType === 'rotina') {
      return !l.linkedEventId && !l.linkedPendingId &&
        (!l.linkedRotinaId || (l.linkedRotinaId === instance?.rotinaId && l.linkedRotinaInstance === instance?.instanceKey));
    }
    return (!l.linkedEventId || l.linkedEventId === event?.id) && !l.linkedPendingId;
  });

  const linkedListId = itemType === 'rotina' ? instance?.linkedListId : event?.linkedListId;
  const linkedList = linkedListId ? lists.find(l => l.id === linkedListId) : null;

  const title = itemType === 'rotina' ? (instance?.title ?? '') : (event?.title ?? '');
  const tag = itemType === 'rotina' ? (instance?.tag_name ?? '') : (event?.tag_name ?? '');
  const isCompleted = itemType === 'rotina' ? (instance?.is_completed ?? false) : (event?.is_completed ?? false);
  const isSuspended = itemType === 'rotina' ? (instance?.is_suspended ?? false) : false;

  const typeLabel = itemType === 'pending'
    ? t.common.detailPending
    : itemType === 'event'
      ? t.common.detailEvent
      : t.common.detailRotina;

  // Subtítulo do header: data formatada (igual EventsScreen) para compromissos e rotinas
  const headerSubtitle = (() => {
    if (itemType === 'rotina') {
      if (instance?.date) {
        return formatHeaderDate(new Date(instance.date + 'T12:00:00'), lang);
      }
      return typeLabel;
    }
    if (itemType === 'event') {
      const iso = event?.start_time ?? (isCompleted ? event?.completedAt : null);
      if (iso) {
        return formatHeaderDate(new Date(iso), lang);
      }
      return typeLabel;
    }
    // pending — mostra data atual
    return formatHeaderDate(new Date(), lang);
  })();

  // ===== ACTION GRID BUTTONS =====

  const renderTopRow = () => {
    if (itemType === 'rotina') {
      return (
        <View style={styles.actionsRow}>
          {!isCompleted ? (
            isSuspended ? (
              <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => onResumeRotina?.()}>
                <Text style={styles.gridBtnText}>{t.common.resume}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => onSuspendRotina?.()}>
                <Text style={styles.gridBtnText}>{t.common.suspend}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
              <Text style={styles.gridBtnTextDisabled}>—</Text>
            </View>
          )}

          {!isCompleted && !isSuspended ? (
            linkedListId ? (
              <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={handleUnlink}>
                <Text style={styles.gridBtnText}>{t.common.unlink}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => setShowLinkModal(true)}>
                <Text style={styles.gridBtnText}>{t.common.linkShort}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
              <Text style={styles.gridBtnTextDisabled}>—</Text>
            </View>
          )}

          {!isCompleted && !isSuspended ? (
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]}
              onPress={() => Alert.alert(t.common.share, t.sharing.comingSoon)}>
              <Text style={styles.gridBtnText}>{t.common.share}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
              <Text style={styles.gridBtnTextDisabled}>—</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.actionsRow}>
        {!isCompleted ? (
          itemType === 'pending' && onSchedule ? (
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => { saveNotes(); onSchedule(); }}>
              <Text style={styles.gridBtnText}>{t.common.schedule}</Text>
            </TouchableOpacity>
          ) : itemType === 'event' && onPostpone ? (
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => { saveNotes(); onPostpone(); }}>
              <Text style={styles.gridBtnText}>{t.common.postpone}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
              <Text style={styles.gridBtnTextDisabled}>—</Text>
            </View>
          )
        ) : (
          <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
            <Text style={styles.gridBtnTextDisabled}>—</Text>
          </View>
        )}

        {!isCompleted ? (
          linkedListId && onUnlinkList ? (
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={handleUnlink}>
              <Text style={styles.gridBtnText}>{t.common.unlink}</Text>
            </TouchableOpacity>
          ) : !linkedListId && onLinkList ? (
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => setShowLinkModal(true)}>
              <Text style={styles.gridBtnText}>{t.common.linkShort}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
              <Text style={styles.gridBtnTextDisabled}>—</Text>
            </View>
          )
        ) : (
          <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
            <Text style={styles.gridBtnTextDisabled}>—</Text>
          </View>
        )}

        {!isCompleted && !event?.isSharedWithMe ? (
          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={() => setShowShareModal(true)}>
            <Text style={styles.gridBtnText}>
              {localSharedWithUid ? t.common.unshare : t.common.share}
            </Text>
          </TouchableOpacity>
        ) : !isCompleted && event?.isSharedWithMe ? (
          <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]}
            onPress={() => {
              if (!event?.ownerUid) return;
              Alert.alert(t.alerts.exitShare, t.alerts.exitShareMsg, [
                { text: t.common.cancel, style: 'cancel' },
                {
                  text: t.alerts.exitShareBtn, style: 'destructive', onPress: async () => {
                    await exitSharedEvent(event.ownerUid!, event.id);
                    onExitSharedEvent?.(event.id);
                    onBack();
                  },
                },
              ]);
            }}>
            <Text style={styles.gridBtnText}>{t.common.exit}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
            <Text style={styles.gridBtnTextDisabled}>—</Text>
          </View>
        )}
      </View>
    );
  };

  const renderBottomRow = () => (
    <View style={styles.actionsRow}>
      {!isCompleted ? (
        <TouchableOpacity
          style={[styles.gridBtn, styles.gridBtnWarning]}
          onPress={() => {
            saveNotes();
            if (itemType === 'rotina') {
              onEditRotina?.(rotina!);
            } else {
              onEdit?.();
            }
          }}>
          <Text style={styles.gridBtnText}>{t.common.edit}</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
          <Text style={styles.gridBtnTextDisabled}>{t.common.edit}</Text>
        </View>
      )}

      {event?.isSharedWithMe ? (
        <View style={[styles.gridBtn, styles.gridBtnDisabled]}>
          <Text style={styles.gridBtnTextDisabled}>—</Text>
        </View>
      ) : (
        <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleDeleteAction}>
          <Text style={styles.gridBtnText}>{t.common.delete}</Text>
        </TouchableOpacity>
      )}

      {!isCompleted ? (
        <TouchableOpacity style={[styles.gridBtn, isSuspended ? styles.gridBtnDisabled : styles.gridBtnSuccess]}
          disabled={isSuspended}
          onPress={handleCompleteAction}>
          <Text style={isSuspended ? styles.gridBtnTextDisabled : styles.gridBtnText}>{t.common.complete}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.gridBtn, styles.gridBtnSuccess]} onPress={handleReopenEvent}>
          <Text style={styles.gridBtnText}>{t.common.reopen}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header: nome do item como título, tipo + data como subtítulo */}
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle} numberOfLines={1}>{title}</Text>
        <Text style={globalStyles.headerSubtitle}>{headerSubtitle}</Text>
      </View>

      {/* Conteúdo — flex preenche o espaço entre header e barra inferior */}
      <View style={styles.contentFlex}>
        <Text style={styles.sectionTitle}>{t.common.notes.toUpperCase()}</Text>

        {tag && tag !== 'Geral' && (
          <View style={styles.tagRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{t.tags[tag as keyof typeof t.tags] ?? tag}</Text>
            </View>
          </View>
        )}

        {linkedList && (
          <View style={styles.linkedListCard}>
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
              <TouchableOpacity style={styles.linkedListViewBtn} onPress={() => { onNavigateToList(linkedList.id); onBack(); }}>
                <Text style={styles.linkedListViewBtnText}>{t.common.viewList}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TextInput
          style={[styles.notesInput, {
            flex: 1,
            // maxHeight impede o TextInput multiline no Android de crescer além do espaço
            // alocado pelo flex, o que empurraria a grade e o botão Voltar para fora da tela.
            // header (~125) + paddingTop+sectionTitle (~45) + bottomContainer (~200 c/ grade, ~88 sem)
            maxHeight: Math.max(150, windowHeight - 375),
          }]}
          value={notesText}
          onChangeText={handleNotesChange}
          onBlur={saveNotes}
          multiline
          placeholder={t.common.notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          editable={!isCompleted}
          textAlignVertical="top"
        />
      </View>

      {/* Bottom container: grade de ações + separador + botão voltar */}
      <View style={styles.bottomContainer}>
        <View style={styles.gridPanel}>
          {renderTopRow()}
          {renderBottomRow()}
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>{t.home.altBack}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Share modal */}
      {event && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          currentSharedWithUid={localSharedWithUid}
          onToggle={async (partnerUid, _partnerName, isCurrentlyShared) => {
            if (!userId || !event) return;
            try {
              if (isCurrentlyShared) {
                await unshareEvent(event, userId);
                setLocalSharedWithUid(null);
                onShareUpdate?.(null);
                showToast(t.toast.shareDisabled);
              } else {
                await shareEvent({ ...event, sharedWithUid: localSharedWithUid }, userId, partnerUid);
                setLocalSharedWithUid(partnerUid);
                onShareUpdate?.(partnerUid);
                showToast(t.toast.shareEnabled);
              }
            } catch (err: any) {
              showToast(t.common.error);
              console.error('[ShareModal onToggle]', err);
            }
          }}
        />
      )}

      {/* Create list form */}
      <CreateListForm
        visible={showCreateList}
        onClose={() => setShowCreateList(false)}
        onSave={(newList) => {
          if (itemType === 'rotina') {
            onSaveAndLinkListToRotina?.(newList);
          } else {
            onSaveAndLinkList?.(newList);
          }
          setShowCreateList(false);
          showToast(t.toast.linked);
        }}
        existingLists={lists}
      />

      {/* Link modal */}
      <Modal visible={showLinkModal} animationType="fade" transparent onRequestClose={() => setShowLinkModal(false)}>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 16 }]}>
              {t.lists.linkModalTitle}
            </Text>
            <TouchableOpacity style={styles.createNewButton}
              onPress={() => { setShowLinkModal(false); setShowCreateList(true); }}>
              <Text style={styles.createNewButtonText}>{t.linkList.createNew}</Text>
            </TouchableOpacity>
            {availableLists.length > 0 && (
              <>
                <Text style={styles.orDivider}>{t.linkList.orChoose}</Text>
                <ScrollView style={{ maxHeight: 240 }}>
                  {availableLists.map(list => (
                    <TouchableOpacity key={list.id} style={styles.listOption}
                      onPress={() => {
                        if (itemType === 'rotina') {
                          onLinkListToRotina?.(list.id);
                        } else {
                          onLinkList?.(list.id);
                        }
                        setShowLinkModal(false);
                        showToast(t.toast.linked);
                      }}>
                      <Text style={styles.listOptionIcon}>{list.type === 'tarefas' ? '✅' : '🛒'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listOptionName}>{list.name}</Text>
                        <Text style={styles.listOptionMeta}>
                          {list.items.length} {t.lists.noneYet} · {list.type === 'tarefas' ? t.lists.typeTasks : t.lists.typeShopping}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 16 }]}
              onPress={() => setShowLinkModal(false)}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
