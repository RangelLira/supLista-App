// ===========================
// MODAL: ESCOLHA TIPO DE EVENTO
// ===========================

import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { darkColors } from '../styles/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'compromisso' | 'rotina') => void;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: c.bgInput,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    title: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.5,
      textAlign: 'center',
      marginBottom: 16,
      textTransform: 'uppercase',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
      gap: 14,
    },
    optionIcon: {
      width: 44,
      height: 44,
      backgroundColor: c.bgSecondary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionIconText: { fontSize: 22 },
    optionText: { flex: 1 },
    optionTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    optionDesc: {
      color: c.textSecondary,
      fontSize: 13,
    },
  });
}

export default function EventTypeModal({ visible, onClose, onSelect }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.card}>
          <Text style={styles.title}>{t.eventTypeModal.title}</Text>

          <TouchableOpacity style={styles.option} onPress={() => onSelect('compromisso')}>
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>📅</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{t.eventTypeModal.commitment}</Text>
              <Text style={styles.optionDesc}>{t.eventTypeModal.commitmentDesc}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => onSelect('rotina')}>
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>🔄</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{t.eventTypeModal.routine}</Text>
              <Text style={styles.optionDesc}>{t.eventTypeModal.routineDesc}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 8 }]} onPress={onClose}>
            <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
