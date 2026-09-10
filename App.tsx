// ===========================
// APP.TSX — SUPLISTA
// Navegação principal + gerenciamento de estado global
// ===========================

import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';

import { ToastProvider } from './src/components/Toast';
import { useToast } from './src/hooks/useToast';
import { FirebaseProvider, useFirebase } from './src/contexts/FirebaseContext';
import { LanguageProvider, useLanguage } from './src/contexts/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ListsScreen from './src/screens/ListsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { CatalogItem, ListItem, ScreenName, ShoppingList } from './src/types';
import {
  loadCatalog, loadLists, loadSettings, mergeIntoCatalog, saveCatalog, saveLists, seedCatalogFromLists,
} from './src/utils/storage';
import {
  listenToSharedListsWithMe, listenToMySharedLists,
  updateSharedList, deleteSharedListDoc,
} from './src/utils/firestore';
import { initDevLog, logEvent } from './src/dev/devLog';

function AppContent() {
  const { colors, theme } = useTheme();
  const { userId, sharingEnabled } = useFirebase();
  const { t } = useLanguage();
  const { showToast } = useToast();

  // ===========================
  // HELPERS DE SYNC — COMPARTILHAMENTO
  // ===========================
  const syncSharedList = async (list: ShoppingList) => {
    if (!userId) return;
    try {
      if (list.isSharedWithMe && list.ownerUid) {
        // Receptor editando — propaga para o documento do dono
        await updateSharedList(list, list.ownerUid);
        logEvent('SYNC', 'push (receptor)', { id: list.id });
      } else if (!list.isSharedWithMe && list.sharedWithUid) {
        // Dono editando — propaga para o próprio documento
        await updateSharedList(list, userId);
        logEvent('SYNC', 'push (dono)', { id: list.id });
      }
    } catch (err) {
      console.warn('[syncSharedList] falha ao sincronizar lista compartilhada:', err);
      showToast(t.toast.syncError);
    }
  };
  const removeSharedList = async (list: ShoppingList) => {
    if (!userId || list.isSharedWithMe || !list.sharedWithUid) return;
    try { await deleteSharedListDoc(userId, list.id); } catch (err) {
      console.warn('[removeSharedList] falha ao remover documento compartilhado:', err);
    }
  };

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const listsRef = useRef<ShoppingList[]>([]);
  listsRef.current = lists;
  // Controle do efeito de persistência: só grava depois que o boot carregou as
  // listas (senão o `[]` inicial sobrescreveria o storage antes do loadLists),
  // e nunca regrava exatamente o array que acabou de ser lido.
  const listsHydratedRef = useRef(false);
  const hydratedListsRef = useRef<ShoppingList[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const catalogRef = useRef<CatalogItem[]>([]);
  catalogRef.current = catalog;
  const [activeScreen, setActiveScreen] = useState<ScreenName>('listas');
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);

  const [userName, setUserName] = useState('');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null); // null = ainda carregando

  // ===========================
  // INICIALIZAÇÃO
  // ===========================
  useEffect(() => {
    const init = async () => {
      initDevLog();
      const settings = await loadSettings();
      setUserName(settings.displayName ?? '');
      setOnboardingDone(settings.onboardingDone ?? false);
      const loadedLists = await loadLists();
      hydratedListsRef.current = loadedLists; // não regrava o que acabou de ser lido
      listsHydratedRef.current = true;
      setLists(loadedLists);
      let cat = await loadCatalog();
      const seeded = cat.length === 0 && loadedLists.length > 0;
      if (seeded) {
        cat = seedCatalogFromLists(loadedLists);
        saveCatalog(cat);
      }
      setCatalog(cat);
      logEvent('APP', 'init', {
        listas: loadedLists.length,
        itens: loadedLists.reduce((s, l) => s + l.items.length, 0),
        catalogo: cat.length,
        catalogoSemeado: seeded,
        onboarding: settings.onboardingDone ?? false,
      });
    };
    init();
  }, []);

  // ===========================
  // PERSISTÊNCIA — fonte única de escrita das listas
  // ===========================
  // Todo mutador chama só setLists; este efeito grava. Antes o saveLists era
  // chamado de dentro do updater do setState (nos listeners e na faxina), o que
  // é efeito colateral numa função que o React pode reexecutar → escrita dupla.
  useEffect(() => {
    if (!listsHydratedRef.current) return;          // boot ainda não carregou
    if (lists === hydratedListsRef.current) return; // é o próprio valor lido
    saveLists(lists);
  }, [lists]);

  // ===========================
  // LISTENERS: ITENS COMPARTILHADOS COMIGO
  // ===========================
  useEffect(() => {
    if (!userId || !sharingEnabled) return;

    // Listas que outros compartilharam comigo — traz o documento inteiro do Firestore
    const unsubLists = listenToSharedListsWithMe(
      userId,
      (sharedLists) => {
        logEvent('SYNC', 'snapshot: compartilhadas comigo', { docs: sharedLists.length });
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
      },
      () => showToast(t.toast.syncError),
    );

    // Minhas listas compartilhadas (dono) — traz o documento inteiro, para receber
    // em tempo real edições feitas pelo parceiro (itens, nome, notas), não só sharedWithUid.
    const unsubMyLists = listenToMySharedLists(
      userId,
      (sharedLists) => {
        logEvent('SYNC', 'snapshot: minhas compartilhadas', { docs: sharedLists.length });
        setLists(current => {
          const updated = current.map(l => {
            if (l.isSharedWithMe) return l; // essas vêm do outro listener
            const incoming = sharedLists.find(s => s.id === l.id);
            if (!incoming) return l;
            // Preserva estado local de conclusão que ainda não sincronizou com o Firestore.
            if (l.isCompleted && !incoming.isCompleted) {
              return { ...incoming, isSharedWithMe: false as const, isCompleted: true };
            }
            return { ...incoming, isSharedWithMe: false as const };
          });
          return updated;
        });
      },
      () => showToast(t.toast.syncError),
    );

    return () => { unsubLists(); unsubMyLists(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sharingEnabled]);

  // ===========================
  // DESATIVAR COMPARTILHAMENTO — faxina local (regra de ouro)
  // A revogação no servidor acontece em FirebaseContext.setSharingEnabled(false).
  // Aqui: as listas compartilhadas COMIGO somem do estado local e as minhas
  // ficam sem sharedWithUid. Ao religar, nada volta sozinho — só avisamos
  // quantas precisam ser recompartilhadas uma a uma.
  // ===========================
  const prevSharingRef = useRef(sharingEnabled);
  const pendingReshareRef = useRef(0);
  useEffect(() => {
    const was = prevSharingRef.current;
    prevSharingRef.current = sharingEnabled;
    if (was && !sharingEnabled) {
      logEvent('SYNC', 'compartilhamento desativado — faxina local');
      pendingReshareRef.current = listsRef.current.filter(l => l.sharedWithUid || l.isSharedWithMe).length;
      setLists(current => current
        .filter(l => !l.isSharedWithMe)
        .map(l => (l.sharedWithUid ? { ...l, sharedWithUid: null } : l)));
    } else if (!was && sharingEnabled && pendingReshareRef.current > 0) {
      showToast(t.toast.reshareHint(pendingReshareRef.current));
      pendingReshareRef.current = 0;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharingEnabled]);

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
    logEvent('NAV', 'abrir configurações', { de: activeScreen });
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
    setLists([list, ...lists]);
    logEvent('LIST', 'criar', { id: list.id, nome: list.name, tipo: list.type, tag: list.tag_name });
  };

  const handleUpdateList = async (list: ShoppingList) => {
    const prev = lists.find(l => l.id === list.id);
    let stamped = list;
    if (list.isCompleted && !prev?.isCompleted) {
      stamped = { ...list, completedAt: new Date().toISOString() };
    } else if (!list.isCompleted && prev?.isCompleted) {
      stamped = { ...list, completedAt: null };
    }
    setLists(lists.map(l => l.id === list.id ? stamped : l));
    logEvent('LIST', 'update', prev ? {
      id: list.id,
      itens: prev.items.length === list.items.length ? list.items.length : `${prev.items.length}->${list.items.length}`,
      marcados: `${prev.items.filter(i => i.isChecked).length}/${list.items.length}`,
      ...(prev.name !== list.name ? { nome: `"${prev.name}"->"${list.name}"` } : {}),
      ...(prev.isCompleted !== list.isCompleted ? { concluida: list.isCompleted } : {}),
      ...((prev.notes ?? '') !== (list.notes ?? '') ? { notas: (list.notes ?? '').length } : {}),
    } : { id: list.id, semPrev: true });
    await syncSharedList(stamped);
  };

  // Registra itens no catálogo universal (histórico que sobrevive à exclusão de listas).
  const recordItems = async (items: ListItem[], type: 'compras' | 'tarefas') => {
    if (!items.length) return;
    const next = mergeIntoCatalog(catalogRef.current, items, type);
    catalogRef.current = next;
    setCatalog(next);
    await saveCatalog(next);
    logEvent('CATALOG', 'record', { itens: items.length, tipo: type, catalogo: next.length });
  };

  const handleDeleteList = async (id: number) => {
    const list = lists.find(l => l.id === id);
    setLists(lists.filter(l => l.id !== id));
    logEvent('LIST', 'excluir', { id, nome: list?.name, itens: list?.items.length });
    if (list) await removeSharedList(list);
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
            catalog={catalog}
            onSaveList={handleSaveList}
            onUpdateList={handleUpdateList}
            onDeleteList={handleDeleteList}
            onRecordItems={recordItems}
            onOpenSettings={openSettings}
          />
        );
      case 'config':
        return (
          <SettingsScreen
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
