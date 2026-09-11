// ===========================
// COMPONENTE: LISTAS (Compras e Tarefas)
// ===========================

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  Alert,
  BackHandler,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors, HEADER_TOP_PADDING } from '../styles/theme';
import { ShoppingList, ListItem, AVAILABLE_UNITS, TASK_UNIT } from '../types';
import { nextId } from '../utils/id';
import { normalizePrice } from '../utils/priceUtils';
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

    itemInfo: { flex: 1 },
    itemName: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    itemNameChecked: { textDecorationLine: 'line-through', color: c.textSecondary },
    itemQuantity: { color: c.textSecondary, fontSize: 12, marginTop: 2 },

    itemPrice: { marginHorizontal: 8, alignItems: 'flex-end' },
    priceText: { color: c.success, fontSize: 14, fontWeight: '600' },

    menuBtn: {
      position: 'absolute',
      right: 20,
      top: HEADER_TOP_PADDING + 8,
      padding: 6,
      gap: 4,
    },
    menuBtnBar: {
      width: 22,
      height: 2.5,
      borderRadius: 1.5,
      backgroundColor: 'white',
    },

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
    addItemSection: {
      padding: 16,
      paddingBottom: 48,
    },
    actionBarRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 16,
      marginTop: 12,
    },
    actionBarBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBarBtnText: { color: 'white', fontSize: 11, fontWeight: '600', textAlign: 'center' },
    gridBtnTextDisabled: { color: c.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
    gridBtnPrimary: { backgroundColor: c.primary },
    gridBtnSuccess: { backgroundColor: c.success },
    gridBtnDanger: { backgroundColor: c.danger },
    gridBtnDisabled: { backgroundColor: c.bgSecondary, opacity: 0.4 },

    // Calculadora clean — no fim da lista
    calcWrap: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
    calcTotal: { color: c.textPrimary, fontSize: 16, fontWeight: '700' },
    calcWarn: { color: c.textSecondary, fontSize: 12, fontStyle: 'italic', marginTop: 4 },

    // Adicionar Item — botões Herdar / Pesquisar
    addItemTools: { flexDirection: 'row', gap: 8, marginTop: 16 },
    addItemToolBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgSecondary },
    addItemToolBtnDashed: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' },
    addItemToolText: { color: c.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
    addItemToolTextDisabled: { color: c.textSecondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },

    // Sub-telas full-screen: Herdar itens / Pesquisar meus itens
    subScreen: { flex: 1, backgroundColor: c.bgMain },
    subContent: { flex: 1 },
    subContentPad: { padding: 16, paddingBottom: 40 },
    subFooter: { padding: 16, paddingBottom: 32, backgroundColor: c.bgMain, borderTopWidth: 1, borderTopColor: c.border },
    subBackBtn: { position: 'absolute', left: 16, top: HEADER_TOP_PADDING + 2, padding: 6 },
    subBackText: { color: 'white', fontSize: 26, fontWeight: '600', lineHeight: 28 },
    subGroupHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
    subGroupTitle: { flex: 1, color: c.textPrimary, fontSize: 15, fontWeight: '700' },
    subSelectAll: { color: c.primary, fontSize: 13, fontWeight: '600', paddingLeft: 12 },
    pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: c.bgCard, borderRadius: 8, borderWidth: 1, borderColor: c.border, marginBottom: 6 },
    pickRowChecked: { backgroundColor: c.successBg, borderColor: c.successBorder },
    pickRowDisabled: { opacity: 0.45 },
    pickName: { flex: 1, color: c.textPrimary, fontSize: 15 },
    pickMeta: { color: c.textSecondary, fontSize: 12 },
    searchInput: { backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 12, color: c.textPrimary, fontSize: 16, margin: 16, marginBottom: 8 },
    subEmpty: { color: c.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },

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

