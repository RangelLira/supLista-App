// ===========================
// TELA: CONFIGURAÇÕES
// ===========================

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  BackHandler,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DeviceInfo from 'react-native-device-info';
import { useLanguage } from '../contexts/LanguageContext';
import { ThemeType, useTheme } from '../contexts/ThemeContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { AccentColor, ACCENT_PRESETS, HEADER_TOP_PADDING } from '../styles/theme';
import { loadSettings, saveSettings } from '../utils/storage';
import { propagateDisplayName, setUserDisplayName } from '../utils/firestore';
import { termsOfService } from '../content/termsOfService';
import SharingScreen from './SharingScreen';

// Painel de ferramentas de DEV — carregado só em builds de desenvolvimento.
// Em release, __DEV__ é false e o Metro elimina o require (nada é empacotado).
const DevPanel: React.ComponentType<{ initialTab?: 'menu' | 'log'; onClose: () => void }> | null =
  __DEV__ ? require('../dev/DevPanel').default : null;

type SubScreen = null | 'perfil' | 'preferencias' | 'compartilhamento' | 'sobre';

const CONTACT_EMAIL = 'contato.contestsoftware@gmail.com';
const CONTACT_WEBSITE = 'https://rangellira.github.io/supLista-App/';
const CONTACT_ISSUES = 'https://github.com/RangelLira/supLista-App/issues';

// Ícones monocromáticos
const CONTACT_ICON_PATHS = {
  github: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  web: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
};

function ContactIcon({ name, color }: { name: keyof typeof CONTACT_ICON_PATHS; color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d={CONTACT_ICON_PATHS[name]} fill={color} />
    </Svg>
  );
}

interface Props {
  onChangeUserName: (name: string) => void;
  // Fecha Configurações e volta para a tela de Listas
  onGoHome?: () => void;
  onOpenArchive: () => void;
}

