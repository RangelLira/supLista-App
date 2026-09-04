// ===========================
// TELA: CONFIGURAÇÕES
// ===========================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { ThemeType, useTheme } from '../contexts/ThemeContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { ShoppingList } from '../types';
import { DeleteAfterPolicy, loadSettings, saveSettings } from '../utils/storage';
import {
  exportLocalBackup,
  listLocalBackups, readLocalBackupFile, LocalBackupFile,
  applyBackupRestore, BackupPayload,
} from '../utils/backupUtils';
import SharingScreen from './SharingScreen';

type SubScreen = null | 'perfil' | 'preferencias' | 'gerenciamento-dados' | 'arquivo-listas' | 'apagar-dados' | 'backup' | 'compartilhamento' | 'sobre';

interface ClearDataOptions {
  lists: boolean;
  archivedLists: boolean;
}

interface Props {
  onClearData: (opts: ClearDataOptions) => void;
  lists: ShoppingList[];
  onDeleteList: (id: number) => void;
  deleteCompletedListsAfter: DeleteAfterPolicy;
  onSetDeleteCompletedListsAfter: (policy: DeleteAfterPolicy) => void;
  // Perfil
  birthDate: string;
  onSetBirthDate: (date: string) => void;
  onChangeUserName: (name: string) => void;
  onRestoreComplete: () => Promise<void>;
}

