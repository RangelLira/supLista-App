// ===========================
// COMPONENTE: MODAL DE BUSCA GLOBAL
// ===========================

import React, { useMemo, useState, useEffect } from 'react';
import {
  BackHandler,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors } from '../styles/theme';
import { ShoppingList } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  lists: ShoppingList[];
  onSelectList: (list: ShoppingList) => void;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgMain },

    searchBar: {
      backgroundColor: c.bgInput,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: {
      color: 'white',
      fontSize: 22,
      fontWeight: '600',
      marginBottom: 12,
      textAlign: 'center',
    },
    searchInput: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      padding: 14,
      color: 'white',
      fontSize: 16,
    },

    resultsCount: {
      color: c.textSecondary,
      fontSize: 13,
      marginBottom: 16,
      textAlign: 'center',
    },

    sectionTitle: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 4,
    },

    resultCard: {
      backgroundColor: c.bgCard,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    resultIcon: { fontSize: 20 },
    resultInfo: { flex: 1 },
    resultTitle: {
      color: c.textPrimary,
      fontSize: 15,
      fontWeight: '500',
    },
    resultMeta: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },

    footer: {
      padding: 20,
      backgroundColor: c.bgInput,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}

export default function SearchModal({ visible, onClose, lists, onSelectList }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) { setQuery(''); return; }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible]);

  const filteredLists = query.trim().length < 2 ? [] : lists.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={[globalStyles.header, { paddingTop: 20 }]}>
          <Text style={globalStyles.headerTitle}>{t.search.title}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.search.subtitle}</Text>
        </View>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t.search.placeholder}
            placeholderTextColor="#888"
            autoFocus
          />
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {/* RESULTADOS */}
          {query.trim().length >= 2 && (
            <Text style={styles.resultsCount}>
              {filteredLists.length === 0
                ? t.search.noResultsFound
                : t.search.resultsCount(filteredLists.length)}
            </Text>
          )}

          {/* LISTAS */}
          {filteredLists.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t.search.sectionLists}</Text>
              {filteredLists.map(list => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.resultCard}
                  onPress={() => { onSelectList(list); onClose(); }}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultIcon}>{list.type === 'tarefas' ? '✅' : '🛒'}</Text>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{list.name}</Text>
                      <Text style={styles.resultMeta}>
                        {list.items.length} itens
                        {list.isCompleted ? ` • ${t.search.listCompleted}` : ` • ${t.search.listOpen}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* ESTADO VAZIO */}
          {query.trim().length < 2 && (
            <Text style={globalStyles.emptyText}>
              {t.search.typeToSearch}
            </Text>
          )}
        </ScrollView>

        {/* AÇÕES */}
        <View style={styles.footer}>
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={Keyboard.dismiss}>
            <Text style={globalStyles.buttonPrimaryText}>{t.search.searchBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 12 }]} onPress={onClose}>
            <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
