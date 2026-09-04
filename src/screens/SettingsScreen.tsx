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
import { requestNotificationPermission } from '../utils/notificationUtils';
import {
  exportLocalBackup, exportCloudBackup,
  listLocalBackups, readLocalBackupFile, LocalBackupFile,
  importCloudBackup,
  applyBackupRestore, BackupPayload,
} from '../utils/backupUtils';
import SharingScreen from './SharingScreen';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const devSeed = __DEV__ ? require('../dev/seedInjector') : null;

type SubScreen = null | 'perfil' | 'preferencias' | 'notificacoes' | 'recursos-especiais' | 'hidratacao' | 'gerenciamento-dados' | 'arquivo-listas' | 'apagar-dados' | 'backup' | 'compartilhamento' | 'sobre';

interface ClearDataOptions {
  lists: boolean;
  pendencias: boolean;
  compromissos: boolean;
  rotinas: boolean;
  archivedLists: boolean;
}

interface Props {
  onClearData: (opts: ClearDataOptions) => void;
  autoMigrationEnabled: boolean;
  onToggleAutoMigration: (value: boolean) => void;
  lists: ShoppingList[];
  onDeleteList: (id: number) => void;
  deleteCompletedEventsAfter: DeleteAfterPolicy;
  deleteCompletedPendingsAfter: DeleteAfterPolicy;
  deleteCompletedRotinasAfter: DeleteAfterPolicy;
  deleteCompletedListsAfter: DeleteAfterPolicy;
  onSetDeleteCompletedEventsAfter: (policy: DeleteAfterPolicy) => void;
  onSetDeleteCompletedPendingsAfter: (policy: DeleteAfterPolicy) => void;
  onSetDeleteCompletedRotinasAfter: (policy: DeleteAfterPolicy) => void;
  onSetDeleteCompletedListsAfter: (policy: DeleteAfterPolicy) => void;
  // Notificações
  notificationsEnabled: boolean;
  notificationMode: 'daily' | 'per-event';
  notificationTime: string;
  notificationLeadMinutes: number;
  onToggleNotifications: (enabled: boolean) => void;
  onSetNotificationMode: (mode: 'daily' | 'per-event') => void;
  onSetNotificationTime: (time: string) => void;
  onSetNotificationLead: (minutes: number) => void;
  notificationsListsEnabled: boolean;
  notificationsPendingsEnabled: boolean;
  onToggleNotificationsLists: (v: boolean) => void;
  onToggleNotificationsPendings: (v: boolean) => void;
  // Hidratação
  waterTrackerEnabled: boolean;
  waterDailyGoalMl: number;
  waterReminderEnabled: boolean;
  waterReminderIntervalMinutes: number;
  waterStartTime: string;
  waterEndTime: string;
  onSetWaterTrackerEnabled: (v: boolean) => void;
  onSetWaterDailyGoalMl: (ml: number) => void;
  onToggleWaterReminder: (v: boolean) => void;
  onSetWaterReminderInterval: (minutes: number) => void;
  onSetWaterStartTime: (time: string) => void;
  onSetWaterEndTime: (time: string) => void;
  // Perfil
  birthDate: string;
  onSetBirthDate: (date: string) => void;
  onChangeUserName: (name: string) => void;
  onRestoreComplete: () => Promise<void>;
}

