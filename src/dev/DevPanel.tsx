// ===========================
// DEV — PAINEL DE FERRAMENTAS  (Sobre → Log / Fake user)
// ===========================
// Só é montado sob __DEV__ (ver SettingsScreen: require condicional).
// Textos em pt fixos de propósito: tela de desenvolvimento, nunca entra em release.
// Render condicional em tela cheia (NÃO <Modal> — regra do ScrollView-in-Modal),
// com BackHandler próprio.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  DevSettings,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_TOP_PADDING } from '../styles/theme';
import { loadLists, saveLists } from '../utils/storage';
import { clearLog, getLogCount, getLogText, logEvent } from './devLog';
import { generateFakeData } from './fakeData';

const LISTS_KEY = '@suplista_lists';
const CATALOG_KEY = '@suplista_item_catalog';

type Tab = 'menu' | 'log' | 'report';

interface Props {
  initialTab?: Tab;
  onClose: () => void;
}

const reloadApp = () => {
  try { DevSettings?.reload?.(); } catch { /* fora do Metro */ }
};

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={globalStyles.header}>
      <TouchableOpacity style={styles.back} onPress={onBack}>
        <Text style={styles.backText}>‹ Voltar</Text>
      </TouchableOpacity>
      <Text style={globalStyles.headerTitle}>{title}</Text>
    </View>
  );
}