// Foco adiado. `autoFocus` dentro de um <Modal transparent> no Android sobe o
// teclado enquanto o modal ainda está fazendo layout (com adjustResize a janela
// é redimensionada no meio da animação) -> overlay colapsa e o card aparece
// espremido no canto. Focar só depois de `onShow` (modal já apresentado) evita
// a corrida. Ver também o comentário em `modalOverlay` no tema.
const focusAfterShow =
  (ref: React.RefObject<TextInput | null>) => () => {
    setTimeout(() => ref.current?.focus(), 50);
  };

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
  const nameInputRef = useRef<TextInput>(null);

  const [listName, setListName] = useState('');
  const [tagName, setTagName] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [customInputFocused, setCustomInputFocused] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTagName('');
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
    if (!listName.trim()) { Alert.alert(t.common.error, t.lists.nameLabel.replace(' *', '')); return; }

    const today = new Date().toISOString().split('T')[0];
    const duplicate = existingLists.some(l => {
      if (l.isSharedWithMe) return false; // lista de amigo não conta — pode ter nome igual à sua
      const listDay = l.createdAt.split('T')[0];
      return l.name.trim().toLowerCase() === listName.trim().toLowerCase() && listDay === today;
    });

    if (duplicate) {
      Alert.alert(t.alerts.listNameTaken, t.alerts.listNameTakenMsg);
      return;
    }

    const newList: ShoppingList = {
      id: nextId(),
      name: listName.trim(),
      tag_name: tagName.trim() || 'Geral',
      suppliers: [],
      items: [],
      createdAt: new Date().toISOString(),
      isCompleted: false,
      isArchived: false,
      archivedAt: null,
      totalSpent: 0,
    };

    onSave(newList);
    setListName('');
    setTagName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onShow={focusAfterShow(nameInputRef)}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={globalStyles.modalHeader}>
          <Text style={globalStyles.modalTitle}>{t.lists.createTitle}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.lists.createSubtitle}</Text>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* TÍTULO */}
          <Text style={globalStyles.inputLabel}>{t.lists.fieldTitle}</Text>
          <TextInput
            ref={nameInputRef}
            style={globalStyles.input}
            value={listName}
            onChangeText={setListName}
            placeholder={t.lists.placeholderShopping}
            placeholderTextColor="#666"
            maxLength={40}
          />

          {/* TAG */}
          <Text style={globalStyles.inputLabel}>{t.lists.tagLabel}</Text>
          <TagPicker value={tagName} onChange={setTagName} onInputFocusChange={setCustomInputFocused} />
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
  editItem?: ListItem | null;
  existingItems?: ListItem[];
  canInherit?: boolean;
  onOpenInherit?: () => void;
  onOpenSearch?: () => void;
}

