// ===========================
// APP.TSX — SUPLIST
// Navegação principal + gerenciamento de estado global
// ===========================

import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import { ToastProvider } from './src/components/Toast';
import { FirebaseProvider, useFirebase } from './src/contexts/FirebaseContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ListsScreen from './src/screens/ListsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ScreenName, ShoppingList } from './src/types';
import { loadLists, loadSettings, saveLists, saveSettings } from './src/utils/storage';
import {
  listenToSharedListsWithMe, listenToMySharedLists,
  updateSharedList, deleteSharedListDoc,
} from './src/utils/firestore';

function AppContent() {
  const { colors, theme } = useTheme();
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

  const [userName, setUserName] = useState('');
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
      if (settings.birthDate) setBirthDate(settings.birthDate);
      setLists(await loadLists());
    };
    init();
  }, []);

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
      // Desempilha a pilha de telas (sub-telas de ListsScreen registram seus
      // próprios handlers de maior prioridade via LIFO — chegam aqui apenas
      // quando não há mais sub-tela aberta)
      if (screenHistory.length > 0) {
        const prev = screenHistory[screenHistory.length - 1];
        setScreenHistory(h => h.slice(0, -1));
        setActiveScreen(prev);
        return true;
      }
      // Fallback: se por algum motivo não há histórico mas não estamos em 'listas'
      if (activeScreen !== 'listas') {
        setActiveScreen('listas');
        return true;
      }
      // Em 'listas' sem histórico → sai do app
      return false;
    });
    return () => backHandler.remove();
  }, [screenHistory, activeScreen]);

  // ===========================
  // NAVEGAÇÃO
  // ===========================
  const openSettings = () => {
    setScreenHistory(prev => [...prev, activeScreen]);
    setActiveScreen('config');
  };

  // Fecha Configurações e volta para a tela anterior (mesmo efeito do botão físico voltar)
  const closeSettings = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory(h => h.slice(0, -1));
      setActiveScreen(prev);
    } else {
      setActiveScreen('listas');
    }
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
            onSaveList={handleSaveList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
            onOpenSettings={openSettings}
          />
        );
      case 'config':
        return (
          <SettingsScreen
            birthDate={birthDate}
            onSetBirthDate={handleSetBirthDate}
            onChangeUserName={(name) => setUserName(name)}
            onGoHome={closeSettings}
          />
        );
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bgMain },
    content: { flex: 1 },
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
