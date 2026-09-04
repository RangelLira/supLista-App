// ===========================
// COMPONENTE: Carrossel de Dias
// ===========================

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { darkColors } from '../styles/theme';
import { Event, Rotina } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getOccurrencesForDate } from '../utils/rotinaUtils';

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  events: Event[];
  rotinas: Rotina[];
}

const DAYS_BEFORE = 60;
const DAYS_AFTER = 60;
const CELL_WIDTH = 56;
const CELL_MARGIN = 5;
const ITEM_SIZE = CELL_WIDTH + CELL_MARGIN * 2;
// Padding lateral para que o item centrado fique exatamente no meio da tela
const H_PADDING = (Dimensions.get('window').width - ITEM_SIZE) / 2;

const WEEKDAY_ABBRS: Record<string, string[]> = {
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      height: 84,
      marginTop: 8,
    },
    cell: {
      width: CELL_WIDTH,
      marginHorizontal: CELL_MARGIN,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 14,
    },
    cellSelected: {
      backgroundColor: c.primary + '33',
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    cellToday: {
      borderWidth: 1,
      borderColor: c.primary + '55',
    },
    dayName: {
      fontSize: 11,
      fontWeight: '600',
      color: c.textSecondary,
    },
    dayNameSelected: {
      color: c.primary,
    },
    dayNumber: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      marginTop: 2,
    },
    dayNumberSelected: {
      color: c.primary,
    },
    dotRow: {
      flexDirection: 'row',
      marginTop: 3,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.success,
    },
    todayDot: {
      backgroundColor: c.primary,
    },
  });
}

export default function CarouselDays({ selectedDate, onSelectDate, events, rotinas }: Props) {
  const { colors } = useTheme();
  const { lang } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const listRef = useRef<FlatList<string>>(null);
  // Evita re-scroll quando a seleção veio do próprio swipe
  const suppressScrollRef = useRef(false);

  const todayStr = useMemo(() => formatDate(new Date()), []);

  const dateItems = useMemo(() => {
    const items: string[] = [];
    const base = new Date(todayStr + 'T12:00:00');
    for (let i = -DAYS_BEFORE; i <= DAYS_AFTER; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      items.push(formatDate(d));
    }
    return items;
  }, [todayStr]);

  const dateIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    dateItems.forEach((d, i) => { map[d] = i; });
    return map;
  }, [dateItems]);

  const datesWithItems = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.start_time && !e.is_pending) set.add(e.start_time.split('T')[0]);
    });
    dateItems.forEach(dateStr => {
      rotinas.forEach(rotina => {
        if (getOccurrencesForDate(rotina, dateStr).length > 0) set.add(dateStr);
      });
    });
    return set;
  }, [events, rotinas, dateItems]);

  // Scroll para o item selecionado, exceto quando a seleção veio do swipe
  useEffect(() => {
    if (suppressScrollRef.current) {
      suppressScrollRef.current = false;
      return;
    }
    const idx = dateIndexMap[selectedDate];
    if (idx !== undefined && listRef.current) {
      listRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
    }
  }, [selectedDate, dateIndexMap]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: ITEM_SIZE,
    offset: ITEM_SIZE * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: { item: string }) => {
    const isSelected = item === selectedDate;
    const isToday = item === todayStr;
    const hasDot = datesWithItems.has(item);
    const dayNum = parseInt(item.split('-')[2], 10);
    const dayOfWeek = new Date(item + 'T12:00:00').getDay();
    const weekday = (WEEKDAY_ABBRS[lang] || WEEKDAY_ABBRS.pt)[dayOfWeek];

    return (
      <TouchableOpacity
        style={[
          styles.cell,
          isToday && !isSelected && styles.cellToday,
          isSelected && styles.cellSelected,
        ]}
        onPress={() => onSelectDate(item)}
        activeOpacity={0.7}>
        <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
          {weekday}
        </Text>
        <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
          {dayNum}
        </Text>
        {hasDot && (
          <View style={styles.dotRow}>
            <View style={[styles.dot, isToday && styles.todayDot]} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedDate, todayStr, datesWithItems, styles, lang, onSelectDate]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={dateItems}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={DAYS_BEFORE}
        onScrollToIndexFailed={() => {}}
        snapToInterval={ITEM_SIZE}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: H_PADDING }}
        onMomentumScrollEnd={(e) => {
          // Com paddingHorizontal = H_PADDING, offset n*ITEM_SIZE centra exatamente o item n
          const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_SIZE);
          const clamped = Math.max(0, Math.min(dateItems.length - 1, idx));
          if (dateItems[clamped] && dateItems[clamped] !== selectedDate) {
            suppressScrollRef.current = true;
            onSelectDate(dateItems[clamped]);
          }
        }}
      />
    </View>
  );
}
