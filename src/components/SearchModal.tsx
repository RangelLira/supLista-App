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
import { Event, ShoppingList } from '../types';
import { detectDateInText, formatDetectedDate } from '../utils/dateUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  events: Event[];
  lists: ShoppingList[];
  onGoToDate: (date: Date) => void;
  onEditEvent: (event: Event) => void;
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

    dateCard: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: c.primary,
      alignItems: 'center',
    },
    dateCardLabel: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    dateCardText: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'capitalize',
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
    completedBadge: {
      color: c.success,
      fontSize: 18,
      fontWeight: '700',
    },

    footer: {
      padding: 20,
      backgroundColor: c.bgInput,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}

export default function SearchModal({ visible, onClose, events, lists, onGoToDate, onEditEvent }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t, lang } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [query, setQuery] = useState('');
  const [detectedDate, setDetectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setDetectedDate(null); return; }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible]);

  useEffect(() => {
    setDetectedDate(detectDateInText(query));
  }, [query]);

  const filteredEvents = query.trim().length < 2 ? [] : events.filter(e => {
    const q = query.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.tag_name?.toLowerCase().includes(q) ||
      e.notes.some(n => n.toLowerCase().includes(q)) ||
      e.steps.some(s => s.text.toLowerCase().includes(q))
    );
  });

  const filteredLists = query.trim().length < 2 ? [] : lists.filter(l =>
    l.name.toLowerCase().includes(query.toLowerCase())
  );

  const formatEventDate = (event: Event) => {
    if (event.is_pending) return t.search.pendingLabel;
    if (!event.start_time) return '';
    const date = new Date(event.start_time);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} às ${hours}:${minutes}`;
  };

  const totalResults = filteredEvents.length + filteredLists.length;

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
          {/* DETECÇÃO DE DATA */}
          {detectedDate && (
            <TouchableOpacity
              style={styles.dateCard}
              onPress={() => { onGoToDate(detectedDate); onClose(); }}>
              <Text style={styles.dateCardLabel}>📅 {t.search.dateDetected}</Text>
              <Text style={styles.dateCardText}>
                {t.search.goToDate} — {formatDetectedDate(detectedDate, lang)}
              </Text>
            </TouchableOpacity>
          )}

          {/* RESULTADOS */}
          {query.trim().length >= 2 && (
            <Text style={styles.resultsCount}>
              {totalResults === 0
                ? t.search.noResultsFound
                : t.search.resultsCount(totalResults)}
            </Text>
          )}

          {/* EVENTOS */}
          {filteredEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t.search.sectionEvents}</Text>
              {filteredEvents.map(event => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.resultCard}
                  onPress={() => { onEditEvent(event); onClose(); }}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultIcon}>{event.is_pending ? '⏳' : '📅'}</Text>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{event.title}</Text>
                      <Text style={styles.resultMeta}>
                        {formatEventDate(event)}
                        {event.tag_name && event.tag_name !== 'Geral' ? ` • ${event.tag_name}` : ''}
                      </Text>
                    </View>
                    {event.is_completed && <Text style={styles.completedBadge}>✓</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* LISTAS */}
          {filteredLists.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t.search.sectionLists}</Text>
              {filteredLists.map(list => (
                <View key={list.id} style={styles.resultCard}>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultIcon}>📝</Text>
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{list.name}</Text>
                      <Text style={styles.resultMeta}>
                        {list.items.length} itens
                        {list.isCompleted ? ` • ${t.search.listCompleted}` : ` • ${t.search.listOpen}`}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* ESTADO VAZIO */}
          {query.trim().length < 2 && (
            <Text style={globalStyles.emptyText}>
              {t.search.typeToSearch}{'\n\n'}
              {t.search.tipHint}
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