function AddItemModal({ visible, onClose, onSave, editItem, existingItems = [],
  canInherit = false, onOpenInherit, onOpenSearch }: AddItemModalProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: winW, height: winH } = useWindowDimensions();
  const nameInputRef = useRef<TextInput>(null);

  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('unidade');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'unit' | 'total'>('unit');
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editItem) {
      setItemName(editItem.name);
      setQuantity(String(editItem.quantity));
      setSelectedUnit(editItem.unit || 'unidade');
      setPrice(editItem.price != null ? String(editItem.price).replace('.', ',') : '');
      setPriceType(editItem.priceType ?? 'unit');
    } else {
      setItemName('');
      setQuantity('1');
      setSelectedUnit('unidade');
      setPrice('');
      setPriceType('unit');
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, editItem, onClose]);

  const getUnitLabel = () => t.units[selectedUnit as keyof typeof t.units] ?? (AVAILABLE_UNITS.find(u => u.value === selectedUnit)?.label || 'Unidade');

  const isTask = selectedUnit === TASK_UNIT;
  const qtyNum = parseInt(quantity, 10) || 1;

  const handleSave = () => {
    if (!itemName.trim()) { Alert.alert(t.common.error, t.shoppingItem.errorRequired); return; }

    // Preço é sempre opcional (e não existe para item-tarefa). Só valida se digitado.
    let parsedPrice: number | null = null;
    if (!isTask && price.trim()) {
      parsedPrice = normalizePrice(price);
      if (parsedPrice === null) { Alert.alert(t.common.error, t.shoppingItem.priceErrorRequired); return; }
    }

    const base = {
      name: itemName.trim(),
      quantity: isTask ? 1 : qtyNum,
      unit: selectedUnit,
      price: parsedPrice,
      priceType,
    };
    const savedItem: ListItem = editItem
      ? { ...editItem, ...base }
      : { id: nextId(), isChecked: false, ...base };

    if (!editItem) {
      // Já existe item com mesmo nome e mesma unidade?
      const norm = (s: string) => s.trim().toLowerCase();
      const dup = existingItems.some(i =>
        norm(i.name) === norm(itemName) && (i.unit ?? 'unidade') === selectedUnit,
      );
      if (dup) {
        Alert.alert(t.alerts.itemExists, t.alerts.itemExistsMsg(itemName.trim()), [
          { text: t.common.cancel, style: 'cancel' },
          { text: t.alerts.itemExistsAdd, onPress: () => { onSave(savedItem); onClose(); } },
        ]);
        return;
      }
    }

    onSave(savedItem);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onShow={focusAfterShow(nameInputRef)}
      onRequestClose={onClose}>
      {/* Card ancorado no topo (não centralizado): com o teclado aberto — que sobe
          sozinho por causa do autofocus — um card centralizado fica atrás dele.
          No topo, o campo de nome fica sempre visível e os campos de baixo são
          alcançados rolando o ScrollView interno. */}
      <View style={[globalStyles.modalOverlay, {
        width: winW, height: winH,
        justifyContent: 'flex-start',
        paddingTop: HEADER_TOP_PADDING + 8,
      }]}>
        <View style={[globalStyles.modalContent, { maxHeight: winH * 0.7 }]}>
         <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[globalStyles.inputLabel, { marginTop: 4 }]}>{t.shoppingItem.addToList}</Text>
          <TextInput
            ref={nameInputRef}
            style={globalStyles.input}
            value={itemName}
            onChangeText={setItemName}
            placeholder={t.shoppingItem.placeholderShopping}
            placeholderTextColor="#666"
          />

          <View style={styles.quantityRow}>
            {!isTask && (
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
            )}
            <View style={styles.unitContainer}>
              <Text style={globalStyles.inputLabel}>{t.shoppingItem.unitLabel}</Text>
              <TouchableOpacity
                style={styles.unitSelector}
                onPress={() => { Keyboard.dismiss(); setShowUnitPicker(true); }}>
                <Text style={styles.unitText}>{getUnitLabel()}</Text>
                <Text style={styles.unitArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preço — opcional; não aparece para item-tarefa */}
          {!isTask && (
            <>
              <Text style={globalStyles.inputLabel}>{t.shoppingItem.priceLabel}</Text>
              <TextInput
                style={globalStyles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0,00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
              {qtyNum > 1 && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
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
            </>
          )}

          {/* Herdar item de lista / Pesquisar meus itens — só ao adicionar (não ao editar) */}
          {!editItem && (
            <View style={styles.addItemTools}>
              <TouchableOpacity
                style={canInherit ? styles.addItemToolBtn : styles.addItemToolBtnDashed}
                disabled={!canInherit}
                onPress={() => { onClose(); onOpenInherit?.(); }}>
                <Text style={canInherit ? styles.addItemToolText : styles.addItemToolTextDisabled}>
                  {t.inheritItems.button}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addItemToolBtn}
                onPress={() => { onClose(); onOpenSearch?.(); }}>
                <Text style={styles.addItemToolText}>{t.itemSearch.button}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.quantityRow, { marginTop: 20 }]}>
            <TouchableOpacity style={[globalStyles.buttonSecondary, { flex: 1 }]} onPress={onClose}>
              <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[globalStyles.buttonPrimary, { flex: 1 }]} onPress={handleSave}>
              <Text style={globalStyles.buttonPrimaryText}>{t.common.save}</Text>
            </TouchableOpacity>
          </View>
         </ScrollView>

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
// SUB-TELA: HERDAR ITENS DE OUTRAS LISTAS
// ===========================
interface InheritItemsViewProps {
  sourceLists: ShoppingList[];
  existingItems: ListItem[];
  onCancel: () => void;
  onConfirm: (items: ListItem[]) => void;
}

const normText = (s: string) => s.trim().toLowerCase();

