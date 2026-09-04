// ===========================
// TELA: LISTAS
// ===========================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ShareModal from '../components/ShareModal';
import SwipeRow from '../components/SwipeRow';
import { CreateListForm, ShoppingListScreen } from '../components/ShoppingList';
import { useFirebase } from '../contexts/FirebaseContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';
import { darkColors, HEADER_TOP_PADDING } from '../styles/theme';
import { ShoppingList } from '../types';
import { exitSharedList, shareList, unshareList } from '../utils/firestore';
import { formatHeaderDate } from '../utils/dateUtils';

let hasPlayedAnimation = false;

interface Props {
  userName: string;
  lists: ShoppingList[];
  onSaveList: (list: ShoppingList) => void;
  onUpdateList: (list: ShoppingList) => void;
  onDeleteList: (id: number) => void;
  onOpenSettings?: () => void;
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

    listCard: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      marginBottom: 0, // marginBottom handled by SwipeRow container
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    listCardCompleted: {
      backgroundColor: c.successBg,
      borderColor: c.successBorder,
      opacity: 0.85,
    },
    listCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 8,
    },
    listCardBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    listName: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    listNameCompleted: {
      textDecorationLine: 'line-through',
      color: c.textSecondary,
    },
    listProgressBar: {
      height: 3,
      backgroundColor: c.border,
    },
    listProgressFill: {
      height: 3,
      backgroundColor: c.success,
    },
    listDate: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    listTimeContainer: { minWidth: 52, alignItems: 'center' },
    listCreatedDateText: { color: c.warning, fontSize: 10, fontWeight: '600' },
    listCreatedTimeText: { color: c.warning, fontSize: 10 },
    listCompletedDateText: { color: c.success, fontSize: 10, fontWeight: '600' },
    listCompletedTimeText: { color: c.success, fontSize: 10 },
    listBadgesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    listBadgeIcon: { fontSize: 14 },

    listSupplier: {
      color: c.textSecondary,
      fontSize: 13,
      marginBottom: 8,
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

    listFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    listProgress: {
      color: c.textSecondary,
      fontSize: 12,
    },
    listTotal: {
      color: c.success,
      fontSize: 12,
      fontWeight: '600',
    },

    emptyItems: {
      color: c.textSecondary,
      fontSize: 13,
      fontStyle: 'italic',
      marginTop: 4,
    },

    completedBadge: {
      alignSelf: 'flex-start',
      backgroundColor: c.success + '33',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
    },
    completedBadgeText: {
      color: c.success,
      fontSize: 12,
      fontWeight: '600',
    },

    // Grade de ações da lista
    listActions: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      padding: 14,
      paddingTop: 12,
      gap: 8,
    },
    listActionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    listGridBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listGridBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
    listGridBtnTextDisabled: { color: c.textSecondary, fontSize: 13, fontWeight: '600' },
    listGridBtnNeutral: { backgroundColor: c.bgSecondary },
    listGridBtnPrimary: { backgroundColor: c.primary },
    listGridBtnSuccess: { backgroundColor: c.success },
    listGridBtnDanger: { backgroundColor: c.danger },
    listGridBtnDisabled: { backgroundColor: c.bgSecondary, opacity: 0.4 },

    bodyTitle: {
      color: c.textPrimary,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
      marginTop: 4,
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
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
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
    menuBtn: {
      position: 'absolute',
      right: 20,
      top: HEADER_TOP_PADDING - 2,
      padding: 6,
      gap: 4,
    },
    menuBtnBar: {
      width: 22,
      height: 2.5,
      borderRadius: 1.5,
      backgroundColor: 'white',
    },
    bottomBar: {
      padding: 16,
      paddingBottom: 48,
      backgroundColor: c.bgMain,
    },

    linkedBadge: {
      backgroundColor: c.primary + '22',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    linkedBadgeText: {
      color: c.primary,
      fontSize: 12,
      fontWeight: '500',
    },
  });
}