export default function SettingsScreen({ onChangeUserName, onGoHome, onOpenArchive }: Props) {
  const { colors, globalStyles, theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const { user, userId, isGoogleConnected, signInWithGoogle, signOutGoogle } = useFirebase();
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showDev, setShowDev] = useState<'menu' | 'log' | null>(null);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (subScreen === 'perfil') {
      loadSettings().then(s => {
        setLocalDisplayName(s.displayName ?? '');
      });
    }
  }, [subScreen]);

  useEffect(() => {
    if (!subScreen) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showTerms) { setShowTerms(false); return true; }
      setSubScreen(null);
      return true;
    });
    return () => backHandler.remove();
  }, [subScreen, showTerms]);

  const handleSaveDisplayName = async () => {
    const name = localDisplayName.trim();
    if (!name) return;
    await saveSettings({ displayName: name });
    onChangeUserName(name);
    // Propaga para o Firestore: perfil + nome nas conexões (o parceiro vê o novo nome).
    if (userId) {
      try {
        await setUserDisplayName(userId, name);
        await propagateDisplayName(userId, name);
      } catch (e) {
        console.warn('[handleSaveDisplayName] falha ao propagar nome:', e);
        Alert.alert(t.common.error, t.settings.profileNamePropagateError);
        return;
      }
    }
    // Retorno inline (sem toast): o botão vira "✓ Salvo" por 2s.
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
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
          {onGoHome && (
            <TouchableOpacity style={styles.menuBtn} onPress={onGoHome}>
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={globalStyles.scrollContent}>
          {[
            { key: 'perfil', label: t.settings.menuProfile, subtitle: t.settings.menuProfileSubtitle },
            { key: 'preferencias', label: t.settings.menuOptions, subtitle: t.settings.menuOptionsSubtitle },
            { key: 'arquivo', label: t.settings.menuArchive, subtitle: t.settings.menuArchiveSubtitle },
            { key: 'compartilhamento', label: t.settings.menuShare, subtitle: t.settings.menuShareSubtitle },
            { key: 'sobre', label: t.settings.menuAbout, subtitle: t.settings.menuAboutSubtitle },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.menuItem}
              onPress={() => (item.key === 'arquivo' ? onOpenArchive() : setSubScreen(item.key as SubScreen))}>
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
          {onGoHome && (
            <TouchableOpacity style={styles.menuBtn} onPress={onGoHome}>
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
            </TouchableOpacity>
          )}
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
              <Text style={globalStyles.buttonPrimaryText}>
                {nameSaved ? `✓ ${t.settings.profileNameSaved}` : t.settings.profileNameSave}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conta Google */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.settings.profileAccountLabel}</Text>
            {isGoogleConnected ? (
              <>
                <View style={[styles.infoRow, { marginTop: 8, marginBottom: 12 }]}>
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
                          Alert.alert(t.common.error, t.settings.profileGoogleDisconnectError);
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
                    try {
                      const result = await signInWithGoogle();
                      if (result) {
                        onChangeUserName(result.name);
                        setLocalDisplayName(result.name);
                      }
                    } catch {
                      Alert.alert(t.common.error, t.onboarding.googleErrorMsg);
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
          {onGoHome && (
            <TouchableOpacity style={styles.menuBtn} onPress={onGoHome}>
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
            </TouchableOpacity>
          )}
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

            <Text style={[styles.sectionTitle, { marginTop: 18, marginBottom: 4 }]}>{t.settings.accentColorTitle}</Text>
            <View style={styles.accentRow}>
              {([
                { value: 'roxo' as AccentColor, label: t.settings.accentRoxo },
                { value: 'vermelho' as AccentColor, label: t.settings.accentVermelho },
                { value: 'azul' as AccentColor, label: t.settings.accentAzul },
                { value: 'verde' as AccentColor, label: t.settings.accentVerde },
              ]).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.accentSwatchWrap}
                  onPress={() => setAccentColor(opt.value)}>
                  <View style={[
                    styles.accentSwatch,
                    { backgroundColor: ACCENT_PRESETS[opt.value].dark.primary },
                    accentColor === opt.value && styles.accentSwatchSelected,
                  ]}>
                    {accentColor === opt.value && <Text style={styles.accentSwatchCheck}>✓</Text>}
                  </View>
                  <Text style={styles.accentSwatchLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
          {onGoHome && (
            <TouchableOpacity style={styles.menuBtn} onPress={onGoHome}>
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
            </TouchableOpacity>
          )}
        </View>
        <SharingScreen />
      </View>
    );
  }

  // ===========================
  // PAINEL DE DEV (só __DEV__) — tela cheia, render condicional
  // ===========================
  if (subScreen === 'sobre' && showDev && DevPanel) {
    return <DevPanel initialTab={showDev} onClose={() => setShowDev(null)} />;
  }

  // ===========================
  // TERMOS DE USO (tela cheia, dentro do fluxo normal — não usa <Modal>
  // porque ScrollView dentro de Modal tem um bug conhecido de não rolar no Android)
  // ===========================
  if (subScreen === 'sobre' && showTerms) {
    return (
      <View style={globalStyles.screen}>
        <View style={globalStyles.header}>
          <Text style={globalStyles.headerTitle}>{t.onboarding.termsTitle}</Text>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.termsScrollContent}>
          <Text style={styles.termsText}>
            {termsOfService[lang as 'pt' | 'en' | 'es'] ?? termsOfService.pt}
          </Text>
        </ScrollView>
        <View style={styles.termsBottomBar}>
          <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => setShowTerms(false)}>
            <Text style={globalStyles.buttonPrimaryText}>{t.settings.termsCloseBtn}</Text>
          </TouchableOpacity>
        </View>
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
          {onGoHome && (
            <TouchableOpacity style={styles.menuBtn} onPress={onGoHome}>
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
              <View style={styles.menuBtnBar} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.aboutContainer}>
          <View style={styles.aboutTop}>
            <Text style={styles.aboutAppName}>supLista</Text>
            <Text style={styles.aboutVersion}>{t.settings.aboutVersion(DeviceInfo.getVersion())}</Text>
            <Text style={styles.aboutTagline}>{t.settings.aboutTagline}</Text>

            <View style={styles.aboutDivider} />

            <Text style={styles.aboutLabel}>{t.settings.aboutDevelopedBy}</Text>
            <Text style={styles.aboutDeveloper}>Contest Software - Rangel Lira</Text>

            <View style={styles.aboutDivider} />

            <Text style={styles.aboutLabel}>{t.settings.aboutContactTitle}</Text>
            <View style={styles.aboutContactRow}>
              <TouchableOpacity
                style={styles.aboutContactBtn}
                accessibilityRole="button"
                accessibilityLabel={t.settings.aboutReportIssue}
                onPress={() => Linking.openURL(CONTACT_ISSUES)}>
                <ContactIcon name="github" color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.aboutContactBtn}
                accessibilityRole="button"
                accessibilityLabel="E-mail"
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
                <ContactIcon name="email" color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.aboutContactBtn}
                accessibilityRole="button"
                accessibilityLabel={t.settings.aboutSiteLabel}
                onPress={() => Linking.openURL(CONTACT_WEBSITE)}>
                <ContactIcon name="web" color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutDivider} />

            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => setShowTerms(true)}>
              <Text style={globalStyles.buttonPrimaryText}>{t.settings.aboutViewTerms}</Text>
            </TouchableOpacity>

            {__DEV__ && (
              <>
                <View style={styles.aboutDivider} />
                <View style={styles.devRow}>
                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: colors.bgSecondary }]}
                    onPress={() => setShowDev('log')}>
                    <Text style={styles.devBtnText}>🐞 Log</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.devBtn, { backgroundColor: colors.warning }]}
                    onPress={() => setShowDev('menu')}>
                    <Text style={styles.devBtnText}>👥 Fake user</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <Text style={styles.aboutCopyright}>{t.settings.aboutRights}</Text>
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
  menuInfo: { flex: 1 },
  menuLabel: { color: c.textPrimary, fontSize: 16, fontWeight: '600' },
  menuSubtitle: { color: c.textSecondary, fontSize: 13, marginTop: 2 },

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
    marginBottom: 10,
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

  accentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  accentSwatchWrap: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  accentSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accentSwatchSelected: {
    borderColor: c.textPrimary,
  },
  accentSwatchCheck: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  accentSwatchLabel: {
    color: c.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  aboutContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 32,
    paddingTop: 48,
    paddingBottom: 56,
  },
  aboutTop: {
    alignItems: 'center',
    width: '100%',
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
  aboutContactRow: {
    flexDirection: 'row',
    gap: 16,
  },
  aboutContactBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutContactIcon: { fontSize: 22 },
  aboutCopyright: {
    color: c.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },

  termsScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  termsText: {
    color: c.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  termsBottomBar: {
    padding: 16,
    paddingBottom: 48,
    backgroundColor: c.bgMain,
  },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  // DEV (só __DEV__)
  devRow: { flexDirection: 'row', gap: 10, width: '100%' },
  devBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  devBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
}); }
