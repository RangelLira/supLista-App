// ===========================
// COMPONENTE: CALENDÁRIO VISUAL
// ===========================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { darkColors } from '../styles/theme';
import { Event, Rotina } from '../types';
import { getMonthName } from '../utils/dateUtils';
import { getOccurrenceDatesForMonth } from '../utils/rotinaUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CALENDAR_PADDING = 32;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - CALENDAR_PADDING - 32) / 7);

interface Props {
  events: Event[];
  rotinas?: Rotina[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onDoubleTapDate?: (dateStr: string) => void;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.bgCard,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 10,
      marginBottom: 16,
    },
    yearHeader: {
      backgroundColor: c.primary,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      marginHorizontal: -16,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 8,
    },
    yearHeaderText: {
      color: 'white',
      fontSize: 34,
      fontWeight: '800',
    },
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginBottom: 6,
    },
    navButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    navButtonText: {
      color: c.primary,
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 30,
    },
    monthTitleWrapper: {
      minWidth: 170,
      alignItems: 'center',
    },
    monthTitle: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '700',
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    weekDay: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: CELL_SIZE,
      height: CELL_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayInner: {
      width: CELL_SIZE - 4,
      height: CELL_SIZE - 4,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayInnerToday: {
      backgroundColor: c.primary + '33',
    },
    dayInnerSelected: {
      backgroundColor: c.primary,
    },
    dayText: {
      color: c.textPrimary,
      fontSize: 13,
      textAlign: 'center',
    },
    dayTextToday: {
      color: c.primary,
      fontWeight: '700',
    },
    dayTextSelected: {
      color: 'white',
      fontWeight: '700',
    },
    eventDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.warning,
      marginTop: 1,
    },
    eventDotSelected: {
      backgroundColor: 'white',
    },
    // Modal de seleção de mês
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 12,
    },
    monthCell: {
      width: '30%',
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: c.bgSecondary,
    },
    monthCellSelected: {
      backgroundColor: c.primary,
    },
    monthCellText: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    monthCellTextSelected: {
      color: 'white',
    },

    // Carrossel de anos
    yearCarousel: {
      marginBottom: 20,
    },
    yearCell: {
      width: 72,
      marginHorizontal: 5,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bgSecondary,
    },
    yearCellSelected: {
      backgroundColor: c.primary,
    },
    yearCellText: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    yearCellTextSelected: {
      color: 'white',
      fontWeight: '700',
    },
    yearOkBtn: {
      paddingVertical: 10,
      paddingHorizontal: 32,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignSelf: 'center',
    },
    yearOkBtnText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '700',
    },
  });
}