export default function SettingsScreen({
  onClearData, lists, onDeleteList,
  deleteCompletedListsAfter, onSetDeleteCompletedListsAfter,
  birthDate, onSetBirthDate, onChangeUserName, onRestoreComplete,
}: Props) {
  const { colors, globalStyles, theme, setTheme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const { user, isGoogleConnected, signInWithGoogle, signOutGoogle } = useFirebase();
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  // Estado local do subscreen de backup
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupLastAt, setBackupLastAt] = useState<string | null>(null);
  const [localBackupFiles, setLocalBackupFiles] = useState<LocalBackupFile[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [deleteOpts, setDeleteOpts] = useState({ lists: false, archivedLists: false, tudo: false });
  const [autoDeleteDelay, setAutoDeleteDelay] = useState<'1day' | '1week' | '1month'>(
    deleteCompletedListsAfter && deleteCompletedListsAfter !== 'never'
      ? (deleteCompletedListsAfter as '1day' | '1week' | '1month')
      : '1month'
  );
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [localBirthDate, setLocalBirthDate] = useState(birthDate);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Formata automaticamente DD/MM/AAAA enquanto o usuário digita
  const handleBirthDateChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setLocalBirthDate(formatted);
  };

  const handleSaveBirthDate = () => {
    const match = localBirthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2099) {
        onSetBirthDate(localBirthDate);
        return;
      }
    }
    setLocalBirthDate(birthDate);
  };

  useEffect(() => {
    if (subScreen === 'perfil') {
      loadSettings().then(s => {
        setLocalDisplayName(s.displayName ?? '');
        setLocalBirthDate(s.birthDate ?? '');
      });
    }
    if (subScreen === 'backup') {
      loadSettings().then(s => {
        setBackupLastAt(s.lastBackupAt ?? null);
      });
    }
  }, [subScreen]);

  // Sincroniza localBirthDate quando a prop muda (ex: carregamento inicial)
  useEffect(() => { setLocalBirthDate(birthDate); }, [birthDate]);

  useEffect(() => {
    if (!subScreen) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (subScreen === 'arquivo-listas' || subScreen === 'apagar-dados') {
        setSubScreen('gerenciamento-dados');
      } else {
        setSubScreen(null);
      }
      return true;
    });
    return () => backHandler.remove();
  }, [subScreen]);

  const toggleDeleteOpt = (key: keyof typeof deleteOpts) => {
    if (key === 'tudo') {
      const newVal = !deleteOpts.tudo;
      setDeleteOpts({ lists: newVal, archivedLists: newVal, tudo: newVal });
    } else {
      const updated = { ...deleteOpts, [key]: !deleteOpts[key] };
      updated.tudo = updated.lists && updated.archivedLists;
      setDeleteOpts(updated);
    }
  };

  const hasAnySelected = deleteOpts.lists || deleteOpts.archivedLists;

  const autoDeleteEnabled = deleteCompletedListsAfter !== 'never';

  const handleAutoDeleteToggle = (enabled: boolean) => {
    if (enabled) {
      onSetDeleteCompletedListsAfter(autoDeleteDelay);
    } else {
      onSetDeleteCompletedListsAfter('never');
    }
  };

  const handleAutoDeleteDelay = (delay: '1day' | '1week' | '1month') => {
    setAutoDeleteDelay(delay);
    if (deleteCompletedListsAfter !== 'never') onSetDeleteCompletedListsAfter(delay);
  };

  const handleDeleteData = () => {
    Alert.alert(
      t.alerts.deleteWarning,
      t.alerts.deleteWarningMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        { text: t.alerts.deleteWarningBtn, style: 'destructive', onPress: confirmDeleteData },
      ]
    );
  };

  const confirmDeleteData = () => {
    Alert.alert(
      t.alerts.deleteSure,
      '',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.alerts.deleteSureBtn, style: 'destructive', onPress: () => {
            onClearData({
              lists: deleteOpts.lists,
              archivedLists: deleteOpts.archivedLists,
            });
            setSubScreen('gerenciamento-dados');
            setDeleteOpts({ lists: false, archivedLists: false, tudo: false });
          },
        },
      ]
    );
  };

  const handleSaveDisplayName = async () => {
    const name = localDisplayName.trim();
    if (!name) return;
    await saveSettings({ displayName: name });
    onChangeUserName(name);
  };

  // ===========================
  // MENU PRINCIPAL
  // ===========================
  if (!subScreen) {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.title}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.subtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {[
            { key: 'perfil', icon: '👤', label: t.settings.menuProfile, subtitle: t.settings.menuProfileSubtitle },
            { key: 'preferencias', icon: '⚙️', label: t.settings.menuOptions, subtitle: t.settings.menuOptionsSubtitle },
            { key: 'gerenciamento-dados', icon: '🗂️', label: t.settings.menuDataManagement, subtitle: t.settings.menuDataManagementSubtitle },
            { key: 'backup', icon: '💾', label: t.settings.menuBackup, subtitle: t.settings.menuBackupSubtitle },
            { key: 'compartilhamento', icon: '🔗', label: t.settings.menuShare, subtitle: t.settings.menuShareSubtitle },
            { key: 'sobre', icon: 'ℹ️', label: t.settings.menuAbout, subtitle: t.settings.menuAboutSubtitle },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => setSubScreen(item.key as SubScreen)}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // MEU PERFIL
  // ===========================
  if (subScreen === 'perfil') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuProfile}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuProfileSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {/* Nome */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.profileNameLabel}</Text>
            <TextInput
              style={[globalStyles.input, { marginBottom: 10 }]}
              value={localDisplayName}
              onChangeText={setLocalDisplayName}
              placeholder={t.settings.profileNamePlaceholder}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSaveDisplayName}
            />
            <TouchableOpacity
              style={[globalStyles.buttonPrimary, !localDisplayName.trim() && { opacity: 0.5 }]}
              disabled={!localDisplayName.trim()}
              onPress={handleSaveDisplayName}>
              <Text style={globalStyles.buttonPrimaryText}>{t.settings.profileNameSave}</Text>
            </TouchableOpacity>
          </View>

          {/* Data de nascimento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.profileBirthDateLabel}</Text>
            <TextInput
              style={[globalStyles.input, { marginBottom: 10, textAlign: 'center', fontSize: 18 }]}
              value={localBirthDate}
              onChangeText={handleBirthDateChange}
              onBlur={handleSaveBirthDate}
              placeholder={t.settings.profileBirthDatePlaceholder}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSaveBirthDate}
            />
          </View>

          {/* Conta Google */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.profileAccountLabel}</Text>
            {isGoogleConnected ? (
              <>
                <View style={[styles.infoRow, { marginTop: 8, marginBottom: 12 }]}>
                  <Text style={styles.infoRowIcon}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[globalStyles.textBody, { fontWeight: '600' }]}>
                      {t.settings.profileGoogleConnected}
                    </Text>
                    {user?.email ? (
                      <Text style={[globalStyles.textMuted, { marginTop: 2 }]}>
                        {t.settings.profileGoogleConnectedDesc(user.email)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity
                  style={globalStyles.buttonPrimary}
                  onPress={() => Alert.alert(
                    t.settings.profileGoogleDisconnect,
                    t.settings.profileGoogleDisconnectConfirm,
                    [
                      { text: t.common.cancel, style: 'cancel' },
                      { text: t.settings.profileGoogleDisconnect, style: 'destructive', onPress: async () => {
                        try { await signOutGoogle(); } catch {
                          Alert.alert(t.settings.backupErrorTitle, t.settings.backupRestoreError);
                        }
                      }},
                    ],
                  )}>
                  <Text style={globalStyles.buttonPrimaryText}>{t.settings.profileGoogleDisconnect}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[globalStyles.textMuted, { marginBottom: 12, marginTop: 4 }]}>
                  {t.onboarding.googleDesc}
                </Text>
                <TouchableOpacity
                  style={globalStyles.buttonPrimary}
                  onPress={async () => {
                    const result = await signInWithGoogle();
                    if (result) {
                      onChangeUserName(result.name);
                      setLocalDisplayName(result.name);
                    }
                  }}>
                  <Text style={globalStyles.buttonPrimaryText}>{t.settings.profileGoogleConnect}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // PREFERÊNCIAS
  // ===========================
  if (subScreen === 'preferencias') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuOptions}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuOptionsSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {/* IDIOMA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.languageTitle}</Text>
            <View style={styles.optionButtons}>
              {([
                { value: 'pt' as const, label: t.settings.langPt },
                { value: 'en' as const, label: t.settings.langEn },
                { value: 'es' as const, label: t.settings.langEs },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionButton, lang === opt.value && styles.optionButtonSelected]}
                  onPress={() => setLanguage(opt.value)}>
                  <Text style={[styles.optionButtonText, lang === opt.value && styles.optionButtonTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* TEMA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.themeTitle}</Text>
            <View style={styles.optionButtons}>
              {([
                { value: 'claro' as ThemeType, label: t.settings.themeLight },
                { value: 'escuro' as ThemeType, label: t.settings.themeDark },
                { value: 'auto' as ThemeType, label: t.settings.themeAuto },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionButton, theme === opt.value && styles.optionButtonSelected]}
                  onPress={() => setTheme(opt.value)}>
                  <Text style={[styles.optionButtonText, theme === opt.value && styles.optionButtonTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // GERENCIAMENTO DE DADOS
  // ===========================
  if (subScreen === 'gerenciamento-dados') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuDataManagement}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuDataManagementSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {/* EXCLUSÃO AUTOMÁTICA */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.autoCleanupTitle}</Text>
              <Switch
                value={autoDeleteEnabled}
                onValueChange={handleAutoDeleteToggle}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={autoDeleteEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>

            {autoDeleteEnabled && (
              <View style={[styles.optionButtons, { flexDirection: 'row', marginTop: 14 }]}>
                {([
                  { value: '1day' as const, label: t.settings.autoDeleteDelay1Day },
                  { value: '1week' as const, label: t.settings.autoDeleteDelay1Week },
                  { value: '1month' as const, label: t.settings.autoDeleteDelay1Month },
                ]).map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionButton, { flex: 1 }, autoDeleteDelay === opt.value && styles.optionButtonSelected]}
                    onPress={() => handleAutoDeleteDelay(opt.value)}>
                    <Text style={[styles.optionButtonText, autoDeleteDelay === opt.value && styles.optionButtonTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ARQUIVO DE LISTAS + APAGAR DADOS */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionBtn}
              onPress={() => setSubScreen('arquivo-listas')}>
              <Text style={styles.sectionBtnText}>{t.settings.viewArchivedLists}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sectionBtn, { marginTop: 10 }]}
              onPress={() => setSubScreen('apagar-dados')}>
              <Text style={styles.sectionBtnText}>{t.settings.deleteAllData}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // ARQUIVO DE LISTAS
  // ===========================
  if (subScreen === 'arquivo-listas') {
    const archivedLists = lists.filter(l => l.isArchived);
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.archivedListsTitle}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.archivedListsCount(archivedLists.length)}</Text>
        </View>
        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          <View style={styles.section}>
            {archivedLists.length === 0 ? (
              <Text style={[globalStyles.textMuted, { marginTop: 4 }]}>{t.settings.noArchivedListsDesc}</Text>
            ) : (
              archivedLists.map(list => (
                <View key={list.id} style={styles.archivedListRow}>
                  <Text style={styles.archivedListIcon}>
                    {list.type === 'tarefas' ? '✅' : '🛒'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.archivedListName}>{list.name}</Text>
                    <Text style={styles.archivedListMeta}>
                      {list.items.length} {list.items.length === 1 ? t.settings.archivedListItemSingular : t.settings.archivedListItemPlural}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.archivedDeleteBtn}
                    onPress={() => {
                      Alert.alert(t.alerts.deleteArchivedList, t.alerts.deleteArchivedListMsg(list.name), [
                        { text: t.common.cancel, style: 'cancel' },
                        { text: t.common.delete, style: 'destructive', onPress: () => onDeleteList(list.id) },
                      ]);
                    }}>
                    <Text style={styles.archivedDeleteText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // APAGAR DADOS
  // ===========================
  if (subScreen === 'apagar-dados') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.deleteAllData}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.deletePanelLabel}</Text>
        </View>
        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          <View style={styles.section}>
            {([
              { key: 'listas', stateKey: 'lists' as const, label: t.settings.deletePanelLists },
              { key: 'archivedLists', stateKey: 'archivedLists' as const, label: t.settings.deletePanelArchivedLists },
            ] as const).map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.checkboxRow}
                onPress={() => toggleDeleteOpt(item.stateKey)}>
                <View style={[styles.checkbox, deleteOpts[item.stateKey] && styles.checkboxChecked]}>
                  {deleteOpts[item.stateKey] && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.deleteDivider} />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => toggleDeleteOpt('tudo')}>
              <View style={[styles.checkbox, deleteOpts.tudo && styles.checkboxChecked]}>
                {deleteOpts.tudo && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={[styles.checkboxLabel, styles.checkboxLabelBold]}>{t.settings.deletePanelAll}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteConfirmBtn, !hasAnySelected && styles.deleteConfirmBtnDisabled]}
              disabled={!hasAnySelected}
              onPress={handleDeleteData}>
              <Text style={styles.deleteConfirmBtnText}>{t.settings.deletePanelBtn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // BACKUP
  // ===========================
  if (subScreen === 'backup') {
    const handleDoBackup = async () => {
      setBackupLoading(true);
      try {
        await exportLocalBackup();
        Alert.alert(t.settings.backupSuccessTitle, t.settings.backupSuccessLocalMsg);
        const s = await loadSettings();
        setBackupLastAt(s.lastBackupAt ?? null);
      } catch {
        Alert.alert(t.settings.backupErrorTitle, t.settings.backupErrorMsg);
      } finally {
        setBackupLoading(false);
      }
    };

    const handleRestore = async () => {
      setBackupLoading(true);
      const files = await listLocalBackups();
      setBackupLoading(false);
      if (files.length === 0) {
        Alert.alert(t.settings.backupErrorTitle, t.settings.backupRestoreNoLocal);
        return;
      }
      setLocalBackupFiles(files);
      setShowRestoreModal(true);
    };

    const lastBackupLabel = backupLastAt
      ? new Date(backupLastAt).toLocaleString()
      : t.settings.backupLastBackupNever;

    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuBackup}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuBackupSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {/* ÚLTIMO BACKUP */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.backupLastBackupLabel}</Text>
            <Text style={[globalStyles.textMuted, { marginTop: 4 }]}>{lastBackupLabel}</Text>
          </View>

          {/* AÇÕES */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[globalStyles.buttonPrimary, { marginBottom: 12 }, backupLoading && { opacity: 0.5 }]}
              onPress={handleDoBackup}
              disabled={backupLoading}>
              <Text style={globalStyles.buttonPrimaryText}>{t.settings.backupDoBackupBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, backupLoading && { opacity: 0.5 }]}
              onPress={handleRestore}
              disabled={backupLoading}>
              <Text style={globalStyles.buttonSecondaryText}>{t.settings.backupRestoreBtn}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL — seleção de arquivo de backup local */}
        <Modal
          visible={showRestoreModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowRestoreModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{t.settings.backupRestoreSelectTitle}</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {localBackupFiles.map(file => (
                  <TouchableOpacity
                    key={file.path}
                    style={styles.backupFileRow}
                    onPress={() => {
                      setShowRestoreModal(false);
                      readLocalBackupFile(
                        file.path,
                        async (payload: BackupPayload) => {
                          await applyBackupRestore(payload);
                          await onRestoreComplete();
                          Alert.alert(t.settings.backupSuccessTitle, t.settings.backupRestoreSuccess);
                        },
                        {
                          confirmTitle: t.settings.backupRestoreConfirmTitle,
                          confirmMsg: t.settings.backupRestoreConfirmMsg,
                          cancel: t.common.cancel,
                          restore: t.settings.backupRestoreBtn2,
                          errorTitle: t.settings.backupErrorTitle,
                          errorMsg: t.settings.backupRestoreError,
                        },
                      );
                    }}>
                    <Text style={styles.backupFileName}>{file.name}</Text>
                    {file.mtime && (
                      <Text style={styles.backupFileMtime}>
                        {file.mtime.toLocaleDateString()} {file.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={[globalStyles.buttonSecondary, { marginTop: 16 }]}
                onPress={() => setShowRestoreModal(false)}>
                <Text style={globalStyles.buttonSecondaryText}>{t.common.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ===========================
  // COMPARTILHAMENTO
  // ===========================
  if (subScreen === 'compartilhamento') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuShare}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuShareSubtitle}</Text>
        </View>
        <SharingScreen />
      </View>
    );
  }

  // ===========================
  // SOBRE
  // ===========================
  if (subScreen === 'sobre') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuAbout}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuAboutSubtitle}</Text>
        </View>

        <View style={styles.aboutContainer}>
          <Text style={styles.aboutAppName}>supList</Text>
          <Text style={styles.aboutVersion}>Versão 1.0</Text>
          <Text style={styles.aboutTagline}>"Sua lista, sempre à mão"</Text>

          <View style={styles.aboutDivider} />

          <Text style={styles.aboutLabel}>Desenvolvido por</Text>
          <Text style={styles.aboutDeveloper}>Rangel Lira</Text>

          <View style={styles.aboutDivider} />

          <Text style={styles.aboutFeatures}>Features principais</Text>
          <Text style={styles.aboutFeatureItem}>Listas de compras e tarefas</Text>
          <Text style={styles.aboutFeatureItem}>Compartilhamento em tempo real</Text>
          <Text style={styles.aboutFeatureItem}>Backup local</Text>
          <Text style={styles.aboutFeatureItem}>Suporte a múltiplos idiomas</Text>

          <View style={styles.aboutDivider} />
          <Text style={styles.aboutCopyright}>© 2026 supList. Todos os direitos reservados.</Text>
        </View>
      </View>
    );
  }

  return null;
}