export default function DevPanel({ initialTab = 'menu', onClose }: Props) {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState('');
  const [logText, setLogText] = useState('');
  const [logCount, setLogCount] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const logScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'menu') { setTab('menu'); return true; }
      onClose();
      return true;
    });
    return () => h.remove();
  }, [tab, onClose]);

  // Atualiza a visão do log enquanto a aba estiver aberta.
  useEffect(() => {
    if (tab !== 'log') return;
    const refresh = () => { setLogText(getLogText(1000)); setLogCount(getLogCount()); };
    refresh();
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, [tab]);

  const flash = useCallback((label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const doCopy = useCallback((text: string, label: string) => {
    Clipboard.setString(text);
    flash(label);
  }, [flash]);

  const doShare = useCallback(async (text: string, title: string) => {
    try { await Share.share({ message: text, title }); } catch { /* cancelado */ }
  }, []);

  // ─── FAKE USER ────────────────────────────────────────────
  const generate = useCallback(async (mode: 'replace' | 'append') => {
    setBusy(true);
    try {
      const baseline = await loadLists();
      const baselineItems = baseline.reduce((s, l) => s + l.items.length, 0);

      const { lists, report: rpt } = generateFakeData({
        baselineLists: baseline.length,
        baselineItems,
      });

      const finalLists = mode === 'append' ? [...lists, ...baseline] : lists;
      await saveLists(finalLists);

      logEvent('DEV', 'fake user gerado', {
        modo: mode,
        listas: lists.length,
        itens: lists.reduce((s, l) => s + l.items.length, 0),
      });
      setReport(rpt);
      setTab('report');
    } catch (e) {
      Alert.alert('Falha ao gerar', String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const onFakeUser = useCallback(async () => {
    const baseline = await loadLists();
    if (baseline.length === 0) { generate('replace'); return; }
    Alert.alert(
      'Já existem listas',
      `Há ${baseline.length} lista(s) armazenada(s). O que fazer?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Anexar', onPress: () => generate('append') },
        { text: 'Substituir', style: 'destructive', onPress: () => generate('replace') },
      ],
    );
  }, [generate]);

  // ─── LIMPAR TUDO ──────────────────────────────────────────
  const onClearAll = useCallback(() => {
    Alert.alert(
      'Limpar tudo?',
      'Apaga TODAS as listas e o catálogo de itens. Mantém tema, idioma e onboarding.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await AsyncStorage.multiRemove([LISTS_KEY, CATALOG_KEY]);
              logEvent('DEV', 'limpar tudo — listas + catálogo removidos');
              Alert.alert('Pronto', 'Recarregue o app para ver o estado limpo.', [
                { text: 'Recarregar agora', onPress: reloadApp },
                { text: 'Depois' },
              ]);
            } catch (e) {
              Alert.alert('Falha', String(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }, []);

  const onClearLog = useCallback(() => {
    Alert.alert('Limpar log?', 'Zera o log em memória e no armazenamento.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar',
        style: 'destructive',
        onPress: async () => {
          await clearLog();
          setLogText(getLogText(1000));
          setLogCount(getLogCount());
        },
      },
    ]);
  }, []);

  // ─── RENDER ───────────────────────────────────────────────
  const back = () => (tab === 'menu' ? onClose() : setTab('menu'));

  if (tab === 'log') {
    return (
      <View style={globalStyles.screen}>
        <PanelHeader title="Log de uso" onBack={back} />
        <Text style={styles.meta}>{logCount} linhas · exibindo as últimas 1000</Text>
        <ScrollView
          ref={logScrollRef}
          style={styles.logBox}
          onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: false })}>
          <Text style={styles.logText}>{logText || '(vazio)'}</Text>
        </ScrollView>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.primary }]} onPress={() => doCopy(getLogText(1000), 'log')}>
            <Text style={styles.actBtnText}>{copied === 'log' ? '✓ Copiado' : 'Copiar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => doShare(getLogText(1000), 'supLista — log')}>
            <Text style={styles.actBtnText}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.danger }]} onPress={onClearLog}>
            <Text style={styles.actBtnText}>Limpar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (tab === 'report') {
    return (
      <View style={globalStyles.screen}>
        <PanelHeader title="Relatório — Fake user" onBack={back} />
        <ScrollView style={styles.logBox} horizontal>
          <ScrollView>
            <Text style={styles.logText}>{report}</Text>
          </ScrollView>
        </ScrollView>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.primary }]} onPress={() => doCopy(report, 'report')}>
            <Text style={styles.actBtnText}>{copied === 'report' ? '✓ Copiado' : 'Copiar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.bgSecondary }]} onPress={() => doShare(report, 'supLista — relatório Fake user')}>
            <Text style={styles.actBtnText}>Compartilhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actBtn, { backgroundColor: colors.success }]} onPress={reloadApp}>
            <Text style={styles.actBtnText}>Recarregar app</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.screen}>
      <PanelHeader title="Ferramentas de DEV" onBack={back} />
      <ScrollView contentContainerStyle={styles.menu}>
        <Text style={styles.warn}>
          Estas ferramentas só existem em builds de desenvolvimento (__DEV__).
        </Text>

        <TouchableOpacity style={[styles.menuBtn, { borderColor: colors.warning }]} onPress={onFakeUser} disabled={busy}>
          <Text style={styles.menuBtnTitle}>👥 Fake user</Text>
          <Text style={styles.menuBtnDesc}>
            Gera ~280 listas e ~4300 itens (1 lista com 1000, 9 com &gt;100, resto ≤10),
            tags preset + personalizadas. Sem compartilhamento.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuBtn, { borderColor: colors.primary }]} onPress={() => setTab('log')} disabled={busy}>
          <Text style={styles.menuBtnTitle}>🐞 Ver log ({getLogCount()})</Text>
          <Text style={styles.menuBtnDesc}>
            Tudo que acontece no app + console.warn/error. Copiar / compartilhar / limpar.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuBtn, { borderColor: colors.danger }]} onPress={onClearAll} disabled={busy}>
          <Text style={styles.menuBtnTitle}>🧹 Limpar tudo</Text>
          <Text style={styles.menuBtnDesc}>
            Apaga listas + catálogo (volta ao baseline). Mantém tema/idioma/onboarding.
          </Text>
        </TouchableOpacity>

        {busy && (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.busyText}>Processando…</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(c: typeof import('../styles/theme').darkColors) {
  return StyleSheet.create({
    back: { position: 'absolute', left: 12, top: HEADER_TOP_PADDING + 4, padding: 8, zIndex: 1 },
    backText: { color: 'white', fontSize: 14, fontWeight: '600' },
    meta: { color: c.textSecondary, fontSize: 12, padding: 10, textAlign: 'center' },
    menu: { padding: 16, gap: 14 },
    warn: { color: c.warning, fontSize: 12, textAlign: 'center', marginBottom: 4 },
    menuBtn: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 16,
      gap: 6,
    },
    menuBtnTitle: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
    menuBtnDesc: { color: c.textSecondary, fontSize: 12, lineHeight: 17 },
    busy: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 12 },
    busyText: { color: c.textSecondary, fontSize: 13 },
    logBox: {
      flex: 1,
      backgroundColor: c.bgInput,
      marginHorizontal: 12,
      marginBottom: 8,
      borderRadius: 8,
      padding: 10,
    },
    logText: { color: c.textPrimary, fontSize: 10, fontFamily: 'monospace', lineHeight: 14 },
    actionRow: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 36 },
    actBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    actBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  });
}
