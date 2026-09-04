// ===========================
// APP.TSX — SUPLIST
// Navegação principal + gerenciamento de estado global
// ===========================

import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import SearchModal from './src/components/SearchModal';
import { ToastProvider } from './src/components/Toast';
import { FirebaseProvider, useFirebase } from './src/contexts/FirebaseContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ListsScreen from './src/screens/ListsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ScreenName, ShoppingList } from './src/types';
import { cleanupCompletedLists } from './src/utils/migrationUtils';
import {
  loadLists, loadSettings, saveLists, saveSettings,
  DeleteAfterPolicy,
} from './src/utils/storage';
import {
  listenToSharedListsWithMe, listenToMySharedLists,
  updateSharedList, deleteSharedListDoc,
} from './src/utils/firestore';

const NAVBAR_BOTTOM_PADDING = Platform.OS === 'android' ? 48 : 8;

function AppContent() {
  const { colors, globalStyles, theme } = useTheme();
  const { t } = useLanguage();
  const { userId, sharingEnabled } = useFirebase();

  // ===========================
  // HELPERS DE SYNC — COMPARTILHAMENTO
  // ===========================
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
  const removeSharedList = async (list: ShoppingList) => {
    if (!userId || list.isSharedWithMe || !list.sharedWithUid) return;
    try { await deleteSharedListDoc(userId, list.id); } catch {}
  };

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('listas');
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);
  const [listsResetKey, setListsResetKey] = useState(0);

  const [showSearch, setShowSearch] = useState(false);
  const [navigateToListId, setNavigateToListId] = useState<number | undefined>(undefined);
  const [userName, setUserName] = useState('');
  const [deleteCompletedListsAfter, setDeleteCompletedListsAfter] = useState<DeleteAfterPolicy>('never');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null); // null = ainda carregando
  const [birthDate, setBirthDate] = useState('');

  // ===========================
  // INICIALIZAÇÃO
  // ===========================
  useEffect(() => {
    const init = async () => {
      const settings = await loadSettings();
      setUserName(settings.displayName ?? '');
      setOnboardingDone(settings.onboardingDone ?? false);
      if (settings.deleteCompletedListsAfter) setDeleteCompletedListsAfter(settings.deleteCompletedListsAfter);
      if (settings.birthDate) setBirthDate(settings.birthDate);

      const loadedLists = await loadLists();
      const processedLists = cleanupCompletedLists(loadedLists, settings);
      if (JSON.stringify(processedLists) !== JSON.stringify(loadedLists)) {
        await saveLists(processedLists);
      }
      setLists(processedLists);
    };
    init();
  }, []);

  // ─── Recarrega todos os dados após restore de backup ─────────────────────
  const reloadAllData = async () => {
    const settings = await loadSettings();
    setUserName(settings.displayName ?? '');
    if (settings.deleteCompletedListsAfter) setDeleteCompletedListsAfter(settings.deleteCompletedListsAfter);
    if (settings.birthDate) setBirthDate(settings.birthDate);
    setLists(await loadLists());
  };

  // ===========================
  // LISTENERS: ITENS COMPARTILHADOS COMIGO
  // ===========================
  useEffect(() => {
    if (!userId || !sharingEnabled) return;

    // Listas que outros compartilharam comigo
    const unsubLists = listenToSharedListsWithMe(userId, (sharedLists) => {
      setLists(current => {
        const mine = current.filter(l => !l.isSharedWithMe);
        const merged = sharedLists.map(incoming => {
          // Preserva estado local de conclusão que ainda não sincronizou com o Firestore.
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

    // Minhas listas compartilhadas — mantém sharedWithUid sincronizado no estado local
    const unsubMyLists = listenToMySharedLists(userId, (updates) => {
      setLists(current => current.map(l => {
        const u = updates.find(x => x.id === l.id);
        return u ? { ...l, sharedWithUid: u.sharedWithUid } : l;
      }));
    });

    return () => { unsubLists(); unsubMyLists(); };
  }, [userId, sharingEnabled]);

  // BackHandler global — pilha de navegação: sub-telas das screens → screens → sai só de 'listas'
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // 1. Modais têm prioridade máxima
      if (showSearch) { setShowSearch(false); return true; }
      // 2. Desempilha a pilha de telas (sub-telas de ListsScreen registram seus
      //    próprios handlers de maior prioridade via LIFO — chegam aqui apenas
      //    quando não há mais sub-tela aberta)
      if (screenHistory.length > 0) {
        const prev = screenHistory[screenHistory.length - 1];
        setScreenHistory(h => h.slice(0, -1));
        setActiveScreen(prev);
        return true;
      }
      // 3. Fallback: se por algum motivo não há histórico mas não estamos em 'listas'
      if (activeScreen !== 'listas') {
        setActiveScreen('listas');
        return true;
      }
      // 4. Em 'listas' sem histórico → sai do app
      return false;
    });
    return () => backHandler.remove();
  }, [showSearch, screenHistory, activeScreen]);

  // ===========================
  // NAVEGAÇÃO
  // ===========================
  const handleNavPress = (screen: ScreenName) => {
    if (screen === activeScreen) {
      // Botão da tela atual: reseta sub-views (volta à raiz da tela)
      if (screen === 'listas') setListsResetKey(k => k + 1);
      return;
    }
    setScreenHistory(prev => [...prev, activeScreen]);
    setActiveScreen(screen);
    if (screen !== 'listas') setNavigateToListId(undefined);
  };

  // Navega para a tela de Listas abrindo uma lista específica, registrando o histórico
  const navigateToListScreen = (listId: number) => {
    setNavigateToListId(listId);
    setScreenHistory(prev => [...prev, activeScreen]);
    setActiveScreen('listas');
  };

  // ===========================
  // LISTAS — CRUD
  // ===========================
  const handleSaveList = async (list: ShoppingList) => {
    const updated = [list, ...lists];
    setLists(updated);
    await saveLists(updated);
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
  // CONFIGURAÇÕES
  // ===========================
  const handleClearData = async (opts: { lists: boolean; archivedLists: boolean }) => {
    let newLists = lists;
    if (opts.lists && opts.archivedLists) {
      newLists = [];
    } else if (opts.lists) {
      newLists = newLists.filter(l => l.isArchived);
    } else if (opts.archivedLists) {
      newLists = newLists.filter(l => !l.isArchived);
    }
    setLists(newLists);
    await saveLists(newLists);
  };

  const handleSetDeleteCompletedListsAfter = async (policy: DeleteAfterPolicy) => {
    setDeleteCompletedListsAfter(policy);
    await saveSettings({ deleteCompletedListsAfter: policy });
  };

  const handleSetBirthDate = async (date: string) => {
    setBirthDate(date);
    await saveSettings({ birthDate: date });
  };

  // ===========================
  // RENDER TELA ATIVA
  // ===========================
  const renderScreen = () => {
    switch (activeScreen) {
      case 'listas':
        return (
          <ListsScreen
            userName={userName}
            lists={lists}
            initialListId={navigateToListId}
            onSaveList={handleSaveList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
            onSearch={() => setShowSearch(true)}
            resetKey={listsResetKey}
          />
        );
      case 'config':
        return (
          <SettingsScreen
            onClearData={handleClearData}
            lists={lists}
            onDeleteList={handleDeleteList}
            deleteCompletedListsAfter={deleteCompletedListsAfter}
            onSetDeleteCompletedListsAfter={handleSetDeleteCompletedListsAfter}
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
  const NAV_ITEMS: { key: ScreenName; label: string; icon: string }[] = [
    { key: 'listas', label: t.nav.listas, icon: '📝' },
    { key: 'config', label: t.nav.config, icon: '⚙️' },
  ];

  const styles = React.useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgMain },
    content: { flex: 1 },
    navIcon: { fontSize: 22 },
  }), [colors]);

  // Aguarda verificação inicial — evita flash
  if (onboardingDone === null) return null;

  const statusBarStyle = theme === 'claro' ? 'dark-content' : 'light-content';

  // Onboarding na primeira abertura
  if (!onboardingDone) {
    const handleOnboardingDone = async () => {
      const settings = await loadSettings();
      setUserName(settings.displayName ?? '');
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
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[globalStyles.navLabel, isActive && globalStyles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MODAL DE BUSCA */}
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        lists={lists}
        onSelectList={(list) => navigateToListScreen(list.id)}
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