export default function ListsScreen({ userName, lists, onSaveList, onUpdateList, onDeleteList, onOpenSettings }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t, lang } = useLanguage();
  const { userId } = useFirebase();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [sharingList, setSharingList] = useState<ShoppingList | null>(null);

  // sync indicator state
  const [syncingListId, setSyncingListId] = useState<number | null>(null);
  const [syncSuccessListId, setSyncSuccessListId] = useState<number | null>(null);

  const [animKey, setAnimKey] = useState(0);

  const allDisplayedLists = lists.filter(l => !l.isArchived);
  const completedListsCount = allDisplayedLists.filter(l => l.isCompleted).length;
  const openListsCount = allDisplayedLists.length - completedListsCount;
  const total = allDisplayedLists.length;
  const progressPercent = total > 0 ? Math.round((completedListsCount / total) * 100) : 0;
  const isMantraState = openListsCount === 0;

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

  // BackHandler para ShoppingListScreen — prioridade LIFO: chamado antes do App.tsx
  useEffect(() => {
    if (!selectedList) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedList(null);
      return true;
    });
    return () => handler.remove();
  }, [selectedList]);

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

  const handleDeleteList = (list: ShoppingList) => {
    Alert.alert(
      t.alerts.deleteList,
      t.alerts.deleteListMsg(list.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.delete, style: 'destructive', onPress: () => onDeleteList(list.id) },
      ]
    );
  };

  const handleToggleComplete = (list: ShoppingList) => {
    if (list.isCompleted) {
      onUpdateList({ ...list, isCompleted: false, completedAt: null });
    } else {
      onUpdateList({ ...list, isCompleted: true, completedAt: new Date().toISOString() });
    }
  };

  const formatListTimestamp = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return { date: `${day}/${month}`, time: `${hh}:${mm}` };
  };

  const renderList = (list: ShoppingList) => {
    const checkedCount = list.items.filter(i => i.isChecked).length;
    const progress = list.items.length > 0 ? checkedCount / list.items.length : 0;

    return (
      <SwipeRow
        key={list.id}
        style={{ marginBottom: 10 }}
        rightIcon={list.isCompleted ? '↩' : '✓'}
        rightColor={list.isCompleted ? colors.primary : colors.success}
        leftIcon="🗑️"
        leftColor={colors.danger}
        onSwipeRight={() => handleToggleComplete(list)}
        onSwipeLeft={() => handleDeleteList(list)}
      >
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.listCard, list.isCompleted && styles.listCardCompleted]}
        onPress={() => setSelectedList(list)}>

        {/* HEADER */}
        <View style={styles.listCardHeader}>
          {/* TIMESTAMP à esquerda — amarelo: criação / verde: conclusão */}
          <View style={styles.listTimeContainer}>
            {list.isCompleted && list.completedAt ? (() => {
              const { date, time } = formatListTimestamp(list.completedAt);
              return (
                <>
                  <Text style={styles.listCompletedDateText}>{date}</Text>
                  <Text style={styles.listCompletedTimeText}>{time}</Text>
                </>
              );
            })() : list.createdAt ? (() => {
              const { date, time } = formatListTimestamp(list.createdAt);
              return (
                <>
                  <Text style={styles.listCreatedDateText}>{date}</Text>
                  <Text style={styles.listCreatedTimeText}>{time}</Text>
                </>
              );
            })() : null}
          </View>

          {/* NOME */}
          <Text style={[styles.listName, list.isCompleted && styles.listNameCompleted]} numberOfLines={1}>
            {list.name}
          </Text>

          {/* BADGES à direita, direita→esquerda: tipo | vínculo | partilha */}
          <View style={styles.listBadgesRow}>
            {(list.sharedWithUid || list.isSharedWithMe) && (
              syncingListId === list.id ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ width: 14 }} />
              ) : (
                <Text style={[styles.listBadgeIcon, syncSuccessListId === list.id && { color: colors.success }]}>👥</Text>
              )
            )}
            <Text style={styles.listBadgeIcon}>{list.type === 'tarefas' ? '✅' : '🛒'}</Text>
          </View>
        </View>

        {/* BARRA DE PROGRESSO */}
        {!list.isCompleted && list.items.length > 0 && (
          <View style={styles.listProgressBar}>
            <View style={[styles.listProgressFill, { width: `${progress * 100}%` }]} />
          </View>
        )}
      </TouchableOpacity>
      </SwipeRow>
    );
  };

  const currentList = selectedList ? (lists.find(l => l.id === selectedList.id) || selectedList) : null;

  return (
    <View style={{ flex: 1 }}>
      {currentList ? (
        <ShoppingListScreen
          list={currentList}
          onBack={() => setSelectedList(null)}
          onUpdate={onUpdateList}
          onDelete={onDeleteList}
          allLists={lists.filter(l => !l.isArchived)}
          onNavigateToList={(id) => {
            const target = lists.find(l => l.id === id);
            if (target) setSelectedList(target);
          }}
          onComplete={() => onUpdateList({ ...currentList, isCompleted: true, completedAt: new Date().toISOString() })}
          onReopen={() => onUpdateList({ ...currentList, isCompleted: false, completedAt: null })}
          onShare={() => {
            if (currentList.isSharedWithMe) {
              if (!currentList.ownerUid) return;
              Alert.alert(
                t.alerts.exitShareList,
                t.alerts.exitShareListMsg,
                [
                  { text: t.common.cancel, style: 'cancel' },
                  {
                    text: t.alerts.exitShareBtn,
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await exitSharedList(currentList.ownerUid!, currentList.id);
                      } catch (err: any) {
                        Alert.alert(t.common.error, err?.message ?? t.sharing.errorConnect);
                      }
                    },
                  },
                ]
              );
            } else {
              setSharingList(currentList);
            }
          }}
          isSharedWithMe={currentList.isSharedWithMe}
          sharedWithUid={currentList.sharedWithUid ?? null}
        />
      ) : (
        <View style={globalStyles.screen}>
          {/* HEADER */}
          <Animated.View style={[globalStyles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
            <Text style={globalStyles.headerTitle}>{t.lists.title}</Text>
            <Text style={globalStyles.headerSubtitle}>{formatHeaderDate(new Date(), lang)}</Text>
            {__DEV__ && (
              <TouchableOpacity style={styles.headerResetBtn} onPress={handleReset}>
                <Text style={styles.headerResetText}>RESET</Text>
              </TouchableOpacity>
            )}
            {onOpenSettings && (
              <TouchableOpacity style={styles.menuBtn} onPress={onOpenSettings}>
                <View style={styles.menuBtnBar} />
                <View style={styles.menuBtnBar} />
                <View style={styles.menuBtnBar} />
              </TouchableOpacity>
            )}
          </Animated.View>

          <ScrollView contentContainerStyle={globalStyles.scrollContent}>
            {/* TÍTULO DA SEÇÃO + BARRA */}
            <Animated.View style={{ opacity: eventsOpacity }}>
              <Text style={styles.sectionTitle}>{t.lists.sectionOpen}</Text>
              {total > 0 && (
                <View style={styles.progressBarContainer}>
                  <Animated.View style={[styles.progressBarFill, {
                    width: progressWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                  }]} />
                </View>
              )}
            </Animated.View>

            <Animated.View style={{ opacity: textFadeOpacity }}>
              {/* SAUDAÇÃO — com listas abertas */}
              {!showMantra && (
                <View style={styles.greetingContainer}>
                  <Animated.Text style={[styles.greetingHello, { opacity: greetingOpacity, transform: [{ translateX: greetingX }] }]}>
                    {t.home.greetingHello(userName || '...')}
                  </Animated.Text>
                  <Animated.Text style={[styles.greetingSubtitle, { opacity: subtitleOpacity, transform: [{ translateX: subtitleX }] }]}>
                    {t.lists.greetingSubtitle}
                  </Animated.Text>
                </View>
              )}

              {/* MANTRA — tudo concluído ou lista vazia */}
              {showMantra && (
                <View style={styles.greetingContainer}>
                  <Animated.Text style={[styles.greetingHello, { opacity: greetingOpacity, transform: [{ translateX: greetingX }] }]}>
                    ✅ {t.lists.allDoneTitle}
                  </Animated.Text>
                  <Animated.Text style={[styles.greetingSubtitle, { opacity: subtitleOpacity, transform: [{ translateX: subtitleX }] }]}>
                    {completedListsCount > 0 ? t.lists.allDoneSubtitle : t.lists.emptySubtitle}
                  </Animated.Text>
                </View>
              )}
            </Animated.View>

            {/* LISTAS — ordem estável, sem reorganização ao concluir */}
            <Animated.View style={{ opacity: contentOpacity }}>
              {allDisplayedLists.map(renderList)}
            </Animated.View>

          </ScrollView>

          {/* BOTÃO FIXO INFERIOR */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => setShowCreateForm(true)}>
              <Text style={globalStyles.buttonPrimaryText}>{t.lists.createBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL CRIAR LISTA */}
      <CreateListForm
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSave={(newList) => {
          onSaveList(newList);
          setSelectedList(newList);
          setShowCreateForm(false);
        }}
        existingLists={lists}
      />

      {/* MODAL COMPARTILHAR LISTA */}
      <ShareModal
        visible={sharingList !== null}
        onClose={() => setSharingList(null)}
        currentSharedWithUid={sharingList?.sharedWithUid ?? null}
        onToggle={async (partnerUid, _partnerName, isCurrentlyShared) => {
          if (!sharingList || !userId) return;
          const listId = sharingList.id;
          setSyncingListId(listId);
          setSyncSuccessListId(null);
          try {
            if (isCurrentlyShared) {
              await unshareList(sharingList, userId);
              onUpdateList({ ...sharingList, sharedWithUid: null });
              setSharingList(prev => prev ? { ...prev, sharedWithUid: null } : null);
              showToast(t.toast.shareDisabled);
            } else {
              await shareList(sharingList, userId, partnerUid);
              onUpdateList({ ...sharingList, sharedWithUid: partnerUid });
              setSharingList(prev => prev ? { ...prev, sharedWithUid: partnerUid } : null);
              showToast(t.toast.shareEnabled);
            }
          } finally {
            setSyncingListId(null);
            setSyncSuccessListId(listId);
            setTimeout(() => setSyncSuccessListId(null), 1000);
          }
        }}
      />
    </View>
  );
}
