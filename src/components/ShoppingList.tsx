// ===========================
// COMPONENTE: LISTAS (Compras e Tarefas)
// ===========================

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  Alert,
  BackHandler,
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../hooks/useToast';
import { darkColors } from '../styles/theme';
import { ShoppingList, ListItem, AVAILABLE_UNITS } from '../types';
import SwipeRow from './SwipeRow';
import TagPicker from './TagPicker';

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: c.bgMain },
    modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, backgroundColor: c.bgInput },
    modalFooter: { padding: 20, backgroundColor: c.bgInput },

    typeRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    typeButton: {
      flex: 1,
      backgroundColor: c.bgSecondary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    typeButtonSelected: { backgroundColor: c.primary, borderColor: c.primaryLight },
    typeButtonText: { color: c.textSecondary, fontSize: 15, fontWeight: '600' },
    typeButtonTextSelected: { color: 'white' },

    progressBarContainer: {
      alignSelf: 'stretch',
      height: 4,
      backgroundColor: c.border,
      borderRadius: 2,
      marginBottom: 4,
      overflow: 'hidden',
    },
    progressFill: { height: 4, backgroundColor: c.success, borderRadius: 2 },
    itemsSectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    sectionTitle: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 1.5,
      marginBottom: 10,
      marginTop: 4,
    },

    itemContainer: {
      backgroundColor: c.bgCard,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: 12,
      minHeight: 64,
    },
    itemChecked: { backgroundColor: c.successBg, borderColor: c.successBorder },
    itemDisabled: { opacity: 0.7 },

    // Checkbox View-based — tamanho fixo, sem troca de dimensão ao marcar
    checkboxView: {
      width: 26, height: 26,
      borderRadius: 6, borderWidth: 2,
      borderColor: c.border,
      marginHorizontal: 12,
      justifyContent: 'center', alignItems: 'center',
    },
    checkboxViewChecked: { backgroundColor: c.success, borderColor: c.success },
    checkboxMark: { color: 'white', fontSize: 14, fontWeight: '800', lineHeight: 18 },
    checkboxViewLarge: {
      width: 38, height: 38,
      borderRadius: 8, borderWidth: 2,
      borderColor: c.border,
      marginHorizontal: 12,
      justifyContent: 'center', alignItems: 'center',
    },
    checkboxMarkLarge: { color: 'white', fontSize: 22, fontWeight: '800', lineHeight: 28 },

    itemInfo: { flex: 1 },
    itemName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    itemNameChecked: { textDecorationLine: 'line-through', color: c.textSecondary },
    itemQuantity: { color: c.textSecondary, fontSize: 12, marginTop: 2 },

    itemPrice: { marginHorizontal: 8, alignItems: 'flex-end' },
    priceText: { color: c.success, fontSize: 14, fontWeight: '600' },
    addPriceButton: { backgroundColor: c.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 7 },
    addPriceText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

    footer: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
      backgroundColor: c.bgInput,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    actionButton: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
    completeButton: { backgroundColor: c.success, flex: 1 },
    reopenButton: { backgroundColor: c.bgSecondary, flex: 1 },
    archiveButton: { backgroundColor: c.bgSecondary, flex: 1 },
    shareButton: { backgroundColor: c.bgSecondary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
    shareButtonText: { fontSize: 20 },
    deleteButton: { backgroundColor: c.danger },
    actionButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },

    // Shopping mode
    shoppingModeBtn: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    shoppingModeBtnActive: {
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    shoppingModeBtnText: { fontSize: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
    // Shopping mode items
    itemNameLarge: { fontSize: 18 },
    // Shopping mode footer total
    shoppingTotal: {
      flex: 1,
      justifyContent: 'center',
    },
    shoppingTotalLabel: {
      color: c.textSecondary,
      fontSize: 12,
      fontWeight: '500' as const,
    },
    shoppingTotalAmount: {
      color: c.success,
      fontSize: 22,
      fontWeight: '700' as const,
    },
    finalizeSmall: {
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      backgroundColor: c.success,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Compact add button in section title row
    addItemCompact: {
      backgroundColor: c.primary + '22',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: c.primary + '55',
    },
    addItemCompactText: { color: c.primary, fontSize: 11, fontWeight: '700' },

    // Notes textarea
    notesInput: {
      backgroundColor: c.bgCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
      padding: 14,
      textAlignVertical: 'top' as const,
    },

    // Bottom container (holds gridPanel + bottomBar)
    bottomContainer: {
      backgroundColor: c.bgMain,
    },
    contentFlex: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    gridPanel: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 8,
    },
    bottomBar: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      padding: 16,
      gap: 8,
    },
    backBtn: {
      backgroundColor: c.bgSecondary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: 'center' as const,
    },
    backBtnText: {
      color: c.textSecondary,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    addItemSection: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    actionRow: { flexDirection: 'row', gap: 8 },
    gridBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridBtnText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
    gridBtnTextDisabled: { color: c.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    gridBtnPrimary: { backgroundColor: c.primary },
    gridBtnSuccess: { backgroundColor: c.success },
    gridBtnDanger: { backgroundColor: c.danger },
    gridBtnWarning: { backgroundColor: c.warning },
    gridBtnNeutral: { backgroundColor: c.bgSecondary },
    gridBtnDisabled: { backgroundColor: c.bgSecondary, opacity: 0.4 },

    // Herdar lista
    inheritButton: { marginTop: 4, paddingVertical: 12, borderWidth: 1, borderColor: c.border, borderRadius: 8, borderStyle: 'dashed', alignItems: 'center' },
    inheritButtonText: { color: c.textSecondary, fontSize: 14 },
    inheritSelected: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bgCard, borderRadius: 8, padding: 10, marginTop: 4, gap: 8 },
    inheritSelectedText: { flex: 1, color: c.textPrimary, fontSize: 14 },
    inheritRemove: { color: c.danger, fontSize: 16, fontWeight: '600', paddingHorizontal: 4 },
    inheritOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, backgroundColor: c.bgCard, marginBottom: 8, gap: 12 },
    inheritOptionIcon: { fontSize: 20 },
    inheritOptionName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    inheritOptionMeta: { color: c.textSecondary, fontSize: 12, marginTop: 2 },

    quantityRow: { flexDirection: 'row', gap: 12 },
    quantityContainer: { flex: 1 },
    unitContainer: { flex: 1 },
    unitSelector: { backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
    unitText: { color: c.textPrimary, fontSize: 16, flex: 1 },
    unitArrow: { color: c.primary, fontSize: 12 },

    unitPickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    unitPickerContent: { backgroundColor: c.bgInput, borderRadius: 12, padding: 16, width: '80%' },
    unitOption: { padding: 12, borderRadius: 8, marginBottom: 4 },
    unitOptionSelected: { backgroundColor: c.primary },
    unitOptionText: { color: c.textPrimary, fontSize: 16 },
    unitOptionTextSelected: { color: 'white', fontWeight: '600' },
  });
}