function createStyles(c: typeof import('../styles/theme').darkColors) { return StyleSheet.create({
  menuItem: {
    backgroundColor: c.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  menuIcon: { fontSize: 24, marginRight: 14 },
  menuInfo: { flex: 1 },
  menuLabel: { color: c.textPrimary, fontSize: 16, fontWeight: '600' },
  menuSubtitle: { color: c.textSecondary, fontSize: 13, marginTop: 2 },

  section: {
    backgroundColor: c.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: c.border,
  },
  sectionTitle: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 0,
    flex: 1,
  },
  optionButtons: { gap: 8 },
  optionButton: {
    backgroundColor: c.bgSecondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: c.primary,
    borderColor: c.primaryLight,
  },
  optionButtonText: {
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: 'white',
    fontWeight: '700',
  },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginBottom: 0,
  },

  sectionBtn: {
    backgroundColor: c.primary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center' as const,
  },
  sectionBtnText: { color: 'white', fontSize: 14, fontWeight: '600' as const },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: c.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  checkboxTick: { color: 'white', fontSize: 13, fontWeight: '700' },
  checkboxLabel: { color: c.textPrimary, fontSize: 14 },
  checkboxLabelBold: { fontWeight: '700' },
  deleteDivider: { height: 1, backgroundColor: c.border, marginVertical: 8 },
  deleteConfirmBtn: {
    backgroundColor: c.primary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 14,
  },
  deleteConfirmBtnDisabled: {
    backgroundColor: c.bgSecondary,
    borderWidth: 1,
    borderColor: c.border,
  },
  deleteConfirmBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // Listas arquivadas
  archivedListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.bgSecondary,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  archivedListIcon: { fontSize: 18 },
  archivedListName: { color: c.textPrimary, fontSize: 14, fontWeight: '500' },
  archivedListMeta: { color: c.textSecondary, fontSize: 12 },
  archivedDeleteBtn: { padding: 6 },
  archivedDeleteText: { fontSize: 20 },

  aboutContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 32,
    paddingTop: 48,
  },
  aboutAppName: {
    color: c.primary,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  aboutVersion: {
    color: c.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  aboutTagline: {
    color: c.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  aboutDivider: {
    width: '60%',
    height: 1,
    backgroundColor: c.border,
    marginVertical: 24,
  },
  aboutLabel: {
    color: c.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  aboutDeveloper: {
    color: c.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  aboutFeatures: {
    color: c.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  aboutFeatureItem: {
    color: c.textMuted,
    fontSize: 14,
    lineHeight: 26,
    alignSelf: 'flex-start',
  },
  aboutCopyright: {
    color: c.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoRowIcon: { fontSize: 20, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: c.bgCard, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, marginBottom: 16 },
  backupFileRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.borderCard },
  backupFileName: { fontSize: 14, color: c.textPrimary, fontWeight: '500' },
  backupFileMtime: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
}); }
