import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { AppColors, useTheme } from '../contexts/ThemeContext';

const CUSTOM_SENTINEL = '__custom__';
const PRESET_TAG_KEYS = ['Trabalho', 'Pessoal', 'Saúde', 'Família', 'Financeiro', 'Estudos', 'Lazer'];
const CHIP_KEYS = [...PRESET_TAG_KEYS, CUSTOM_SENTINEL];

function isCustomValue(v: string) {
  return v !== '' && v !== 'Geral' && !PRESET_TAG_KEYS.includes(v);
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
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
    customInput: { marginTop: 8 },
  });
}

interface Props {
  value: string;
  onChange: (tag: string) => void;
  onInputFocusChange?: (focused: boolean) => void;
}

export default function TagPicker({ value, onChange, onInputFocusChange }: Props) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);

  const [activeChip, setActiveChip] = useState<string>(() =>
    isCustomValue(value) ? CUSTOM_SENTINEL : (PRESET_TAG_KEYS.includes(value) ? value : '')
  );
  const [customText, setCustomText] = useState<string>(() =>
    isCustomValue(value) ? value : ''
  );

  useEffect(() => {
    const resolvedInternal = activeChip === CUSTOM_SENTINEL ? customText : activeChip;
    if (resolvedInternal === value) return;

    if (PRESET_TAG_KEYS.includes(value)) {
      setActiveChip(value);
      setCustomText('');
    } else if (isCustomValue(value)) {
      setActiveChip(CUSTOM_SENTINEL);
      setCustomText(value);
    } else {
      setActiveChip('');
      setCustomText('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChipPress = (chipKey: string) => {
    if (chipKey === activeChip) {
      setActiveChip('');
      setCustomText('');
      onChange('');
      inputRef.current?.blur();
    } else {
      setActiveChip(chipKey);
      if (chipKey !== CUSTOM_SENTINEL) {
        setCustomText('');
        onChange(chipKey);
        inputRef.current?.blur();
      } else {
        onChange('');
        inputRef.current?.focus();
      }
    }
  };

  const handleInputFocus = () => {
    if (activeChip !== CUSTOM_SENTINEL) {
      setActiveChip(CUSTOM_SENTINEL);
      onChange(customText);
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  return (
    <>
      {[0, 1].map(row => (
        <View key={row} style={styles.row}>
          {CHIP_KEYS.slice(row * 4, row * 4 + 4).map(chipKey => (
            <TouchableOpacity
              key={chipKey}
              style={[styles.chip, activeChip === chipKey && styles.chipSelected]}
              onPress={() => handleChipPress(chipKey)}>
              <Text style={[styles.chipText, activeChip === chipKey && styles.chipTextSelected]}>
                {chipKey === CUSTOM_SENTINEL
                  ? t.tags.Personalizar
                  : (t.tags[chipKey as keyof typeof t.tags] ?? chipKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TextInput
        ref={inputRef}
        style={[globalStyles.input, styles.customInput]}
        value={customText}
        onChangeText={handleCustomTextChange}
        onFocus={() => { handleInputFocus(); onInputFocusChange?.(true); }}
        onBlur={() => onInputFocusChange?.(false)}
        placeholder={t.tags.customTagPlaceholder}
        placeholderTextColor="#666"
        maxLength={30}
      />
    </>
  );
}
