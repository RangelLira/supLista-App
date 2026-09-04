// ===========================
// COMPONENTE: FORMULÁRIO DE ROTINA
// ===========================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { AppColors, useTheme } from '../contexts/ThemeContext';
import { CustomUnit, RecurrenceType, Rotina } from '../types';
import { parseDateInput } from '../utils/rotinaUtils';
import TagPicker from './TagPicker';
const WEEKDAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const RECURRENCE_TYPES: { key: RecurrenceType; label: string }[] = [
  { key: 'daily', label: 'Diária' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'monthly', label: 'Mensal' },
  { key: 'yearly', label: 'Anual' },
  { key: 'custom', label: 'Personalizado' },
];
// Ordem: Min → Horas → Dias → Semanas → Meses
const CUSTOM_UNITS: { key: CustomUnit; label: string }[] = [
  { key: 'minutes', label: 'Min' },
  { key: 'hours', label: 'Horas' },
  { key: 'days', label: 'Dias' },
  { key: 'weeks', label: 'Semanas' },
  { key: 'months', label: 'Meses' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (rotina: Rotina) => void;
  onSaveNotes?: (id: number, notes: string[]) => void;
  editingRotina?: Rotina | null;
  preFilledDate?: string | null;
}

function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return '';
  return `${iso.substring(8, 10)}/${iso.substring(5, 7)}/${iso.substring(0, 4)}`;
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgMain },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, backgroundColor: c.bgInput },

    inputLocked: { opacity: 0.5 },
    lockedHint: { color: c.textSecondary, fontSize: 12, marginBottom: 6, fontStyle: 'italic' },
    disabledLabel: { opacity: 0.4 },

    chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    chip: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.textSecondary, fontSize: 12, fontWeight: '500', textAlign: 'center' },
    chipTextSelected: { color: 'white', fontWeight: '700' },

    // Período: data + hora na mesma linha
    dateTimeRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    dateCol: { flex: 3 },
    timeCol: { flex: 2 },
    dateInput: { flex: 1 },
    periodSubLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 4,
    },

    section: {
      marginTop: 8,
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 14,
      marginBottom: 4,
    },
    sectionLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 10,
    },

    // Frequência: label + valor + botão na mesma linha
    frequencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
      marginBottom: 4,
    },
    frequencyLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    frequencyValue: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    configFreqBtn: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    configFreqBtnText: {
      color: c.primary,
      fontSize: 13,
      fontWeight: '600',
    },

    // Linha compacta com label + input à direita
    inlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    inlineLabel: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
    },
    shortInput: {
      width: 64,
      textAlign: 'center',
      flex: 0,
      marginBottom: 0,
    },

    // 5 chips de unidade, mesma largura, numa linha
    unitChipsRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 4,
    },
    unitChip: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 16,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unitChipText: { color: c.textSecondary, fontSize: 11, fontWeight: '500' },

    warningText: {
      color: c.warning,
      fontSize: 12,
      marginTop: 4,
      fontStyle: 'italic',
    },
    infoText: {
      color: c.textSecondary,
      fontSize: 12,
      marginTop: 6,
      fontStyle: 'italic',
    },

    notesSection: {
      marginTop: 16,
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 16,
    },
    noteInput: { marginBottom: 8 },
    noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 6 },
    noteText: { flex: 1, color: c.textPrimary, fontSize: 14, lineHeight: 20 },
    removeNoteBtn: {
      width: 28, height: 28, backgroundColor: c.danger,
      borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    removeNoteBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },

    actions: { flexDirection: 'column', padding: 20, gap: 12, backgroundColor: c.bgInput },
  });
}