export default function CalendarView({ events, rotinas = [], selectedDate, onSelectDate, onDoubleTapDate }: Props) {
  const { colors, globalStyles } = useTheme();
  const { lang } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());
  const yearListRef = useRef<FlatList<number>>(null);

  const TODAY_YEAR = new Date().getFullYear();
  const YEAR_START = TODAY_YEAR - 10;
  const YEAR_END = TODAY_YEAR + 20;
  const YEARS = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i);
  const YEAR_CELL_WIDTH = 72 + 10; // cell width + 2 * marginHorizontal

  // Sincroniza tempYear e rola para o ano atual quando o modal abre
  useEffect(() => {
    if (!showYearPicker) return;
    setTempYear(year);
    const idx = YEARS.indexOf(year);
    if (idx >= 0 && yearListRef.current) {
      setTimeout(() => {
        yearListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showYearPicker]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const parts = selectedDate ? selectedDate.split('-') : [];
    if (parts.length === 3) {
      return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1 };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { year, month } = currentMonth;

  const prevMonth = () => setCurrentMonth(prev =>
    prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
  );

  const nextMonth = () => setCurrentMonth(prev =>
    prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
  );

  const getFirstDayOfWeek = (y: number, m: number): number =>
    (new Date(y, m, 1).getDay() + 6) % 7;

  const getDaysInMonth = (y: number, m: number): number => new Date(y, m + 1, 0).getDate();

  const formatDayStr = (y: number, m: number, d: number): string => {
    const mm = (m + 1).toString().padStart(2, '0');
    const dd = d.toString().padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const today = new Date();
  const todayStr = formatDayStr(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = getFirstDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const datesWithEvents = new Set(
    events.filter(e => e.start_time && !e.is_pending).map(e => e.start_time!.split('T')[0])
  );

  const datesWithRotinas = new Set<string>(
    rotinas.flatMap(r => getOccurrenceDatesForMonth(r, year, month))
  );

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handlePress = (dayStr: string) => {
    if (dayStr === selectedDate) {
      // Já selecionado: segundo toque abre
      onDoubleTapDate?.(dayStr);
    } else {
      // Primeiro toque: seleciona
      onSelectDate(dayStr);
    }
  };

  const monthName = getMonthName(month, lang);
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const WEEK_DAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const WEEK_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEK_DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const WEEK_DAYS = lang === 'en' ? WEEK_DAYS_EN : lang === 'es' ? WEEK_DAYS_ES : WEEK_DAYS_PT;

  const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => {
    const n = getMonthName(i, lang);
    return n.charAt(0).toUpperCase() + n.slice(1);
  });

  return (
    <View style={styles.container}>
      {/* ANO — topo roxo (clicável abre seletor de ano) */}
      <TouchableOpacity style={styles.yearHeader} onPress={() => setShowYearPicker(true)}>
        <Text style={styles.yearHeaderText}>{year}</Text>
      </TouchableOpacity>

      {/* NAVEGAÇÃO DE MÊS */}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navButton} onPress={prevMonth}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.monthTitleWrapper}>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
            <Text style={styles.monthTitle}>{monthTitle}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navButton} onPress={nextMonth}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* CABEÇALHO DIAS DA SEMANA */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map(day => (
          <View key={day} style={styles.cell}>
            <Text style={styles.weekDay}>{day}</Text>
          </View>
        ))}
      </View>

      {/* GRID */}
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.cell} />;

          const dayStr = formatDayStr(year, month, day);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedDate;
          const hasEvents = datesWithEvents.has(dayStr) || datesWithRotinas.has(dayStr);

          return (
            <TouchableOpacity
              key={dayStr}
              style={styles.cell}
              onPress={() => handlePress(dayStr)}>
              <View style={[
                styles.dayInner,
                isToday && styles.dayInnerToday,
                isSelected && styles.dayInnerSelected,
              ]}>
                <Text style={[
                  styles.dayText,
                  isToday && styles.dayTextToday,
                  isSelected && styles.dayTextSelected,
                ]}>
                  {day}
                </Text>
                {hasEvents && (
                  <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* MODAL: SELETOR DE MÊS */}
      <Modal visible={showMonthPicker} animationType="fade" transparent onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
          <View style={globalStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={globalStyles.modalContent}>
                <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 16 }]}>
                  {year}
                </Text>
                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((name, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.monthCell, i === month && styles.monthCellSelected]}
                      onPress={() => {
                        setCurrentMonth(prev => ({ ...prev, month: i }));
                        setShowMonthPicker(false);
                      }}>
                      <Text style={[styles.monthCellText, i === month && styles.monthCellTextSelected]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* MODAL: SELETOR DE ANO */}
      <Modal visible={showYearPicker} animationType="fade" transparent onRequestClose={() => setShowYearPicker(false)}>
        <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
          <View style={globalStyles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
          <View style={globalStyles.modalContent}>
            <FlatList
              ref={yearListRef}
              data={YEARS}
              keyExtractor={(item) => String(item)}
              horizontal
              showsHorizontalScrollIndicator={false}
              getItemLayout={(_, index) => ({ length: YEAR_CELL_WIDTH, offset: YEAR_CELL_WIDTH * index, index })}
              onScrollToIndexFailed={() => {}}
              style={styles.yearCarousel}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.yearCell, item === tempYear && styles.yearCellSelected]}
                  onPress={() => setTempYear(item)}
                  activeOpacity={0.7}>
                  <Text style={[styles.yearCellText, item === tempYear && styles.yearCellTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.yearOkBtn}
              onPress={() => {
                setCurrentMonth(prev => ({ ...prev, year: tempYear }));
                setShowYearPicker(false);
              }}>
              <Text style={styles.yearOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
