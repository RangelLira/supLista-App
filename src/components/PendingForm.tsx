// ===========================
// COMPONENTE: FORMULÁRIO DE PENDÊNCIA
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

    section: { marginTop: 20, backgroundColor: c.bgCard, borderRadius: 12, padding: 16 },
    sectionTitle: { color: c.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 12 },

    noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 6 },
    noteText: { flex: 1, color: c.textPrimary, fontSize: 14, lineHeight: 20 },
    removeBtn: { width: 28, height: 28, backgroundColor: c.danger, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    removeBtnText: { color: 'white', fontSize: 12, fontWeight: '600' },

    addInput: { marginBottom: 8 },

    actions: { flexDirection: 'column', padding: 20, gap: 12, backgroundColor: c.bgInput },
  });
}

export default function PendingForm({ visible, onClose, onSave, onSaveNotes, editingEvent = null, existingEvents = [] }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [customInputFocused, setCustomInputFocused] = useState(false);

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title || '');
      setTag(editingEvent.tag_name || '');
    } else {
      setTitle('');
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

  const handleSave = () => {
    if (!title.trim()) { Alert.alert(t.common.error, t.pendingForm.errorRequired); return; }

    // Verificar duplicidade (mesmo título, case insensitive)
    if (!editingEvent) {
      const isDuplicate = existingEvents.some(e =>
        e.is_pending && e.title.trim().toLowerCase() === title.trim().toLowerCase()
      );
      if (isDuplicate) {
        Alert.alert(t.pendingForm.duplicateTitle, t.pendingForm.duplicateMsg);
        return;
      }
    }

    const eventData: Event = {
      id: editingEvent?.id || Date.now(),
      title: title.trim(),
      tag_name: tag.trim() || 'Geral',
      start_time: null,
      is_completed: editingEvent?.is_completed || false,
      is_pending: true,
      steps: [],
      notes: editingEvent?.notes ?? [],
      completedAt: editingEvent?.completedAt ?? null,
      createdAt: editingEvent?.createdAt ?? new Date().toISOString(),
    };

    onSave(eventData);
    onClose();
  };

  const isEditing = !!(editingEvent && !editingEvent.isPreFilled);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={globalStyles.modalHeader}>
          <Text style={globalStyles.modalTitle}>
            {isEditing ? t.pendingForm.titleEdit : t.pendingForm.titleCreate}
          </Text>
          <Text style={globalStyles.headerSubtitle}>
            {isEditing ? t.pendingForm.subtitleEdit : t.pendingForm.subtitleCreate}
          </Text>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* TÍTULO */}
          <Text style={globalStyles.inputLabel}>{t.pendingForm.labelName}</Text>
          <TextInput
            style={globalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t.pendingForm.placeholderName}
            placeholderTextColor="#666"
            maxLength={50}
          />


          {/* TAG */}
          <Text style={globalStyles.inputLabel}>{t.pendingForm.labelTag}</Text>
          <TagPicker value={tag} onChange={setTag} onInputFocusChange={setCustomInputFocused} />

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