function InheritItemsView({ sourceLists, existingItems, onCancel, onConfirm }: InheritItemsViewProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // chave de seleção: `${listId}::${itemId}`
  const [selected, setSelected] = useState<Record<string, ListItem>>({});

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { onCancel(); return true; });
    return () => h.remove();
  }, [onCancel]);

  const isDup = (it: ListItem) => existingItems.some(e =>
    normText(e.name) === normText(it.name) && (e.unit ?? 'unidade') === (it.unit ?? 'unidade'));

  const toggle = (listId: number, it: ListItem) => {
    const key = `${listId}::${it.id}`;
    setSelected(prev => {
      const next = { ...prev };
      if (next[key]) delete next[key]; else next[key] = it;
      return next;
    });
  };

  const toggleAll = (l: ShoppingList) => {
    const eligible = l.items.filter(it => !isDup(it));
    const keys = eligible.map(it => `${l.id}::${it.id}`);
    const allSelected = keys.length > 0 && keys.every(k => selected[k]);
    setSelected(prev => {
      const next = { ...prev };
      if (allSelected) keys.forEach(k => delete next[k]);
      else eligible.forEach(it => { next[`${l.id}::${it.id}`] = it; });
      return next;
    });
  };

  const chosen = Object.values(selected);

  const confirm = () => {
    const items: ListItem[] = chosen.map(it => ({
      id: nextId(),
      name: it.name,
      quantity: it.quantity,
      unit: it.unit,
      isChecked: false,
      price: null,
      priceType: it.priceType ?? 'unit',
    }));
    onConfirm(items);
  };

  return (
    <View style={styles.subScreen}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>{t.inheritItems.title}</Text>
        <TouchableOpacity style={styles.subBackBtn} onPress={onCancel}>
          <Text style={styles.subBackText}>‹</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.subContent} contentContainerStyle={styles.subContentPad}>
        {sourceLists.length === 0 && (
          <Text style={styles.subEmpty}>{t.inheritItems.empty}</Text>
        )}
        {sourceLists.map(l => (
          <View key={l.id}>
            <View style={styles.subGroupHeaderRow}>
              <Text style={styles.subGroupTitle} numberOfLines={1}>
                {l.isArchived ? '🗄️ ' : ''}{l.name}
              </Text>
              <TouchableOpacity onPress={() => toggleAll(l)}>
                <Text style={styles.subSelectAll}>{t.inheritItems.selectAll}</Text>
              </TouchableOpacity>
            </View>
            {l.items.map(it => {
              const key = `${l.id}::${it.id}`;
              const dup = isDup(it);
              const checked = !!selected[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.pickRow, checked && styles.pickRowChecked, dup && styles.pickRowDisabled]}
                  disabled={dup}
                  onPress={() => toggle(l.id, it)}
                  activeOpacity={0.7}>
                  <View style={[styles.checkboxView, { marginHorizontal: 0 }, checked && styles.checkboxViewChecked]}>
                    {checked && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.pickName} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.pickMeta}>
                    {dup
                      ? t.itemSearch.alreadyInList
                      : it.unit === TASK_UNIT
                        ? t.units.tarefa
                        : `${it.quantity}${it.unit && it.unit !== 'unidade' ? ' ' + it.unit : ''}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.subFooter}>
        <TouchableOpacity
          style={[globalStyles.buttonPrimary, chosen.length === 0 && { opacity: 0.4 }]}
          disabled={chosen.length === 0}
          onPress={confirm}>
          <Text style={globalStyles.buttonPrimaryText}>{t.inheritItems.add(chosen.length)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 8 }]} onPress={onCancel}>
          <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ===========================
// SUB-TELA: BUSCAR ITENS (varre as listas ativas + arquivadas do usuário)
// ===========================
export interface PoolItem { name: string; unit: string | null }

interface SearchItemsViewProps {
  pool: PoolItem[];
  existingItems: ListItem[];
  onCancel: () => void;
  onConfirm: (items: ListItem[]) => void;
}

function SearchItemsView({ pool, existingItems, onCancel, onConfirm }: SearchItemsViewProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const searchRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, PoolItem>>({});

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { onCancel(); return true; });
    const focusTimer = setTimeout(() => searchRef.current?.focus(), 150);
    return () => { h.remove(); clearTimeout(focusTimer); };
  }, [onCancel]);

  const key = (e: PoolItem) => `${normText(e.name)}::${e.unit ?? ''}`;
  const inList = (e: PoolItem) => existingItems.some(x =>
    normText(x.name) === normText(e.name) && (x.unit ?? 'unidade') === (e.unit ?? 'unidade'));

  const results = useMemo(() => {
    const q = normText(query);
    return pool
      .filter(e => !q || normText(e.name).includes(q))
      .slice(0, 80);
  }, [pool, query]);

  const chosen = Object.values(selected);

  const toggle = (e: PoolItem) => {
    if (inList(e)) return;
    setSelected(prev => {
      const next = { ...prev };
      if (next[key(e)]) delete next[key(e)]; else next[key(e)] = e;
      return next;
    });
  };

  const confirm = () => {
    onConfirm(chosen.map(e => ({
      id: nextId(),
      name: e.name,
      quantity: 1,
      unit: e.unit,
      isChecked: false,
      price: null,
      priceType: 'unit' as const,
    })));
  };

  return (
    <View style={styles.subScreen}>
      <View style={globalStyles.header}>
        <Text style={globalStyles.headerTitle}>{t.itemSearch.title}</Text>
        <TouchableOpacity style={styles.subBackBtn} onPress={onCancel}>
          <Text style={styles.subBackText}>‹</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        ref={searchRef}
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder={t.itemSearch.placeholder}
        placeholderTextColor={colors.textSecondary}
      />

      <ScrollView
        style={styles.subContent}
        contentContainerStyle={styles.subContentPad}
        keyboardShouldPersistTaps="handled">
        {pool.length === 0 ? (
          <Text style={styles.subEmpty}>{t.itemSearch.empty}</Text>
        ) : results.length === 0 ? (
          <Text style={styles.subEmpty}>{t.itemSearch.noResults}</Text>
        ) : (
          results.map(e => {
            const already = inList(e);
            const checked = !!selected[key(e)];
            return (
              <TouchableOpacity
                key={key(e)}
                style={[styles.pickRow, checked && styles.pickRowChecked, already && styles.pickRowDisabled]}
                disabled={already}
                onPress={() => toggle(e)}
                activeOpacity={0.7}>
                <View style={[styles.checkboxView, { marginHorizontal: 0 }, checked && styles.checkboxViewChecked]}>
                  {checked && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.pickName} numberOfLines={1}>{e.name}</Text>
                <Text style={styles.pickMeta}>
                  {already
                    ? t.itemSearch.alreadyInList
                    : e.unit === TASK_UNIT
                      ? t.units.tarefa
                      : (e.unit && e.unit !== 'unidade' ? e.unit : '')}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.subFooter}>
        <TouchableOpacity
          style={[globalStyles.buttonPrimary, chosen.length === 0 && { opacity: 0.4 }]}
          disabled={chosen.length === 0}
          onPress={confirm}>
          <Text style={globalStyles.buttonPrimaryText}>{t.itemSearch.add(chosen.length)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[globalStyles.buttonSecondary, { marginTop: 8 }]} onPress={onCancel}>
          <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  onComplete?: () => void;
  onReopen?: () => void;
  onArchive?: () => void;
  onShare?: () => void;
  onOpenSettings?: () => void;
  isSharedWithMe?: boolean;
  sharedWithUid?: string | null;
}

export function ShoppingListScreen({ list, onBack, onUpdate, onDelete, allLists = [], onNavigateToList,
  onComplete, onReopen, onArchive, onShare, onOpenSettings,
  isSharedWithMe = false, sharedWithUid = null,
}: ShoppingListScreenProps) {
  const { colors, globalStyles } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: winW, height: winH } = useWindowDimensions();
  const notesInputRef = useRef<TextInput>(null);

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [subView, setSubView] = useState<null | 'inherit' | 'search'>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notesText, setNotesText] = useState(list.notes ?? '');
  const notesRef = useRef(notesText);
  notesRef.current = notesText;
  const saveNotesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sempre a versão mais recente de `list` — evita que o debounce de notas grave
  // por cima de edições de itens que chegaram (ex.: do parceiro, via Firestore)
  // depois que o timeout foi agendado mas antes de disparar.
  const listRef = useRef(list);
  listRef.current = list;

  useEffect(() => {
    return () => { if (saveNotesTimeoutRef.current) clearTimeout(saveNotesTimeoutRef.current); };
  }, []);

  const saveNotes = () => {
    onUpdate({ ...listRef.current, notes: notesRef.current });
  };

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    notesRef.current = text;
    if (saveNotesTimeoutRef.current) clearTimeout(saveNotesTimeoutRef.current);
    saveNotesTimeoutRef.current = setTimeout(() => {
      onUpdate({ ...listRef.current, notes: text });
    }, 600);
  };

  // Pool para "Buscar itens": nomes distintos das listas do próprio usuário
  // (ativas + arquivadas), nunca de listas compartilhadas comigo.
  const itemPool = useMemo<PoolItem[]>(() => {
    const map = new Map<string, PoolItem>();
    allLists.filter(l => !l.isSharedWithMe).forEach(l =>
      l.items.forEach(it => {
        const k = `${normText(it.name)}::${it.unit ?? ''}`;
        if (!map.has(k) && it.name.trim()) map.set(k, { name: it.name, unit: it.unit });
      }),
    );
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [allLists]);

  const inheritSources = useMemo(
    () => allLists.filter(l => l.id !== list.id && !l.isSharedWithMe && l.items.length > 0),
    [allLists, list.id],
  );

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
    const trimmed = nameInput.trim();

    if (trimmed && trimmed !== list.name) {
      // Mesma regra do "criar lista": bloqueia nome igual ao de outra lista sua
      // criada no mesmo dia (não vale para listas compartilhadas comigo).
      const day = (list.createdAt ?? '').split('T')[0];
      const clash = allLists.some(l =>
        l.id !== list.id && !l.isSharedWithMe &&
        l.name.trim().toLowerCase() === trimmed.toLowerCase() &&
        (l.createdAt ?? '').split('T')[0] === day,
      );
      if (clash) {
        nameSavedRef.current = true;
        setEditingName(false);
        setNameInput(list.name);
        Alert.alert(t.alerts.listNameTaken, t.alerts.listNameTakenMsg);
        return;
      }
    }

    nameSavedRef.current = true;
    setEditingName(false);
    if (trimmed && trimmed !== list.name) {
      onUpdate({ ...list, name: trimmed });
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editingName) { setEditingName(false); return true; }
      if (subView) { setSubView(null); return true; }
      if (editingItem) { setEditingItem(null); return true; }
      if (showAddItem) { setShowAddItem(false); return true; }
      if (showNotes) { saveNotes(); setShowNotes(false); return true; }
      onBack();
      return true;
    });
    return () => backHandler.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingName, editingItem, showAddItem, subView, showNotes]);

  const checkedItems = list.items.filter(i => i.isChecked);
  // A calculadora aparece quando há item MARCADO com preço (inclui preço 0,00).
  const hasPricedChecked = checkedItems.some(i => i.price != null);
  const total = checkedItems.reduce((sum, i) => {
    if (i.price == null) return sum;
    return sum + (i.priceType === 'total' ? i.price : i.price * i.quantity);
  }, 0);
  const progress = list.items.length > 0 ? checkedItems.length / list.items.length : 0;

  const toggleItem = (itemId: number) => {
    if (list.isCompleted) return;
    const updated = { ...list, items: list.items.map(i => i.id === itemId ? { ...i, isChecked: !i.isChecked } : i) };
    onUpdate(updated);
  };

  const addItem = (item: ListItem) => {
    onUpdate({ ...list, items: [item, ...list.items] });
  };

  // Adiciona vários de uma vez (Herdar itens / Buscar itens)
  const addItems = (items: ListItem[]) => {
    if (!items.length) return;
    onUpdate({ ...list, items: [...items, ...list.items] });
  };

  const updateItem = (item: ListItem) => {
    onUpdate({ ...list, items: list.items.map(i => i.id === item.id ? item : i) });
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

  const handleDelete = () => {
    if (isSharedWithMe) {
      // O colaborador pode excluir ITENS, mas não a lista inteira — só o dono.
      Alert.alert(t.alerts.cantDeleteSharedList, t.alerts.cantDeleteSharedListMsg);
      return;
    }
    Alert.alert(
      t.alerts.deleteList,
      t.alerts.deleteListMsg(list.name),
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.common.delete, style: 'destructive', onPress: () => { onDelete(list.id); onBack(); } },
      ]
    );
  };

  const formatQuantity = (item: ListItem) => {
    const q = `${t.shoppingItem.qtyLabel} ${item.quantity}`;
    if (!item.unit || item.unit === 'unidade') return q;
    const unit = t.units[item.unit as keyof typeof t.units] ?? item.unit;
    return `${q} ${unit}`;
  };

  if (subView === 'inherit') {
    return (
      <InheritItemsView
        sourceLists={inheritSources}
        existingItems={list.items}
        onCancel={() => setSubView(null)}
        onConfirm={(items) => { addItems(items); setSubView(null); }}
      />
    );
  }
  if (subView === 'search') {
    return (
      <SearchItemsView
        pool={itemPool}
        existingItems={list.items}
        onCancel={() => setSubView(null)}
        onConfirm={(items) => { addItems(items); setSubView(null); }}
      />
    );
  }

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
          {t.lists.headerCount(checkedItems.length, list.items.length)}
        </Text>
        {onOpenSettings && (
          <TouchableOpacity style={styles.menuBtn} onPress={onOpenSettings}>
            <View style={styles.menuBtnBar} />
            <View style={styles.menuBtnBar} />
            <View style={styles.menuBtnBar} />
          </TouchableOpacity>
        )}
      </View>

      {/* Título da seção */}
      <Text style={[styles.sectionTitle, { marginTop: 20, marginHorizontal: 16 }]}>
        {t.lists.itemsSection}
      </Text>

      {/* Barra de progresso */}
      <View style={[styles.progressBarContainer, { marginHorizontal: 16 }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Linha de ações — 4 botões: Anotações | Compartilhar | Excluir | Concluir/Reabrir */}
      <View style={styles.actionBarRow}>
        <TouchableOpacity
          style={[styles.actionBarBtn, styles.gridBtnPrimary]}
          onPress={() => setShowNotes(true)}>
          <Text style={styles.actionBarBtnText}>{t.common.notes}</Text>
        </TouchableOpacity>

        {isSharedWithMe ? (
          <TouchableOpacity style={[styles.actionBarBtn, styles.gridBtnDanger]} onPress={onShare}>
            <Text style={styles.actionBarBtnText}>{t.common.exit}</Text>
          </TouchableOpacity>
        ) : (
          // Compartilhamento é independente do estado da lista — uma lista concluída
          // pode ser compartilhada (quem recebe pode reabrir e editar).
          <TouchableOpacity style={[styles.actionBarBtn, styles.gridBtnPrimary]} onPress={onShare}>
            <Text style={styles.actionBarBtnText}>
              {sharedWithUid ? t.common.unshare : t.common.share}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionBarBtn, styles.gridBtnDanger]} onPress={handleDelete}>
          <Text style={styles.actionBarBtnText}>{t.common.delete}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBarBtn, styles.gridBtnSuccess]}
          onPress={list.isCompleted ? onReopen : onComplete}>
          <Text style={styles.actionBarBtnText}>
            {list.isCompleted ? t.common.reopen : t.common.complete}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO — itens. FlatList em vez de ScrollView+map: uma lista pode
          chegar a centenas/milhares de itens (ver Fake user), e um ScrollView
          monta todas as linhas de uma vez — vira trava de rolagem. */}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={globalStyles.scrollContent}
        data={list.items}
        keyExtractor={item => String(item.id)}
        ListEmptyComponent={
          <Text style={globalStyles.emptyText}>{t.lists.noItems}</Text>
        }
        renderItem={({ item }) => (
          <SwipeRow
            disabled={list.isCompleted}
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
                  styles.checkboxView,
                  item.isChecked && styles.checkboxViewChecked,
                ]}>
                  {item.isChecked && (
                    <Text style={styles.checkboxMark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.itemInfo}
                onPress={() => !list.isCompleted && setEditingItem(item)}
                disabled={list.isCompleted}
                activeOpacity={list.isCompleted ? 1 : 0.6}>
                <Text style={[
                  styles.itemName,
                  item.isChecked && styles.itemNameChecked,
                ]}>
                  {item.name}
                </Text>
                {item.unit !== TASK_UNIT && (
                  <Text style={styles.itemQuantity}>{formatQuantity(item)}</Text>
                )}
              </TouchableOpacity>

              {item.price != null && (
                <View style={styles.itemPrice}>
                  <TouchableOpacity
                    onPress={() => !list.isCompleted && setEditingItem(item)}
                    disabled={list.isCompleted}>
                    <Text style={styles.priceText}>R$ {item.price.toFixed(2)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SwipeRow>
        )}
        // Calculadora — aparece sozinha ao haver item concluído com preço.
        // Soma só os itens CONCLUÍDOS. O aviso surge quando algum concluído
        // está sem preço. Falta de preço nunca impede concluir.
        ListFooterComponent={
          hasPricedChecked ? (
            <View style={styles.calcWrap}>
              <Text style={styles.calcTotal}>
                {t.calc.total}: R$ {total.toFixed(2).replace('.', ',')}
              </Text>
              {checkedItems.some(i => i.price == null) && (
                <Text style={styles.calcWarn}>{t.calc.missingPrice}</Text>
              )}
            </View>
          ) : null
        }
      />

      {/* Barra inferior fixa: aberta → "Adicionar item"; concluída (e minha) →
          "Arquivar Lista". Convidado numa lista concluída não vê botão. */}
      {!list.isCompleted ? (
        <View style={styles.bottomContainer}>
          <View style={styles.addItemSection}>
            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => setShowAddItem(true)}>
              <Text style={globalStyles.buttonPrimaryText}>{t.lists.addItem}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !isSharedWithMe && onArchive ? (
        <View style={styles.bottomContainer}>
          <View style={styles.addItemSection}>
            <TouchableOpacity
              style={globalStyles.buttonSecondary}
              onPress={() => { onArchive(); onBack(); }}>
              <Text style={globalStyles.buttonSecondaryText}>{t.lists.archiveBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Só monta um <Modal> quando ele está de fato visível. Ter vários <Modal>
          montados ao mesmo tempo faz o Android medir errado o que está aberto
          (card espremido / backdrop pela metade). */}
      {(showAddItem || !!editingItem) && (
        <AddItemModal
          visible
          editItem={editingItem}
          existingItems={list.items}
          canInherit={inheritSources.length > 0}
          onOpenInherit={() => setSubView('inherit')}
          onOpenSearch={() => setSubView('search')}
          onClose={() => { setShowAddItem(false); setEditingItem(null); }}
          onSave={(item) => editingItem ? updateItem(item) : addItem(item)}
        />
      )}

      {/* MODAL DE ANOTAÇÕES */}
      {showNotes && (
      <Modal
        visible
        animationType="fade"
        transparent
        statusBarTranslucent
        onShow={focusAfterShow(notesInputRef)}
        onRequestClose={() => { saveNotes(); setShowNotes(false); }}>
        <TouchableOpacity
          style={[globalStyles.modalOverlay, { width: winW, height: winH }]}
          activeOpacity={1}
          onPress={() => { saveNotes(); setShowNotes(false); }}>
          <TouchableOpacity activeOpacity={1} style={globalStyles.modalContent} onPress={() => {}}>
            <Text style={[globalStyles.textTitle, { textAlign: 'center', marginBottom: 12 }]}>
              {t.common.notes}
            </Text>
            <TextInput
              ref={notesInputRef}
              style={[styles.notesInput, { minHeight: 160, maxHeight: 280 }]}
              value={notesText}
              onChangeText={handleNotesChange}
              multiline
              placeholder={t.common.notesPlaceholder}
              placeholderTextColor={colors.textMuted}
              editable={!list.isCompleted}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[globalStyles.buttonPrimary, { marginTop: 16 }]}
              onPress={() => { saveNotes(); setShowNotes(false); }}>
              <Text style={globalStyles.buttonPrimaryText}>OK</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      )}
    </View>
  );
}
