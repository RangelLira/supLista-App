// ===========================
// COMPONENTE: FORMULÁRIO DE EVENTO
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
import { Event } from '../types';
import TagPicker from './TagPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  onSaveNotes?: (id: number, notes: string[]) => void;
  editingEvent?: Event | null;
  existingEvents?: Event[];
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bgMain },
    content: { flex: 1, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, backgroundColor: c.bgInput },
    inputLocked: { opacity: 0.6 },
    lockedHint: { color: c.textSecondary, fontSize: 12, marginTop: 4, fontStyle: 'italic' },

    section: { marginTop: 20, backgroundColor: c.bgCard, borderRadius: 12, padding: 16 },
    sectionTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 12 },

    noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 6 },
    noteText: { flex: 1, color: c.textPrimary, fontSize: 14, lineHeight: 20 },
    removeBtn: { width: 28, height: 28, backgroundColor: c.danger, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    removeBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },

    addInput: { marginBottom: 8 },

    dateTimeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    dateCol: { flex: 3 },
    timeCol: { flex: 2 },
    labelRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
    colLabel: { color: c.textPrimary, fontSize: 14, fontWeight: '500' },

    actions: { flexDirection: 'column', padding: 20, gap: 12, backgroundColor: c.bgInput },
  });
}

export default function EventForm({ visible, onClose, onSave, onSaveNotes, editingEvent = null, existingEvents = [] }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [tag, setTag] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [customInputFocused, setCustomInputFocused] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setTag(editingEvent.tag_name || '');

      if (editingEvent.start_time) {
        const eventDate = new Date(editingEvent.start_time);
        const day = eventDate.getDate().toString().padStart(2, '0');
        const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
        const year = eventDate.getFullYear();
        setDate(`${day}/${month}/${year}`);
        // Hora — só preenche se não for meia-noite (Dia Todo)
        const hours = eventDate.getHours();
        const minutes = eventDate.getMinutes();
        if (hours !== 0 || minutes !== 0) {
          setTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        } else {
          setTime('');
        }
      } else {
        setDate('');
        setTime('');
      }
    } else {
      setTitle('');
      setDate('');
      setTime('');
      setTag('');
    }
  }, [editingEvent, visible]);

  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleDateChange = (text: string) => {
    if (text === '' || text.length < date.length) { setDate(text); return; }
    let formatted = text.replace(/\D/g, '');
    if (formatted.length >= 2) formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    if (formatted.length >= 5) formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
    setDate(formatted);
  };

  const handleTimeChange = (text: string) => {
    if (text === '' || text.length < time.length) { setTime(text); return; }
    let formatted = text.replace(/\D/g, '');
    if (formatted.length >= 2) formatted = formatted.slice(0, 2) + ':' + formatted.slice(2, 4);
    setTime(formatted);
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert(t.common.error, t.eventForm.errorRequired); return; }
    if (!date.trim()) { Alert.alert(t.common.error, t.eventForm.errorDateRequired); return; }

    const parts = date.split('/');
    if (parts.length !== 3) { Alert.alert(t.common.error, t.eventForm.errorDateInvalid); return; }

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length <= 2) year = '20' + year.padStart(2, '0');

    const timeStr = time.trim() ? time : '00:00';
    const dateObj = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    if (isNaN(dateObj.getTime())) {
      Alert.alert(t.common.error, t.eventForm.errorDateCheck);
      return;
    }

    // Não criar no passado — bloqueia para novos eventos e agendamentos de pendência
    const now = new Date();
    const isEditingExisting = editingEvent?.id && !editingEvent?.isScheduledFromPending && !editingEvent?.isPreFilled;
    if (!isEditingExisting) {
      const isDiaTodo = !time.trim();
      if (isDiaTodo) {
        // Para eventos Dia Todo: comparar apenas a data, sem hora
        const todayDateStr = now.toISOString().split('T')[0];
        const eventDateStr = `${year}-${month}-${day}`;
        if (eventDateStr < todayDateStr) {
          Alert.alert(t.common.error, t.eventForm.errorPastDate);
          return;
        }
      } else {
        if (dateObj < now) {
          Alert.alert(t.common.error, t.eventForm.errorPastDate);
          return;
        }
      }
    }

    const startTime = `${year}-${month}-${day}T${timeStr}:00`;

    // Verificar duplicidade (mesmo título + mesma data + mesma hora)
    const isDuplicate = existingEvents.some(e => {
      if (e.id === editingEvent?.id) return false; // ignora o próprio evento ao editar
      if (e.is_pending) return false;
      const sameTitle = e.title.trim().toLowerCase() === title.trim().toLowerCase();
      const sameStartTime = e.start_time === startTime;
      return sameTitle && sameStartTime;
    });

    if (isDuplicate) {
      Alert.alert(t.eventForm.duplicateTitle, t.eventForm.duplicateMsg);
      return;
    }

    const eventData: Event = {
      id: editingEvent?.id || Date.now(),
      title: title.trim(),
      tag_name: tag.trim() || 'Geral',
      start_time: startTime,
      is_completed: editingEvent?.is_completed || false,
      is_pending: false,
      steps: [],
      notes: editingEvent?.notes ?? [],
      linkedListId: editingEvent?.linkedListId ?? null,
      ...(editingEvent?.isScheduledFromPending && { isScheduledFromPending: true }),
    };

    onSave(eventData);
    onClose();
  };

  const hasLockedDate = editingEvent?.isPreFilled && editingEvent?.start_time != null;
  const isEditing = editingEvent && !editingEvent.isPreFilled;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={globalStyles.modalHeader}>
          <Text style={globalStyles.modalTitle}>
            {isEditing ? t.eventForm.titleEdit : t.eventForm.titleCreate}
          </Text>
          <Text style={globalStyles.headerSubtitle}>
            {isEditing ? t.eventForm.subtitleEdit : t.eventForm.subtitleCreate}
          </Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* TÍTULO */}
          <Text style={globalStyles.inputLabel}>{t.eventForm.labelName}</Text>
          <TextInput
            style={globalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t.eventForm.placeholderName}
            placeholderTextColor="#666"
            maxLength={50}
          />

          {/* TAG */}
          <Text style={globalStyles.inputLabel}>{t.eventForm.labelTag}</Text>
          <TagPicker value={tag} onChange={setTag} onInputFocusChange={setCustomInputFocused} />

          {/* DATA E HORA — mesma linha */}
          <View style={styles.labelRow}>
            <Text style={[styles.colLabel, { flex: 3 }]}>{t.eventForm.labelDate}</Text>
            <Text style={[styles.colLabel, { flex: 2 }]}>{t.eventForm.labelTimeOptional}</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <View style={styles.dateCol}>
              <TextInput
                style={[globalStyles.input, { textAlign: 'center' }, hasLockedDate && styles.inputLocked]}
                value={date}
                onChangeText={hasLockedDate ? undefined : handleDateChange}
                placeholder={t.eventForm.placeholderDate}
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={10}
                editable={!hasLockedDate}
              />
            </View>
            <View style={styles.timeCol}>
              <TextInput
                style={[globalStyles.input, { textAlign: 'center' }]}
                value={time}
                onChangeText={handleTimeChange}
                placeholder={t.eventForm.placeholderTime}
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
          {hasLockedDate && (
            <Text style={styles.lockedHint}>{t.eventForm.lockedDateHint}</Text>
          )}

        </ScrollView>

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
      </View>

    </Modal>
  );
}