export default function RoutineForm({
  visible, onClose, onSave, onSaveNotes, editingRotina = null, preFilledDate = null,
}: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [customInputFocused, setCustomInputFocused] = useState(false);
  const [freqInputFocused, setFreqInputFocused] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [monthDay, setMonthDay] = useState('');
  const [customInterval, setCustomInterval] = useState('');
  const [customUnit, setCustomUnit] = useState<CustomUnit>('days');
  const [customReps, setCustomReps] = useState('');

  const [showFreqModal, setShowFreqModal] = useState(false);
  const [draftType, setDraftType] = useState<RecurrenceType>('daily');
  const [draftWeekdays, setDraftWeekdays] = useState<number[]>([]);
  const [draftMonthDay, setDraftMonthDay] = useState('');
  const [draftInterval, setDraftInterval] = useState('');
  const [draftUnit, setDraftUnit] = useState<CustomUnit>('days');
  const [draftReps, setDraftReps] = useState('');

  const isEditing = !!(editingRotina && editingRotina.id > 0);
  const isStartLocked = !!(preFilledDate && !isEditing);

  useEffect(() => {
    if (editingRotina && editingRotina.id > 0) {
      setTitle(editingRotina.title || '');
      setTag(editingRotina.tag_name || '');
      setStartDate(isoToDisplay(editingRotina.start_date));
      setEndDate(isoToDisplay(editingRotina.end_date));
      setTime(editingRotina.time || '');
      setEndTime(editingRotina.end_time || '');
      setRecurrenceType(editingRotina.recurrence_type || 'daily');
      setWeekdays(editingRotina.weekdays || []);
      setMonthDay(editingRotina.month_day?.toString() || '');
      setCustomInterval(editingRotina.custom_interval?.toString() || '');
      setCustomUnit(editingRotina.custom_unit || 'days');
      setCustomReps(editingRotina.custom_reps?.toString() || '');
    } else {
      setTitle(editingRotina?.title || '');
      setTag(editingRotina?.tag_name || '');
      setStartDate(preFilledDate ? isoToDisplay(preFilledDate) : '');
      setEndDate('');
      setTime('');
      setEndTime('');
      setRecurrenceType('daily');
      setWeekdays([]);
      setMonthDay('');
      setCustomInterval('');
      setCustomUnit('days');
      setCustomReps('');
    }
  }, [editingRotina, visible, preFilledDate]);

  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleDateChange = (text: string, setter: (v: string) => void, current: string) => {
    if (text === '' || text.length < current.length) { setter(text); return; }
    let f = text.replace(/\D/g, '');
    if (f.length >= 2) f = f.slice(0, 2) + '/' + f.slice(2);
    if (f.length >= 5) f = f.slice(0, 5) + '/' + f.slice(5, 9);
    setter(f);
  };

  const handleTimeChange = (text: string, setter: (v: string) => void, current: string) => {
    if (text === '' || text.length < current.length) { setter(text); return; }
    let f = text.replace(/\D/g, '');
    if (f.length >= 2) f = f.slice(0, 2) + ':' + f.slice(2, 4);
    setter(f);
  };

  const toggleWeekday = (idx: number) => {
    if (weekdays.includes(idx)) {
      setWeekdays(weekdays.filter(d => d !== idx));
    } else {
      if (weekdays.length >= 6) {
        Alert.alert(t.routineForm.maxDaysTitle, t.routineForm.maxDaysMsg);
        return;
      }
      setWeekdays([...weekdays, idx].sort());
    }
  };

  const toggleDraftWeekday = (idx: number) => {
    if (draftWeekdays.includes(idx)) {
      setDraftWeekdays(draftWeekdays.filter(d => d !== idx));
    } else {
      if (draftWeekdays.length >= 6) {
        Alert.alert(t.routineForm.maxDaysTitle, t.routineForm.maxDaysMsg);
        return;
      }
      setDraftWeekdays([...draftWeekdays, idx].sort());
    }
  };

  useEffect(() => {
    if (!showFreqModal) return;
    const h = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowFreqModal(false);
      return true;
    });
    return () => h.remove();
  }, [showFreqModal]);

  const openFreqModal = () => {
    setDraftType(recurrenceType);
    setDraftWeekdays([...weekdays]);
    setDraftMonthDay(monthDay);
    setDraftInterval(customInterval);
    setDraftUnit(customUnit);
    setDraftReps(customReps);
    setShowFreqModal(true);
  };

  const confirmFrequency = () => {
    setRecurrenceType(draftType);
    setWeekdays(draftWeekdays);
    setMonthDay(draftMonthDay);
    setCustomInterval(draftInterval);
    setCustomUnit(draftUnit);
    setCustomReps(draftReps);
    setShowFreqModal(false);
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert(t.common.error, t.routineForm.errorRequired); return; }

    const startIso = parseDateInput(startDate);
    if (!startIso) { Alert.alert(t.common.error, t.routineForm.errorStartDate); return; }

    const now = new Date();
    const nowDateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
    if (!isEditing && startIso < nowDateStr) {
      Alert.alert(t.common.error, t.routineForm.errorPastDate);
      return;
    }

    // Hora início preenchida → hora fim obrigatória (para não-custom com data final visível)
    if (recurrenceType !== 'custom' && time.trim() && !endTime.trim()) {
      Alert.alert(t.routineForm.errorEndTimeTitle, t.routineForm.errorEndTime);
      return;
    }

    // Recurrence-specific validation
    if (recurrenceType === 'weekly' && weekdays.length === 0) {
      Alert.alert(t.common.error, t.routineForm.errorWeekdays);
      return;
    }
    if (recurrenceType === 'monthly') {
      const md = parseInt(monthDay, 10);
      if (isNaN(md) || md < 1 || md > 31) {
        Alert.alert(t.common.error, t.routineForm.errorMonthDay);
        return;
      }
    }

    let endIso = '';
    if (recurrenceType === 'custom') {
      const interval = parseInt(customInterval, 10);
      const reps = parseInt(customReps, 10);
      if (isNaN(interval) || interval < 1) {
        Alert.alert(t.common.error, t.routineForm.errorInterval);
        return;
      }
      if (isNaN(reps) || reps < 2 || reps > 99) {
        Alert.alert(t.common.error, t.routineForm.errorReps);
        return;
      }
      // Calcula end_date automaticamente
      const startObj = new Date(startIso + 'T12:00:00');
      const endObj = new Date(startObj);
      const timeStr = time.trim() ? time : '00:00';
      const [h, m] = timeStr.split(':').map(Number);

      if (customUnit === 'hours') {
        endObj.setHours(h + interval * (reps - 1), m, 0, 0);
      } else if (customUnit === 'minutes') {
        endObj.setHours(h, m + interval * (reps - 1), 0, 0);
      } else if (customUnit === 'days') {
        endObj.setDate(endObj.getDate() + interval * (reps - 1));
      } else if (customUnit === 'weeks') {
        endObj.setDate(endObj.getDate() + interval * 7 * (reps - 1));
      } else if (customUnit === 'months') {
        endObj.setMonth(endObj.getMonth() + interval * (reps - 1));
      }

      // Limitar a 2 anos
      const maxEnd = new Date(startObj);
      maxEnd.setFullYear(maxEnd.getFullYear() + 2);
      const finalEnd = endObj > maxEnd ? maxEnd : endObj;
      endIso = `${finalEnd.getFullYear()}-${(finalEnd.getMonth()+1).toString().padStart(2,'0')}-${finalEnd.getDate().toString().padStart(2,'0')}`;
    } else {
      endIso = parseDateInput(endDate) || '';
      if (!endIso) { Alert.alert(t.common.error, t.routineForm.errorEndDate); return; }
      if (endIso <= startIso) { Alert.alert(t.common.error, t.routineForm.errorEndDateOrder); return; }

      // Max 2 anos
      const startObj = new Date(startIso + 'T12:00:00');
      const maxEnd = new Date(startObj);
      maxEnd.setFullYear(maxEnd.getFullYear() + 2);
      const maxEndStr = `${maxEnd.getFullYear()}-${(maxEnd.getMonth()+1).toString().padStart(2,'0')}-${maxEnd.getDate().toString().padStart(2,'0')}`;
      if (endIso > maxEndStr) {
        Alert.alert(t.common.error, t.routineForm.errorEndDateMax);
        return;
      }
    }

    const rotinaData: Rotina = {
      id: isEditing ? editingRotina!.id : Date.now(),
      title: title.trim(),
      tag_name: tag || 'Geral',
      start_date: startIso,
      end_date: endIso,
      time: time.trim() || null,
      end_time: endTime.trim() || null,
      recurrence_type: recurrenceType,
      weekdays,
      month_day: recurrenceType === 'monthly' ? parseInt(monthDay, 10) : null,
      custom_interval: recurrenceType === 'custom' ? parseInt(customInterval, 10) : null,
      custom_unit: recurrenceType === 'custom' ? customUnit : null,
      custom_reps: recurrenceType === 'custom' ? parseInt(customReps, 10) : null,
      notes: editingRotina?.notes ?? [],
      is_suspended: editingRotina?.is_suspended || false,
      suspended_from_date: editingRotina?.suspended_from_date || null,
      completed_instances: editingRotina?.completed_instances || [],
      linked_lists: editingRotina?.linked_lists || {},
    };

    onSave(rotinaData);
    onClose();
  };

  const hasStartTime = !!time.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={globalStyles.modalHeader}>
          <Text style={globalStyles.modalTitle}>{isEditing ? t.routineForm.titleEdit : t.routineForm.titleCreate}</Text>
          <Text style={globalStyles.headerSubtitle}>
            {isEditing ? t.routineForm.subtitleEdit : t.routineForm.subtitleCreate}
          </Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

          {/* NOME */}
          <Text style={globalStyles.inputLabel}>{t.routineForm.labelName}</Text>
          <TextInput
            style={globalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t.routineForm.placeholderName}
            placeholderTextColor="#666"
            maxLength={50}
          />

          {/* TAGS */}
          <Text style={globalStyles.inputLabel}>{t.routineForm.labelTag}</Text>
          <TagPicker value={tag} onChange={setTag} onInputFocusChange={setCustomInputFocused} />

          {/* PERÍODO */}
          <View style={[styles.dateTimeRow, { marginTop: 16 }]}>
            <View style={styles.dateCol}>
              <Text style={styles.periodSubLabel}>{t.routineForm.labelStartDate}</Text>
              <TextInput
                style={[globalStyles.input, styles.dateInput, { textAlign: 'center' }, isStartLocked && styles.inputLocked]}
                value={startDate}
                onChangeText={isStartLocked ? undefined : (v) => handleDateChange(v, setStartDate, startDate)}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={10}
                editable={!isStartLocked}
              />
            </View>
            <View style={styles.timeCol}>
              <Text style={styles.periodSubLabel}>{t.routineForm.labelTimeOptional}</Text>
              <TextInput
                style={[globalStyles.input, { textAlign: 'center' }]}
                value={time}
                onChangeText={(v) => handleTimeChange(v, setTime, time)}
                placeholder="HH:MM"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
          {isStartLocked && <Text style={styles.lockedHint}>{t.routineForm.lockedDateHint}</Text>}

          {/* PERÍODO FINAL (apenas para não-custom) */}
          {recurrenceType !== 'custom' && (
            <>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.periodSubLabel}>{t.routineForm.labelEndDate}</Text>
                  <TextInput
                    style={[globalStyles.input, styles.dateInput, { textAlign: 'center' }]}
                    value={endDate}
                    onChangeText={(v) => handleDateChange(v, setEndDate, endDate)}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <View style={styles.timeCol}>
                  <Text style={[styles.periodSubLabel, !hasStartTime && styles.disabledLabel]}>
                    {t.routineForm.labelTimeOptional}{hasStartTime ? ' *' : ''}
                  </Text>
                  <TextInput
                    style={[globalStyles.input, { textAlign: 'center' }, !hasStartTime && styles.inputLocked]}
                    value={endTime}
                    onChangeText={hasStartTime ? (v) => handleTimeChange(v, setEndTime, endTime) : undefined}
                    placeholder="HH:MM"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={5}
                    editable={hasStartTime}
                  />
                </View>
              </View>
            </>
          )}

          {/* FREQUÊNCIA — label + valor + botão na mesma linha */}
          <View style={styles.frequencyRow}>
            <Text style={styles.frequencyLabel}>{t.routineForm.labelFrequency}:</Text>
            <Text style={styles.frequencyValue}>
              {t.recurrence[recurrenceType as keyof typeof t.recurrence]}
            </Text>
            <TouchableOpacity style={[styles.chip, styles.chipSelected, { paddingHorizontal: 12 }]} onPress={openFreqModal}>
              <Text style={[styles.chipText, styles.chipTextSelected]}>{t.routineForm.configureFrequency}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* AÇÕES */}
        {!keyboardVisible && !customInputFocused && (
          <View style={styles.actions}>
            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleSave}>
              <Text style={globalStyles.buttonPrimaryText}>{t.common.save}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={globalStyles.buttonSecondary} onPress={onClose}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MODAL DE CONFIGURAÇÃO DE FREQUÊNCIA */}
        <Modal
          visible={showFreqModal}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowFreqModal(false)}>
          <View style={styles.container}>
            <View style={globalStyles.modalHeader}>
              <Text style={globalStyles.modalTitle}>{t.routineForm.labelFrequency}</Text>
              <Text style={globalStyles.headerSubtitle}>{t.routineForm.subtitleCreate}</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

              {/* TIPO DE RECORRÊNCIA */}
              <View style={[styles.chipsRow, { marginTop: 16 }]}>
                {RECURRENCE_TYPES.slice(0, 3).map(rt => (
                  <TouchableOpacity
                    key={rt.key}
                    style={[styles.chip, draftType === rt.key && styles.chipSelected]}
                    onPress={() => setDraftType(rt.key)}>
                    <Text style={[styles.chipText, draftType === rt.key && styles.chipTextSelected]}>
                      {t.recurrence[rt.key as keyof typeof t.recurrence]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.chipsRow, { marginBottom: 16 }]}>
                {RECURRENCE_TYPES.slice(3).map(rt => (
                  <TouchableOpacity
                    key={rt.key}
                    style={[styles.chip, draftType === rt.key && styles.chipSelected]}
                    onPress={() => setDraftType(rt.key)}>
                    <Text style={[styles.chipText, draftType === rt.key && styles.chipTextSelected]}>
                      {t.recurrence[rt.key as keyof typeof t.recurrence]}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={[styles.chip, { opacity: 0 }]} pointerEvents="none" />
              </View>

              {/* HINT DIÁRIA */}
              {draftType === 'daily' && (
                <Text style={styles.infoText}>{t.routineForm.dailyHint}</Text>
              )}

              {/* CONFIG SEMANAL */}
              {draftType === 'weekly' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t.routineForm.weekdaysLabel}</Text>
                  <View style={styles.chipsRow}>
                    {WEEKDAY_LABELS.slice(0, 4).map((label, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.chip, draftWeekdays.includes(idx) && styles.chipSelected]}
                        onPress={() => toggleDraftWeekday(idx)}>
                        <Text style={[styles.chipText, draftWeekdays.includes(idx) && styles.chipTextSelected]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.chipsRow}>
                    {WEEKDAY_LABELS.slice(4).map((label, i) => {
                      const idx = i + 4;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.chip, draftWeekdays.includes(idx) && styles.chipSelected]}
                          onPress={() => toggleDraftWeekday(idx)}>
                          <Text style={[styles.chipText, draftWeekdays.includes(idx) && styles.chipTextSelected]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={[styles.chip, { opacity: 0 }]} pointerEvents="none" />
                  </View>
                </View>
              )}

              {/* CONFIG MENSAL */}
              {draftType === 'monthly' && (
                <View style={styles.section}>
                  <View style={styles.inlineRow}>
                    <Text style={styles.inlineLabel}>{t.routineForm.monthDayLabel}</Text>
                    <TextInput
                      style={[globalStyles.input, styles.shortInput, { textAlign: 'center' }]}
                      value={draftMonthDay}
                      onChangeText={text => setDraftMonthDay(text.replace(/\D/g, '').slice(0, 2))}
                      placeholder="1-31"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      maxLength={2}
                      onFocus={() => setFreqInputFocused(true)}
                      onBlur={() => setFreqInputFocused(false)}
                    />
                  </View>
                  {parseInt(draftMonthDay, 10) >= 29 && (
                    <Text style={styles.warningText}>{t.routineForm.monthDayWarning}</Text>
                  )}
                </View>
              )}

              {/* HINT ANUAL */}
              {draftType === 'yearly' && (
                <Text style={styles.infoText}>{t.routineForm.yearlyHint}</Text>
              )}

              {/* CONFIG PERSONALIZADO */}
              {draftType === 'custom' && (
                <View style={styles.section}>
                  <Text style={[styles.inlineLabel, { marginBottom: 6 }]}>{t.routineForm.repsLabel}</Text>
                  <TextInput
                    style={[globalStyles.input, { textAlign: 'center', marginBottom: 10 }]}
                    value={draftReps}
                    onChangeText={text => setDraftReps(text.replace(/\D/g, '').slice(0, 2))}
                    placeholder="2-99"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFreqInputFocused(true)}
                    onBlur={() => setFreqInputFocused(false)}
                  />
                  <Text style={[styles.inlineLabel, { marginBottom: 6 }]}>{t.routineForm.repeatLabel}</Text>
                  <TextInput
                    style={[globalStyles.input, { textAlign: 'center', marginBottom: 10 }]}
                    value={draftInterval}
                    onChangeText={text => setDraftInterval(text.replace(/\D/g, '').slice(0, 2))}
                    placeholder="1"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFreqInputFocused(true)}
                    onBlur={() => setFreqInputFocused(false)}
                  />
                  <View style={styles.unitChipsRow}>
                    {CUSTOM_UNITS.map(u => (
                      <TouchableOpacity
                        key={u.key}
                        style={[styles.unitChip, draftUnit === u.key && styles.chipSelected]}
                        onPress={() => setDraftUnit(u.key)}>
                        <Text style={[styles.unitChipText, draftUnit === u.key && styles.chipTextSelected]}>
                          {t.customUnit[u.key as keyof typeof t.customUnit]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.infoText, { textAlign: 'center' }]}>{t.routineForm.autoEndDate}</Text>
                </View>
              )}

            </ScrollView>

            {!keyboardVisible && !freqInputFocused && (
              <View style={styles.actions}>
                <TouchableOpacity style={globalStyles.buttonPrimary} onPress={confirmFrequency}>
                  <Text style={globalStyles.buttonPrimaryText}>{t.common.save}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={globalStyles.buttonSecondary} onPress={() => setShowFreqModal(false)}>
                  <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Modal>

      </View>
    </Modal>
  );
}