// ===========================
// FORMULÁRIO: CRIAR LISTA
// ===========================
interface CreateListFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (list: ShoppingList) => void;
  existingLists?: ShoppingList[];
}

export function CreateListForm({ visible, onClose, onSave, existingLists = [] }: CreateListFormProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [listName, setListName] = useState('');
  const [listType, setListType] = useState<'compras' | 'tarefas'>('compras');
  const [tagName, setTagName] = useState('');
  const [inheritFrom, setInheritFrom] = useState<ShoppingList | null>(null);
  const [showInheritModal, setShowInheritModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [customInputFocused, setCustomInputFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setInheritFrom(null);
    setTagName('');
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showInheritModal) { setShowInheritModal(false); return true; }
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose, showInheritModal]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const inheritableLists = existingLists.filter(l => l.isCompleted || l.isArchived);

  const handleSave = () => {
    if (!listName.trim()) { Alert.alert('Erro', t.lists.nameLabel.replace(' *', '')); return; }

    const today = new Date().toISOString().split('T')[0];
    const duplicate = existingLists.some(l => {
      const listDay = l.createdAt.split('T')[0];
      return l.name.trim().toLowerCase() === listName.trim().toLowerCase() && listDay === today;
    });

    if (duplicate) {
      Alert.alert(t.alerts.deleteList, t.alerts.deleteListMsg(listName));
      return;
    }

    const now = Date.now();
    const inheritedItems: ListItem[] = inheritFrom
      ? inheritFrom.items.map((item, index) => ({
          ...item,
          id: now + index + 1,
          isChecked: false,
          price: null,
        }))
      : [];

    const newList: ShoppingList = {
      id: now,
      name: listName.trim(),
      type: listType,
      tag_name: tagName.trim() || 'Geral',
      suppliers: inheritFrom ? [...inheritFrom.suppliers] : [],
      items: inheritedItems,
      createdAt: new Date().toISOString(),
      isCompleted: false,
      isArchived: false,
      totalSpent: 0,
    };

    onSave(newList);
    setListName('');
    setListType('compras');
    setTagName('');
    setInheritFrom(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={globalStyles.modalHeader}>
          <Text style={globalStyles.modalTitle}>{t.lists.createTitle}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.lists.createSubtitle}</Text>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* TÍTULO */}
          <Text style={globalStyles.inputLabel}>{t.lists.fieldTitle}</Text>
          <TextInput
            style={globalStyles.input}
            value={listName}
            onChangeText={setListName}
            placeholder={listType === 'compras' ? t.lists.placeholderShopping : t.lists.placeholderTasks}
            placeholderTextColor="#666"
            autoFocus
            maxLength={40}
          />

          {/* TAG */}
          <Text style={globalStyles.inputLabel}>{t.lists.tagLabel}</Text>
          <TagPicker value={tagName} onChange={setTagName} onInputFocusChange={setCustomInputFocused} />

          {/* TIPO DE LISTA */}
          <Text style={globalStyles.inputLabel}>{t.lists.typeLabel}</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, listType === 'compras' && styles.typeButtonSelected]}
              onPress={() => setListType('compras')}>
              <Text style={[styles.typeButtonText, listType === 'compras' && styles.typeButtonTextSelected]}>
                {t.lists.typeShopping}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, listType === 'tarefas' && styles.typeButtonSelected]}
              onPress={() => setListType('tarefas')}>
              <Text style={[styles.typeButtonText, listType === 'tarefas' && styles.typeButtonTextSelected]}>
                {t.lists.typeTasks}
              </Text>
            </TouchableOpacity>
          </View>

          {/* HERDAR LISTA ANTERIOR */}
          {inheritableLists.length > 0 && (
            <>
              <Text style={globalStyles.inputLabel}>{t.lists.inheritLabel}</Text>
              {inheritFrom ? (
                <View style={styles.inheritSelected}>
                  <Text style={styles.inheritSelectedText}>
                    {inheritFrom.type === 'tarefas' ? '✅' : '🛒'} {inheritFrom.name}
                    {' '}({inheritFrom.items.length} itens)
                  </Text>
                  <TouchableOpacity onPress={() => setInheritFrom(null)}>
                    <Text style={styles.inheritRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.inheritButton}
                  onPress={() => setShowInheritModal(true)}>
                  <Text style={styles.inheritButtonText}>{t.lists.inheritSelect}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>

        {!keyboardVisible && !customInputFocused && (
          <View style={styles.modalFooter}>
            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={handleSave}>
              <Text style={globalStyles.buttonPrimaryText}>{t.common.save}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 8 }]} onPress={onClose}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* MODAL SELECIONAR LISTA PARA HERDAR */}
      <Modal visible={showInheritModal} animationType="fade" transparent>
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 16 }]}>
              {t.lists.inheritModalTitle}
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {inheritableLists.map(l => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.inheritOption}
                  onPress={() => { setInheritFrom(l); setShowInheritModal(false); }}>
                  <Text style={styles.inheritOptionIcon}>
                    {l.type === 'tarefas' ? '✅' : '🛒'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inheritOptionName}>{l.name}</Text>
                    <Text style={styles.inheritOptionMeta}>
                      {l.items.length} itens • {l.isArchived ? t.common.archive : t.common.completed}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[globalStyles.buttonSecondary, { marginTop: 12 }]}
              onPress={() => setShowInheritModal(false)}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