export default function SettingsScreen({
  onClearData, autoMigrationEnabled, onToggleAutoMigration, lists, onDeleteList,
  deleteCompletedEventsAfter, deleteCompletedPendingsAfter, deleteCompletedRotinasAfter,
  deleteCompletedListsAfter,
  onSetDeleteCompletedEventsAfter, onSetDeleteCompletedPendingsAfter,
  onSetDeleteCompletedRotinasAfter, onSetDeleteCompletedListsAfter,
  notificationsEnabled, notificationMode, notificationTime, notificationLeadMinutes,
  onToggleNotifications, onSetNotificationMode, onSetNotificationTime, onSetNotificationLead,
  notificationsListsEnabled, notificationsPendingsEnabled,
  onToggleNotificationsLists, onToggleNotificationsPendings,
  waterTrackerEnabled, waterDailyGoalMl, waterReminderEnabled, waterReminderIntervalMinutes,
  waterStartTime, waterEndTime,
  onSetWaterTrackerEnabled, onSetWaterDailyGoalMl, onToggleWaterReminder,
  onSetWaterReminderInterval, onSetWaterStartTime, onSetWaterEndTime,
  birthDate, onSetBirthDate, onChangeUserName, onRestoreComplete,
}: Props) {
  const { colors, globalStyles, theme, setTheme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const { user, userId, isGoogleConnected, signInWithGoogle, signOutGoogle } = useFirebase();
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  // Estado local do subscreen de backup
  const [backupMode, setBackupModeLocal] = useState<'auto' | 'manual'>('manual');
  const [backupLocation, setBackupLocationLocal] = useState<'local' | 'cloud'>('local');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupLastAt, setBackupLastAt] = useState<string | null>(null);
  const [localBackupFiles, setLocalBackupFiles] = useState<LocalBackupFile[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [deleteOpts, setDeleteOpts] = useState({ lists: false, pendencias: false, compromissos: false, rotinas: false, archivedLists: false, tudo: false });
  const [autoDeleteDelay, setAutoDeleteDelay] = useState<'1day' | '1week' | '1month'>(() => {
    const found = [deleteCompletedEventsAfter, deleteCompletedPendingsAfter, deleteCompletedRotinasAfter, deleteCompletedListsAfter]
      .find(p => p && p !== 'never');
    return (found as '1day' | '1week' | '1month') ?? '1month';
  });
  const [autoDeleteSectionOpen, setAutoDeleteSectionOpen] = useState(() =>
    deleteCompletedEventsAfter !== 'never' ||
    deleteCompletedPendingsAfter !== 'never' ||
    deleteCompletedRotinasAfter !== 'never' ||
    deleteCompletedListsAfter !== 'never'
  );
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [localBirthDate, setLocalBirthDate] = useState(birthDate);
  const [waterGoalInput, setWaterGoalInput] = useState(() =>
    lang === 'en' ? (waterDailyGoalMl / 29.5735).toFixed(1) : (waterDailyGoalMl / 1000).toFixed(1)
  );
  const [waterIntervalInput, setWaterIntervalInput] = useState(() =>
    String(waterReminderIntervalMinutes > 0 ? waterReminderIntervalMinutes : 60)
  );
  const [waterStartTimeInput, setWaterStartTimeInput] = useState(waterStartTime);
  const [waterEndTimeInput, setWaterEndTimeInput] = useState(waterEndTime);
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

  const handleWaterGoalBlur = () => {
    const parsed = parseFloat(waterGoalInput.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      const ml = lang === 'en' ? Math.round(parsed * 29.5735) : Math.round(parsed * 1000);
      onSetWaterDailyGoalMl(ml);
      setWaterGoalInput(lang === 'en' ? (ml / 29.5735).toFixed(1) : (ml / 1000).toFixed(1));
    } else {
      setWaterGoalInput(lang === 'en' ? (waterDailyGoalMl / 29.5735).toFixed(1) : (waterDailyGoalMl / 1000).toFixed(1));
    }
  };

  const handleWaterIntervalBlur = () => {
    const val = parseInt(waterIntervalInput, 10);
    if (!isNaN(val) && val >= 1 && val <= 720) {
      onSetWaterReminderInterval(val);
    } else {
      setWaterIntervalInput(String(Math.min(waterReminderIntervalMinutes > 0 ? waterReminderIntervalMinutes : 60, 720)));
    }
  };

  const validateAndSaveTime = (raw: string, setCb: (v: string) => void, saveCb: (v: string) => void, fallback: string) => {
    const trimmed = raw.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        setCb(formatted);
        saveCb(formatted);
        return;
      }
    }
    setCb(fallback);
  };

  const handleWaterStartTimeBlur = () =>
    validateAndSaveTime(waterStartTimeInput, setWaterStartTimeInput, onSetWaterStartTime, waterStartTime);

  const handleWaterEndTimeBlur = () =>
    validateAndSaveTime(waterEndTimeInput, setWaterEndTimeInput, onSetWaterEndTime, waterEndTime);

  useEffect(() => {
    if (subScreen === 'perfil' || subScreen === 'compartilhamento') {
      loadSettings().then(s => {
        setLocalDisplayName(s.displayName ?? '');
        setLocalBirthDate(s.birthDate ?? '');
      });
    }
    if (subScreen === 'backup') {
      loadSettings().then(s => {
        setBackupModeLocal(s.backupMode ?? 'manual');
        setBackupLocationLocal(s.backupLocation ?? 'local');
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
      } else if (subScreen === 'hidratacao') {
        setSubScreen('recursos-especiais');
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
      setDeleteOpts({ lists: newVal, pendencias: newVal, compromissos: newVal, rotinas: newVal, archivedLists: newVal, tudo: newVal });
    } else {
      const updated = { ...deleteOpts, [key]: !deleteOpts[key] };
      updated.tudo = updated.lists && updated.pendencias && updated.compromissos && updated.rotinas && updated.archivedLists;
      setDeleteOpts(updated);
    }
  };

  const hasAnySelected = deleteOpts.lists || deleteOpts.pendencias || deleteOpts.compromissos || deleteOpts.rotinas || deleteOpts.archivedLists;

  const autoDeleteMasterEnabled =
    deleteCompletedEventsAfter !== 'never' ||
    deleteCompletedPendingsAfter !== 'never' ||
    deleteCompletedRotinasAfter !== 'never' ||
    deleteCompletedListsAfter !== 'never';

  const handleAutoDeleteMaster = (enabled: boolean) => {
    setAutoDeleteSectionOpen(enabled);
    if (enabled) {
      setAutoDeleteDelay('1month');
    } else {
      onSetDeleteCompletedEventsAfter('never');
      onSetDeleteCompletedPendingsAfter('never');
      onSetDeleteCompletedRotinasAfter('never');
      onSetDeleteCompletedListsAfter('never');
    }
  };

  const handleAutoDeleteType = (setter: (p: DeleteAfterPolicy) => void, enabled: boolean) => {
    setter(enabled ? autoDeleteDelay : 'never');
  };

  const handleAutoDeleteDelay = (delay: '1day' | '1week' | '1month') => {
    setAutoDeleteDelay(delay);
    if (deleteCompletedEventsAfter !== 'never') onSetDeleteCompletedEventsAfter(delay);
    if (deleteCompletedPendingsAfter !== 'never') onSetDeleteCompletedPendingsAfter(delay);
    if (deleteCompletedRotinasAfter !== 'never') onSetDeleteCompletedRotinasAfter(delay);
    if (deleteCompletedListsAfter !== 'never') onSetDeleteCompletedListsAfter(delay);
  };

  const LEAD_OPTIONS = [15, 30, 60] as const;

  const handleToggleNotificationsUI = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(t.settings.notificationsTitle, t.settings.notificationsPermDenied);
        return;
      }
    }
    onToggleNotifications(value);
  };

  const handleNotificationTimeChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9:]/g, '').slice(0, 5);
    onSetNotificationTime(cleaned);
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
              pendencias: deleteOpts.pendencias,
              compromissos: deleteOpts.compromissos,
              rotinas: deleteOpts.rotinas,
              archivedLists: deleteOpts.archivedLists,
            });
            setSubScreen('gerenciamento-dados');
            setDeleteOpts({ lists: false, pendencias: false, compromissos: false, rotinas: false, archivedLists: false, tudo: false });
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
            { key: 'notificacoes', icon: '🔔', label: t.settings.menuNotifications, subtitle: t.settings.menuNotificationsSubtitle },
            { key: 'recursos-especiais', icon: '✨', label: t.settings.menuSpecialFeatures, subtitle: t.settings.menuSpecialFeaturesSubtitle },
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

          {/* ——— Ferramentas de DEV (invisíveis em produção) ——— */}
          {__DEV__ && (
            <View style={styles.devSection}>
              <Text style={styles.devSectionTitle}>DEV TOOLS</Text>

              <TouchableOpacity
                style={[styles.devBtn, { backgroundColor: colors.primary + '22' }]}
                onPress={() => {
                  Alert.alert(
                    'Carregar Banco de Dados de Teste',
                    `Injeta ${devSeed?.seedStats?.total ?? '516+'} registros simulados (eventos, listas, rotinas). Dados atuais serão mantidos se não houver conflito de IDs.\n\nReinicie o app após injetar.`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Injetar',
                        onPress: async () => {
                          await devSeed?.injectSeedData?.();
                          Alert.alert('Pronto!', 'Banco de teste injetado. Feche e abra o app para ver os dados.');
                        },
                      },
                    ],
                  );
                }}>
                <Text style={[styles.devBtnIcon]}>💾</Text>
                <View style={styles.devBtnInfo}>
                  <Text style={[styles.devBtnLabel, { color: colors.primary }]}>Injetar Banco de Teste</Text>
                  <Text style={styles.devBtnSubtitle}>516+ registros simulados (mar–set 2026)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devBtn, { backgroundColor: colors.danger + '22' }]}
                onPress={() => {
                  Alert.alert(
                    'Limpar Todos os Dados',
                    'Remove TODOS os dados do AsyncStorage (eventos, listas, rotinas, configurações). Irreversível.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Limpar',
                        style: 'destructive',
                        onPress: async () => {
                          await devSeed?.clearAllData?.();
                          Alert.alert('Limpo!', 'AsyncStorage zerado. Feche e abra o app.');
                        },
                      },
                    ],
                  );
                }}>
                <Text style={styles.devBtnIcon}>🗑️</Text>
                <View style={styles.devBtnInfo}>
                  <Text style={[styles.devBtnLabel, { color: colors.danger }]}>Limpar Todos os Dados</Text>
                  <Text style={styles.devBtnSubtitle}>Zera AsyncStorage (irreversível)</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
  // NOTIFICAÇÕES
  // ===========================
  if (subScreen === 'notificacoes') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuNotifications}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuNotificationsSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {/* Eventos do dia */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.notificationsEventsLabel}</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotificationsUI}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={notificationsEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>

            {notificationsEnabled && (
              <>
                <Text style={[styles.policyLabel, { marginTop: 12 }]}>{t.settings.notificationsMode}</Text>
                <View style={[styles.optionButtons, { marginBottom: 12 }]}>
                  {([
                    { value: 'daily' as const, label: t.settings.notificationsModeDaily },
                    { value: 'per-event' as const, label: t.settings.notificationsModePerEvent },
                  ]).map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.optionButton, notificationMode === opt.value && styles.optionButtonSelected]}
                      onPress={() => onSetNotificationMode(opt.value)}>
                      <Text style={[styles.optionButtonText, notificationMode === opt.value && styles.optionButtonTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {notificationMode === 'daily' && (
                  <>
                    <Text style={styles.policyLabel}>{t.settings.notificationsTime}</Text>
                    <TextInput
                      style={[globalStyles.input, { textAlign: 'center', fontSize: 18 }]}
                      value={notificationTime}
                      onChangeText={handleNotificationTimeChange}
                      placeholder="08:00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                    />
                  </>
                )}

                {notificationMode === 'per-event' && (
                  <>
                    <View style={[styles.optionButtons, { flexDirection: 'row' }]}>
                      {LEAD_OPTIONS.map((min, idx) => (
                        <TouchableOpacity
                          key={min}
                          style={[styles.optionButton, { flex: 1 }, notificationLeadMinutes === min && styles.optionButtonSelected]}
                          onPress={() => onSetNotificationLead(min)}>
                          <Text style={[styles.optionButtonText, notificationLeadMinutes === min && styles.optionButtonTextSelected]}>
                            {t.settings.notificationsLeadOptions[idx]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          {/* Listas */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.notificationsListsToggle}</Text>
              <Switch
                value={notificationsListsEnabled}
                onValueChange={onToggleNotificationsLists}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={notificationsListsEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>
          </View>

          {/* Pendências */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.notificationsPendingsToggle}</Text>
              <Switch
                value={notificationsPendingsEnabled}
                onValueChange={onToggleNotificationsPendings}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={notificationsPendingsEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>
          </View>

          {/* Alerta de hidratação */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.notificationsWaterSection}</Text>
              <Switch
                value={waterReminderEnabled}
                onValueChange={onToggleWaterReminder}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={waterReminderEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>

            {waterReminderEnabled && (
              <>
                <Text style={[styles.policyLabel, { marginTop: 12 }]}>{t.settings.waterIntervalLabel}</Text>
                <View style={[styles.waterGoalRow, { marginBottom: 12 }]}>
                  <TextInput
                    style={[globalStyles.input, styles.waterGoalInput]}
                    value={waterIntervalInput}
                    onChangeText={setWaterIntervalInput}
                    onBlur={handleWaterIntervalBlur}
                    keyboardType="number-pad"
                    placeholder={t.settings.waterIntervalPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.waterGoalSuffix}>{t.settings.waterIntervalUnit}</Text>
                </View>

                <View style={styles.waterTimeRow}>
                  <View style={styles.waterTimeField}>
                    <Text style={styles.policyLabel}>{t.settings.waterStartTimeLabel}</Text>
                    <TextInput
                      style={[globalStyles.input, styles.waterTimeInput]}
                      value={waterStartTimeInput}
                      onChangeText={setWaterStartTimeInput}
                      onBlur={handleWaterStartTimeBlur}
                      keyboardType="numeric"
                      placeholder="08:00"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={5}
                    />
                  </View>
                  <View style={styles.waterTimeField}>
                    <Text style={styles.policyLabel}>{t.settings.waterEndTimeLabel}</Text>
                    <TextInput
                      style={[globalStyles.input, styles.waterTimeInput]}
                      value={waterEndTimeInput}
                      onChangeText={setWaterEndTimeInput}
                      onBlur={handleWaterEndTimeBlur}
                      keyboardType="numeric"
                      placeholder="18:00"
                      placeholderTextColor={colors.textSecondary}
                      maxLength={5}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ===========================
  // RECURSOS ESPECIAIS
  // ===========================
  if (subScreen === 'recursos-especiais') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuSpecialFeatures}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuSpecialFeaturesSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {[
            { key: 'hidratacao', icon: '💧', label: t.settings.menuWater, subtitle: t.settings.menuWaterSubtitle },
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
  // CONTADOR DE HIDRATAÇÃO
  // ===========================
  if (subScreen === 'hidratacao') {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.settings.menuWater}</Text>
          <Text style={globalStyles.headerSubtitle}>{t.settings.menuWaterSubtitle}</Text>
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.waterEnabledLabel}</Text>
              <Switch
                value={waterTrackerEnabled}
                onValueChange={onSetWaterTrackerEnabled}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={waterTrackerEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>

            {waterTrackerEnabled && (
              <>
                <Text style={[styles.policyLabel, { marginTop: 16 }]}>{t.settings.waterGoalLabel}</Text>
                <View style={styles.waterGoalRow}>
                  <TextInput
                    style={[globalStyles.input, styles.waterGoalInput]}
                    value={waterGoalInput}
                    onChangeText={setWaterGoalInput}
                    onBlur={handleWaterGoalBlur}
                    keyboardType="decimal-pad"
                    placeholder={t.settings.waterGoalPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <Text style={styles.waterGoalSuffix}>{t.settings.waterGoalUnit}</Text>
                </View>
              </>
            )}
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
          {/* MIGRAÇÃO AUTOMÁTICA */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{t.settings.autoMigrateTitle}</Text>
                <Text style={globalStyles.textMuted}>{t.settings.autoMigrateDesc}</Text>
              </View>
              <Switch
                value={autoMigrationEnabled}
                onValueChange={onToggleAutoMigration}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={autoMigrationEnabled ? colors.primaryLight : colors.textSecondary}
              />
            </View>
          </View>

          {/* EXCLUSÃO AUTOMÁTICA */}
          <View style={styles.section}>
            <View style={styles.notifRow}>
              <Text style={styles.sectionTitle}>{t.settings.autoCleanupTitle}</Text>
              <Switch
                value={autoDeleteSectionOpen}
                onValueChange={handleAutoDeleteMaster}
                trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                thumbColor={autoDeleteSectionOpen ? colors.primaryLight : colors.textSecondary}
              />
            </View>

            {autoDeleteSectionOpen && (
              <>
                {([
                  { label: t.settings.deletePanelCompromissos, current: deleteCompletedEventsAfter, setter: onSetDeleteCompletedEventsAfter },
                  { label: t.settings.deletePanelRotinas, current: deleteCompletedRotinasAfter, setter: onSetDeleteCompletedRotinasAfter },
                  { label: t.settings.deletePanelLists, current: deleteCompletedListsAfter, setter: onSetDeleteCompletedListsAfter },
                  { label: t.settings.deletePanelPendencias, current: deleteCompletedPendingsAfter, setter: onSetDeleteCompletedPendingsAfter },
                ] as const).map(({ label, current, setter }) => (
                  <View key={label} style={styles.subToggleRow}>
                    <Text style={styles.subToggleLabel}>{label}</Text>
                    <Switch
                      value={current !== 'never'}
                      onValueChange={(v) => handleAutoDeleteType(setter, v)}
                      trackColor={{ false: colors.bgSecondary, true: colors.primary }}
                      thumbColor={current !== 'never' ? colors.primaryLight : colors.textSecondary}
                    />
                  </View>
                ))}

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
              </>
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
              { key: 'compromissos', stateKey: 'compromissos' as const, label: t.settings.deletePanelCompromissos },
              { key: 'rotinas', stateKey: 'rotinas' as const, label: t.settings.deletePanelRotinas },
              { key: 'listas', stateKey: 'lists' as const, label: t.settings.deletePanelLists },
              { key: 'pendencias', stateKey: 'pendencias' as const, label: t.settings.deletePanelPendencias },
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
    const handleSaveBackupPrefs = async (mode: 'auto' | 'manual', location: 'local' | 'cloud') => {
      setBackupModeLocal(mode);
      setBackupLocationLocal(location);
      await saveSettings({ backupMode: mode, backupLocation: location });
    };

    const handleDoBackup = async () => {
      setBackupLoading(true);
      try {
        if (backupLocation === 'cloud') {
          if (!userId) return;
          await exportCloudBackup(userId);
          Alert.alert(t.settings.backupSuccessTitle, t.settings.backupSuccessCloudMsg);
        } else {
          await exportLocalBackup();
          Alert.alert(t.settings.backupSuccessTitle, t.settings.backupSuccessLocalMsg);
        }
        const s = await loadSettings();
        setBackupLastAt(s.lastBackupAt ?? null);
      } catch {
        Alert.alert(t.settings.backupErrorTitle, t.settings.backupErrorMsg);
      } finally {
        setBackupLoading(false);
      }
    };

    const handleRestore = async () => {
      if (backupLocation === 'cloud') {
        if (!userId) {
          Alert.alert(t.settings.backupErrorTitle, t.onboarding.backupCloudDisabledHint);
          return;
        }
        setBackupLoading(true);
        try {
          await importCloudBackup(
            userId,
            async (payload: BackupPayload) => {
              await applyBackupRestore(payload);
              await onRestoreComplete();
              Alert.alert(t.settings.backupSuccessTitle, t.settings.backupRestoreSuccess);
            },
            {
              confirmTitle: t.settings.backupRestoreConfirmTitle,
              confirmMsg: (date: string) => t.settings.backupRestoreConfirmMsgCloud(date),
              cancel: t.common.cancel,
              restore: t.settings.backupRestoreBtn2,
              errorTitle: t.settings.backupErrorTitle,
              errorMsg: t.settings.backupRestoreError,
              noBackupMsg: t.settings.backupRestoreNoCloud,
            },
          );
        } catch {
          Alert.alert(t.settings.backupErrorTitle, t.settings.backupRestoreError);
        } finally {
          setBackupLoading(false);
        }
      } else {
        // Listar backups locais disponíveis
        setBackupLoading(true);
        const files = await listLocalBackups();
        setBackupLoading(false);
        if (files.length === 0) {
          Alert.alert(t.settings.backupErrorTitle, t.settings.backupRestoreNoLocal);
          return;
        }
        setLocalBackupFiles(files);
        setShowRestoreModal(true);
      }
    };

    const handleConnectGoogle = async () => {
      const result = await signInWithGoogle();
      if (result) {
        onChangeUserName(result.name);
      }
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
          {/* FREQUÊNCIA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.onboarding.backupModeLabel}</Text>
            <View style={[styles.optionButtons, { flexDirection: 'row', marginTop: 10 }]}>
              {([
                { value: 'auto'   as const, label: t.onboarding.backupModeAuto },
                { value: 'manual' as const, label: t.onboarding.backupModeManual },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionButton, { flex: 1 }, backupMode === opt.value && styles.optionButtonSelected]}
                  onPress={() => handleSaveBackupPrefs(opt.value, backupLocation)}>
                  <Text style={[styles.optionButtonText, backupMode === opt.value && styles.optionButtonTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.policyLabel, { marginTop: 6 }]}>
              {backupMode === 'auto' ? t.onboarding.backupModeAutoDesc : t.onboarding.backupModeManualDesc}
            </Text>
          </View>

          {/* DESTINO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.onboarding.backupLocationLabel}</Text>
            <View style={[styles.optionButtons, { flexDirection: 'row', marginTop: 10 }]}>
              <TouchableOpacity
                style={[styles.optionButton, { flex: 1 }, backupLocation === 'local' && styles.optionButtonSelected]}
                onPress={() => handleSaveBackupPrefs(backupMode, 'local')}>
                <Text style={[styles.optionButtonText, backupLocation === 'local' && styles.optionButtonTextSelected]}>
                  {t.onboarding.backupLocationLocal}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton, { flex: 1 },
                  backupLocation === 'cloud' && styles.optionButtonSelected,
                  !isGoogleConnected && styles.optionButtonDisabled,
                ]}
                onPress={() => { if (isGoogleConnected) handleSaveBackupPrefs(backupMode, 'cloud'); }}
                disabled={!isGoogleConnected}>
                <Text style={[
                  styles.optionButtonText,
                  backupLocation === 'cloud' && styles.optionButtonTextSelected,
                  !isGoogleConnected && styles.optionButtonTextDisabled,
                ]}>
                  {t.onboarding.backupLocationCloud}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.policyLabel, { marginTop: 6 }]}>
              {backupLocation === 'cloud' && isGoogleConnected
                ? t.onboarding.backupLocationCloudDesc
                : backupLocation === 'cloud'
                ? t.onboarding.backupCloudDisabledHint
                : t.onboarding.backupLocationLocalDesc}
            </Text>

            {!isGoogleConnected && (
              <TouchableOpacity
                style={[globalStyles.buttonPrimary, { marginTop: 12 }]}
                onPress={handleConnectGoogle}>
                <Text style={globalStyles.buttonPrimaryText}>{t.settings.backupConnectGoogle}</Text>
              </TouchableOpacity>
            )}
          </View>

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
              disabled={backupLoading || (backupLocation === 'cloud' && !isGoogleConnected)}>
              <Text style={globalStyles.buttonPrimaryText}>{t.settings.backupDoBackupBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.buttonSecondary, backupLoading && { opacity: 0.5 }]}
              onPress={handleRestore}
              disabled={backupLoading || (backupLocation === 'cloud' && !isGoogleConnected)}>
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
          <Text style={styles.aboutAppName}>TaskFlow</Text>
          <Text style={styles.aboutVersion}>Versão 1.3</Text>
          <Text style={styles.aboutTagline}>"Coisas simples que fazem a diferença"</Text>

          <View style={styles.aboutDivider} />

          <Text style={styles.aboutLabel}>Desenvolvido por</Text>
          <Text style={styles.aboutDeveloper}>Rangel Lira</Text>

          <View style={styles.aboutDivider} />

          <Text style={styles.aboutFeatures}>Features principais</Text>
          <Text style={styles.aboutFeatureItem}>Busca com detecção de data</Text>
          <Text style={styles.aboutFeatureItem}>Migração automática de eventos</Text>
          <Text style={styles.aboutFeatureItem}>Listas de compras e tarefas</Text>
          <Text style={styles.aboutFeatureItem}>Compartilhamento em tempo real</Text>
          <Text style={styles.aboutFeatureItem}>Suporte a múltiplos idiomas</Text>

          <View style={styles.aboutDivider} />
          <Text style={styles.aboutCopyright}>© 2026 TaskFlow. Todos os direitos reservados.</Text>
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
  policyLabel: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
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
  optionButtonDisabled: { opacity: 0.4 },
  optionButtonTextDisabled: { color: c.textMuted },

  subToggleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingLeft: 16,
    paddingVertical: 6,
  },
  subToggleLabel: { color: c.textPrimary, fontSize: 14 },

  // Hidratação / Notificações
  waterGoalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  waterGoalInput: { flex: 1, textAlign: 'center', fontSize: 18, marginBottom: 0 },
  waterGoalSuffix: { color: c.textSecondary, fontSize: 14 },
  waterTimeRow: { flexDirection: 'row', gap: 16 },
  waterTimeField: { flex: 1 },
  waterTimeInput: { textAlign: 'center', fontSize: 16, marginBottom: 0 },

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

  // ——— DEV TOOLS ———
  devSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 16,
    gap: 10,
  },
  devSectionTitle: {
    color: c.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  devBtn: {
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  devBtnIcon: { fontSize: 22 },
  devBtnInfo: { flex: 1 },
  devBtnLabel: { fontSize: 15, fontWeight: '600' },
  devBtnSubtitle: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoRowIcon: { fontSize: 20, marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: c.bgCard, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary, marginBottom: 16 },
  backupFileRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.borderCard },
  backupFileName: { fontSize: 14, color: c.textPrimary, fontWeight: '500' },
  backupFileMtime: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
}); }
