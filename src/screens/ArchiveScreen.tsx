// ===========================
// TELA: ARQUIVO DE LISTAS  (Configurações › Arquivo de Listas)
// ===========================
// Mostra as listas arquivadas como cards (igual à tela inicial), mas SEM abrir:
//   swipe →  recupera (volta à tela principal como concluída)
//   swipe ←  exclui definitivo
// Só o dono arquiva; então aqui nunca aparece lista compartilhada comigo.

import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SwipeRow from '../components/SwipeRow';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors, HEADER_TOP_PADDING } from '../styles/theme';
import { ShoppingList } from '../types';

interface Props {
  lists: ShoppingList[];
  onUnarchive: (id: number) => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  onGoHome: () => void;
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function ArchiveScreen({ lists, onUnarchive, onDelete, onBack, onGoHome }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const archived = useMemo(
    () => lists
      .filter(l => l.isArchived)
      .sort((a, b) => Date.parse(b.archivedAt ?? '') - Date.parse(a.archivedAt ?? '')),
    [lists],
  );

  const confirmDelete = (list: ShoppingList) => {
    Alert.alert(
      t.archive.deleteTitle,
      t.archive.deleteMsg(list.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.delete, style: 'destructive', onPress: () => onDelete(list.id) },
      ],
    );
  };

  return (
    <View style={globalStyles.screen}>
      <View style={globalStyles.header}>
        <TouchableOpacity style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={globalStyles.headerTitle}>{t.archive.title}</Text>
        <Text style={globalStyles.headerSubtitle}>{t.archive.subtitle}</Text>
        <TouchableOpacity style={styles.menuBtn} onPress={onGoHome}>
          <View style={styles.menuBtnBar} />
          <View style={styles.menuBtnBar} />
          <View style={styles.menuBtnBar} />
        </TouchableOpacity>
      </View>

      {archived.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗄️</Text>
          <Text style={styles.emptyTitle}>{t.archive.empty}</Text>
          <Text style={styles.emptyHint}>{t.archive.emptyHint}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {archived.map(list => (
            <SwipeRow
              key={list.id}
              style={{ marginBottom: 10 }}
              rightIcon="↩"
              rightColor={colors.primary}
              leftIcon="🗑️"
              leftColor={colors.danger}
              onSwipeRight={() => onUnarchive(list.id)}
              onSwipeLeft={() => confirmDelete(list)}>
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{list.name}</Text>
                  <Text style={styles.cardMeta}>
                    {t.archive.itemCount(list.items.length)}
                    {list.archivedAt ? ` · ${t.archive.archivedOn(fmtDate(list.archivedAt))}` : ''}
                  </Text>
                </View>
              </View>
            </SwipeRow>
          ))}
          <Text style={styles.hint}>{t.archive.swipeHint}</Text>
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    back: { position: 'absolute', left: 12, top: HEADER_TOP_PADDING + 2, padding: 8, zIndex: 1 },
    backText: { color: 'white', fontSize: 30, fontWeight: '600', lineHeight: 32 },
    menuBtn: { position: 'absolute', right: 20, top: HEADER_TOP_PADDING + 8, padding: 6, gap: 4 },
    menuBtnBar: { width: 22, height: 2.5, borderRadius: 1.5, backgroundColor: 'white' },

    card: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: 0.9,
    },
    cardName: { color: c.textPrimary, fontSize: 15, fontWeight: '600' },
    cardMeta: { color: c.textSecondary, fontSize: 12, marginTop: 3 },

    hint: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { color: c.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyHint: { color: c.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  });
}