// ===========================
// MODAL: ADICIONAR ITEM DE COMPRAS
// ===========================
interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: ListItem) => void;
  listType: 'compras' | 'tarefas';
  editItem?: ListItem | null;
}

function AddItemModal({ visible, onClose, onSave, listType, editItem }: AddItemModalProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('unidade');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editItem) {
      setItemName(editItem.name);
      setQuantity(String(editItem.quantity));
      setSelectedUnit(editItem.unit || 'unidade');
    } else {
      setItemName('');
      setQuantity('1');
      setSelectedUnit('unidade');
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose]);

  const getUnitLabel = () => t.units[selectedUnit as keyof typeof t.units] ?? (AVAILABLE_UNITS.find(u => u.value === selectedUnit)?.label || 'Unidade');

  const handleSave = () => {
    if (!itemName.trim()) { Alert.alert(t.common.error, t.shoppingItem.errorRequired); return; }

    const savedItem: ListItem = editItem
      ? { ...editItem, name: itemName.trim(), quantity: listType === 'compras' ? (parseInt(quantity) || 1) : 1, unit: listType === 'compras' ? selectedUnit : null }
      : { id: Date.now(), name: itemName.trim(), quantity: listType === 'compras' ? (parseInt(quantity) || 1) : 1, unit: listType === 'compras' ? selectedUnit : null, isChecked: false, price: null };

    onSave(savedItem);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={globalStyles.modalOverlay}>
        <View style={globalStyles.modalContent}>
          <Text style={[globalStyles.inputLabel, { marginTop: 4 }]}>{listType === 'compras' ? t.lists.addItem + ':' : t.lists.addTask + ':'}</Text>
          <TextInput
            style={globalStyles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder={listType === 'compras' ? t.shoppingItem.placeholderShopping : t.shoppingItem.placeholderTask}
            placeholderTextColor="#666"
            autoFocus
          />

          {listType === 'compras' && (
            <View style={styles.quantityRow}>
              <View style={styles.quantityContainer}>
                <Text style={globalStyles.inputLabel}>{t.shoppingItem.qtyLabel}</Text>
                <TextInput
                  style={[globalStyles.input, { textAlign: 'center' }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={styles.unitContainer}>
                <Text style={globalStyles.inputLabel}>{t.shoppingItem.unitLabel}</Text>
                <TouchableOpacity style={styles.unitSelector} onPress={() => setShowUnitPicker(true)}>
                  <Text style={styles.unitText}>{getUnitLabel()}</Text>
                  <Text style={styles.unitArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={[styles.quantityRow, { marginTop: 24 }]}>
            <TouchableOpacity style={[globalStyles.buttonSecondary, { flex: 1 }]} onPress={onClose}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.buttonPrimary, { flex: 1 }]} onPress={handleSave}>
              <Text style={globalStyles.buttonPrimaryText}>{t.common.save}</Text>
            </TouchableOpacity>
          </View>

          {showUnitPicker && (
            <View style={styles.unitPickerOverlay}>
              <View style={styles.unitPickerContent}>
                <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 16 }]}>
                  {t.shoppingItem.unitPickerTitle}
                </Text>
                {AVAILABLE_UNITS.map(unit => (
                  <TouchableOpacity
                    key={unit.value}
                    style={[styles.unitOption, selectedUnit === unit.value && styles.unitOptionSelected]}
                    onPress={() => { setSelectedUnit(unit.value); setShowUnitPicker(false); }}>
                    <Text style={[styles.unitOptionText, selectedUnit === unit.value && styles.unitOptionTextSelected]}>
                      {t.units[unit.value as keyof typeof t.units] ?? unit.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 12 }]} onPress={() => setShowUnitPicker(false)}>
                  <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ===========================
// MODAL: ADICIONAR PREÇO
// ===========================
// Normaliza entrada de preço BR/US: "25,90" → 25.90, "1.600,00" → 1600.00
// Rejeita: ",90", ".90", "99,99,999", "88.88.9"
function normalizePrice(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d/.test(trimmed)) return null;

  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount > 1) return null;

  let normalized: string;
  if (commaCount === 1) {
    const parts = trimmed.split(',');
    if (parts[1].includes('.')) return null;
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else {
    const dotParts = trimmed.split('.');
    if (dotParts.length === 1) {
      normalized = trimmed;
    } else if (dotParts.length === 2) {
      normalized = dotParts[1].length <= 2 ? trimmed : trimmed.replace(/\./g, '');
    } else {
      if (!dotParts.slice(1).every(p => p.length === 3)) return null;
      normalized = trimmed.replace(/\./g, '');
    }
  }

  const value = parseFloat(normalized);
  return isNaN(value) || value < 0 ? null : value;
}

interface AddPriceModalProps {
  visible: boolean;
  item: ListItem | null;
  onClose: () => void;
  onSave: (itemId: number, price: number, priceType: 'unit' | 'total') => void;
}

function AddPriceModal({ visible, item, onClose, onSave }: AddPriceModalProps) {
  const { globalStyles } = useTheme();
  const { t } = useLanguage();

  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'unit' | 'total'>('unit');

  useEffect(() => {
    if (visible) {
      setPrice(item?.price ? item.price.toFixed(2).replace('.', ',') : '');
      setPriceType(item?.priceType ?? 'unit');
    }
  }, [visible, item]);

  const hasMultipleQty = (item?.quantity ?? 1) > 1;

  const handleSave = () => {
    const value = normalizePrice(price);
    if (value === null) {
      Alert.alert(t.common.error, t.shoppingItem.priceErrorRequired);
      return;
    }
    onSave(item!.id, value, priceType);
    setPrice('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={globalStyles.modalOverlay}>
        <View style={globalStyles.modalContent}>
          <Text style={[globalStyles.textTitle, { textAlign: 'center' }]}>
            {item?.price ? t.common.edit : t.shoppingItem.addPrice}
          </Text>
          <Text style={[globalStyles.textMuted, { textAlign: 'center', marginBottom: 16 }]}>
            {item?.name}{hasMultipleQty ? ` (${item!.quantity}x)` : ''}
          </Text>
          <Text style={globalStyles.inputLabel}>{t.shoppingItem.priceLabel}</Text>
          <TextInput
            style={globalStyles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0,00"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            autoFocus
          />
          {hasMultipleQty && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[globalStyles.buttonSecondary, { flex: 1, opacity: priceType === 'unit' ? 1 : 0.5 }]}
                onPress={() => setPriceType('unit')}>
                <Text style={globalStyles.buttonSecondaryText}>{t.shoppingItem.pricePerUnit}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[globalStyles.buttonSecondary, { flex: 1, opacity: priceType === 'total' ? 1 : 0.5 }]}
                onPress={() => setPriceType('total')}>
                <Text style={globalStyles.buttonSecondaryText}>{t.shoppingItem.priceTotal}</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={[{ flexDirection: 'row', gap: 12, marginTop: 24 }]}>
            <TouchableOpacity style={[globalStyles.buttonSecondary, { flex: 1 }]} onPress={onClose}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.buttonPrimary, { flex: 1 }]} onPress={handleSave}>
              <Text style={globalStyles.buttonPrimaryText}>{item?.price ? t.common.edit : t.common.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===========================
// TELA PRINCIPAL: LISTA
// ===========================
interface ShoppingListScreenProps {
  list: ShoppingList;
  onBack: () => void;
  onUpdate: (list: ShoppingList) => void;
  onDelete: (id: number) => void;
  allLists?: ShoppingList[];
  onNavigateToList?: (id: number) => void;
  // Action grid callbacks (Sprint 13)
  onComplete?: () => void;
  onReopen?: () => void;
  onLink?: () => void;
  onUnlink?: () => void;
  onShare?: () => void;
  onArchive?: () => void;
  isLinked?: boolean;
  isSharedWithMe?: boolean;
  sharedWithUid?: string | null;
}

export function ShoppingListScreen({ list, onBack, onUpdate, onDelete, allLists = [], onNavigateToList,
  onComplete, onReopen, onLink, onUnlink, onShare, onArchive,
  isLinked = false, isSharedWithMe = false, sharedWithUid = null,
}: ShoppingListScreenProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [priceModalItem, setPriceModalItem] = useState<ListItem | null>(null);
  const [isShoppingMode, setIsShoppingMode] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(list.notes ?? '');
  const notesRef = useRef(notesText);
  notesRef.current = notesText;
  const saveNotesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (saveNotesTimeoutRef.current) clearTimeout(saveNotesTimeoutRef.current); };
  }, []);

  const saveNotes = () => {
    onUpdate({ ...list, notes: notesRef.current });
  };

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    notesRef.current = text;
    if (saveNotesTimeoutRef.current) clearTimeout(saveNotesTimeoutRef.current);
    saveNotesTimeoutRef.current = setTimeout(() => {
      onUpdate({ ...list, notes: text });
    }, 600);
  };

  // LB2: evita modal espremido ao trocar item rapidamente — fecha primeiro, abre depois
  const handleOpenPriceModal = (item: ListItem) => {
    if (priceModalItem) {
      setPriceModalItem(null);
      setTimeout(() => setPriceModalItem(item), 300);
    } else {
      setPriceModalItem(item);
    }
  };

  const isCompras = list.type === 'compras';
  const shoppingModeActive = isShoppingMode && isCompras && !list.isCompleted;

  // L5 — swipe no header para navegar entre listas
  const slideAnim = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = 50;
  const navigableLists = allLists.filter(l => !l.isArchived);
  const currentIndex = navigableLists.findIndex(l => l.id === list.id);

  const navigateList = (delta: number) => {
    if (!onNavigateToList) return;
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= navigableLists.length) return;
    onNavigateToList(navigableLists[targetIndex].id);
  };

  const headerPanResponder = useMemo(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        slideAnim.setValue(gs.dx * 0.25);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.timing(slideAnim, { toValue: -120, duration: 130, useNativeDriver: true }).start(() => {
            navigateList(1);
            slideAnim.setValue(0);
          });
        } else if (gs.dx > SWIPE_THRESHOLD) {
          Animated.timing(slideAnim, { toValue: 120, duration: 130, useNativeDriver: true }).start(() => {
            navigateList(-1);
            slideAnim.setValue(0);
          });
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [currentIndex, navigableLists.length]);

  // L6 — editar nome da lista tocando no header
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const nameSavedRef = useRef(false);

  const handleStartEditName = () => {
    nameSavedRef.current = false;
    setNameInput(list.name);
    setEditingName(true);
  };

  const handleSaveName = () => {
    if (nameSavedRef.current) return;
    nameSavedRef.current = true;
    setEditingName(false);
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== list.name) {
      onUpdate({ ...list, name: trimmed });
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editingName) { setEditingName(false); return true; }
      if (editingItem) { setEditingItem(null); return true; }
      if (showAddItem) { setShowAddItem(false); return true; }
      if (priceModalItem) { setPriceModalItem(null); return true; }
      if (showNotes) { saveNotes(); setShowNotes(false); return true; }
      onBack();
      return true;
    });
    return () => backHandler.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingName, editingItem, showAddItem, priceModalItem, showNotes]);

  const checkedItems = list.items.filter(i => i.isChecked);
  const total = checkedItems.reduce((sum, i) => {
    if (!i.price) return sum;
    return sum + (i.priceType === 'total' ? i.price : i.price * i.quantity);
  }, 0);
  const progress = list.items.length > 0 ? checkedItems.length / list.items.length : 0;

  const prevCheckedCountRef = useRef(checkedItems.length);
  useEffect(() => {
    const prev = prevCheckedCountRef.current;
    prevCheckedCountRef.current = checkedItems.length;
    if (list.items.length > 0 && checkedItems.length === list.items.length && prev < checkedItems.length) {
      showToast(t.toast.allListItemsDone);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedItems.length, list.items.length]);

  // In shopping mode: unchecked items first, then checked
  const displayItems = shoppingModeActive
    ? [...list.items].sort((a, b) => {
        if (a.isChecked === b.isChecked) return 0;
        return a.isChecked ? 1 : -1;
      })
    : list.items;

  const toggleItem = (itemId: number) => {
    if (list.isCompleted) return;
    const updated = { ...list, items: list.items.map(i => i.id === itemId ? { ...i, isChecked: !i.isChecked } : i) };
    onUpdate(updated);
  };

  const addItem = (item: ListItem) => {
    const updated = { ...list, items: [item, ...list.items] };
    onUpdate(updated);
  };

  const updateItem = (item: ListItem) => {
    const updated = { ...list, items: list.items.map(i => i.id === item.id ? item : i) };
    onUpdate(updated);
  };

  const removeItem = (itemId: number) => {
    Alert.alert(t.alerts.removeItem, t.alerts.removeItemMsg, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.alerts.removeItemBtn, style: 'destructive', onPress: () => {
        const updated = { ...list, items: list.items.filter(i => i.id !== itemId) };
        onUpdate(updated);
      }},
    ]);
  };

  const addPrice = (itemId: number, price: number, priceType: 'unit' | 'total') => {
    const updated = { ...list, items: list.items.map(i => i.id === itemId ? { ...i, price, priceType } : i) };
    onUpdate(updated);
  };

  const toggleComplete = () => {
    Alert.alert(
      list.isCompleted ? t.alerts.reopenList : t.alerts.finalizeList,
      list.isCompleted ? t.alerts.reopenListMsg : t.alerts.finalizeListMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.confirm, onPress: () => onUpdate({ ...list, isCompleted: !list.isCompleted, totalSpent: total }) },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      t.alerts.deleteList,
      t.alerts.deleteListMsg(list.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.delete, style: 'destructive', onPress: () => { onDelete(list.id); onBack(); } },
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      t.alerts.archiveList,
      t.alerts.archiveListMsg(list.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.alerts.archiveListBtn, onPress: () => { onUpdate({ ...list, isArchived: true }); onBack(); } },
      ]
    );
  };

  const formatQuantity = (item: ListItem) => {
    if (!item.unit || item.unit === 'unidade') return `Qtd: ${item.quantity}`;
    return `Qtd: ${item.quantity} ${item.unit}`;
  };

  return (
    <View style={globalStyles.screen}>
      {/* HEADER — nome da lista como título (L6: toque para editar); swipe para navegar (L5) */}
      <View style={globalStyles.header} {...(!editingName && onNavigateToList ? headerPanResponder.panHandlers : {})}>
        {editingName ? (
          <TextInput
            style={[globalStyles.headerTitle, { padding: 0, width: '100%', textAlign: 'center' }]}
            value={nameInput}
            onChangeText={setNameInput}
            onSubmitEditing={handleSaveName}
            onBlur={handleSaveName}
            autoFocus
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={handleStartEditName} activeOpacity={0.8}>
            <Animated.Text
              style={[globalStyles.headerTitle, { transform: [{ translateX: slideAnim }] }]}
              numberOfLines={1}>
              {list.name}
            </Animated.Text>
          </TouchableOpacity>
        )}
        <Text style={globalStyles.headerSubtitle}>
          {isCompras ? t.lists.shoppingLabel : t.lists.tasksLabel}
          {` • ${checkedItems.length}/${list.items.length}`}
          {isCompras && total > 0 ? ` • R$ ${total.toFixed(2)}` : ''}
        </Text>
      </View>

      {/* Título da seção — sempre visível, muda com o toggle */}
      <Text style={[styles.sectionTitle, { marginTop: 20, marginHorizontal: 16 }]}>
        {showNotes ? t.common.notes.toUpperCase() : t.lists.itemsSection}
      </Text>

      {/* Barra de progresso — visível apenas no modo itens */}
      {!showNotes && (
        <View style={[styles.progressBarContainer, { marginHorizontal: 16 }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* CONTEÚDO — notas ou itens */}
      {showNotes ? (
        <TextInput
          style={[styles.notesInput, { flex: 1, marginHorizontal: 16 }]}
          value={notesText}
          onChangeText={handleNotesChange}
          onBlur={saveNotes}
          multiline
          placeholder={t.common.notesPlaceholder}
          placeholderTextColor={colors.textMuted}
          editable={!list.isCompleted}
          textAlignVertical="top"
        />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={globalStyles.scrollContent}>

          {list.items.length === 0 && (
            <Text style={globalStyles.emptyText}>{t.lists.noItems}</Text>
          )}

          {shoppingModeActive && (
            <View style={styles.shoppingTotal}>
              <Text style={styles.shoppingTotalLabel}>{t.lists.total}</Text>
              <Text style={styles.shoppingTotalAmount}>R$ {total.toFixed(2)}</Text>
            </View>
          )}

          {displayItems.map(item => (
            <SwipeRow
              key={item.id}
              disabled={list.isCompleted || shoppingModeActive}
              onSwipeRight={() => toggleItem(item.id)}
              onSwipeLeft={() => removeItem(item.id)}
              rightIcon="✓"
              leftIcon="🗑️"
              threshold={60}
              style={{ marginBottom: 2 }}>
              <View style={[
                styles.itemContainer,
                item.isChecked && styles.itemChecked,
                list.isCompleted && styles.itemDisabled,
              ]}>
                <TouchableOpacity
                  onPress={() => toggleItem(item.id)}
                  disabled={list.isCompleted}
                  activeOpacity={0.7}>
                  <View style={[
                    shoppingModeActive ? styles.checkboxViewLarge : styles.checkboxView,
                    item.isChecked && styles.checkboxViewChecked,
                  ]}>
                    {item.isChecked && (
                      <Text style={shoppingModeActive ? styles.checkboxMarkLarge : styles.checkboxMark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.itemInfo}
                  onPress={() => !list.isCompleted && !shoppingModeActive && setEditingItem(item)}
                  disabled={list.isCompleted || shoppingModeActive}
                  activeOpacity={list.isCompleted || shoppingModeActive ? 1 : 0.6}>
                  <Text style={[
                    styles.itemName,
                    shoppingModeActive && styles.itemNameLarge,
                    item.isChecked && styles.itemNameChecked,
                  ]}>
                    {item.name}
                  </Text>
                  {isCompras && (
                    <Text style={styles.itemQuantity}>{formatQuantity(item)}</Text>
                  )}
                </TouchableOpacity>

                {isCompras && (
                  <View style={styles.itemPrice}>
                    {item.price ? (
                      <TouchableOpacity onPress={() => handleOpenPriceModal(item)} disabled={list.isCompleted || shoppingModeActive}>
                        <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
                      </TouchableOpacity>
                    ) : (
                      !shoppingModeActive && (
                        <TouchableOpacity
                          style={[styles.addPriceButton, list.isCompleted && { opacity: 0.4 }]}
                          onPress={() => handleOpenPriceModal(item)}
                          disabled={list.isCompleted}>
                          <Text style={styles.addPriceText}>{t.shoppingItem.addPrice}</Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}
              </View>
            </SwipeRow>
          ))}
        </ScrollView>
      )}

      {/* GRADE DE AÇÕES + BOTÃO VOLTAR (fixo na parte inferior) */}
      <View style={styles.bottomContainer}>
        {/* Adicionar item (roxo) — fica acima da grade */}
        {!list.isCompleted && !showNotes && (
          <View style={styles.addItemSection}>
            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => setShowAddItem(true)}>
              <Text style={globalStyles.buttonPrimaryText}>
                {isCompras ? t.lists.addItem : t.lists.addTask}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid 6 botões — posição fixa: sempre imediatamente acima do separador */}
        <View style={styles.gridPanel}>
          {/* Linha 1: Anotações/Itens | Vincular/Desvincular | Compartilhar */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.gridBtn, styles.gridBtnPrimary]}
              onPress={() => setShowNotes(n => !n)}>
              <Text style={styles.gridBtnText}>
                {showNotes ? t.lists.itemsBtn : t.common.notes}
              </Text>
            </TouchableOpacity>

            {!list.isCompleted ? (
              isLinked ? (
                <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={onUnlink}>
                  <Text style={styles.gridBtnText}>{t.common.unlink}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]} onPress={onLink}>
                  <Text style={styles.gridBtnText}>{t.common.linkShort}</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity style={[styles.gridBtn, styles.gridBtnNeutral]} onPress={onArchive}>
                <Text style={styles.gridBtnText}>{t.common.archive}</Text>
              </TouchableOpacity>
            )}

            {isSharedWithMe ? (
              <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={onShare}>
                <Text style={styles.gridBtnText}>{t.common.exit}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.gridBtn, !list.isCompleted ? styles.gridBtnPrimary : styles.gridBtnDisabled]}
                onPress={!list.isCompleted ? onShare : undefined}>
                <Text style={!list.isCompleted ? styles.gridBtnText : styles.gridBtnTextDisabled}>
                  {sharedWithUid ? t.common.unshare : t.common.share}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Linha 2: Editar | Excluir | Concluir/Reabrir */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.gridBtn, !list.isCompleted ? styles.gridBtnWarning : styles.gridBtnDisabled]}
              disabled={list.isCompleted}
              onPress={() => handleStartEditName()}>
              <Text style={!list.isCompleted ? styles.gridBtnText : styles.gridBtnTextDisabled}>
                {t.common.edit}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={handleDelete}>
              <Text style={styles.gridBtnText}>{t.common.delete}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gridBtn, styles.gridBtnSuccess]}
              onPress={list.isCompleted ? onReopen : onComplete}>
              <Text style={styles.gridBtnText}>
                {list.isCompleted ? t.common.reopen : t.common.complete}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Linha separadora + Voltar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}>{t.home.altBack}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <AddItemModal
        visible={showAddItem || !!editingItem}
        editItem={editingItem}
        onClose={() => { setShowAddItem(false); setEditingItem(null); }}
        onSave={(item) => editingItem ? updateItem(item) : addItem(item)}
        listType={list.type || 'compras'}
      />
      <AddPriceModal
        visible={!!priceModalItem}
        item={priceModalItem}
        onClose={() => setPriceModalItem(null)}
        onSave={addPrice}
      />
    </View>
  );
}
