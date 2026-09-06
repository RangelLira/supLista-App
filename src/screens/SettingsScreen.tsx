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
import { useLanguage } from '../contexts/LanguageContext';
import { ThemeType, useTheme } from '../contexts/ThemeContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { AccentColor, ACCENT_PRESETS, HEADER_TOP_PADDING } from '../styles/theme';
import { loadSettings, saveSettings } from '../utils/storage';
import { termsOfService } from '../content/termsOfService';
import SharingScreen from './SharingScreen';

type SubScreen = null | 'perfil' | 'preferencias' | 'compartilhamento' | 'sobre';

// TODO: substituir pelos dados reais de contato antes do lançamento
const CONTACT_WHATSAPP = '5511999999999';
const CONTACT_EMAIL = 'contato@suplist.com.br';

interface Props {
  onChangeUserName: (name: string) => void;
  // Fecha Configurações e volta para a tela de Listas
  onGoHome?: () => void;
}

export default function SettingsScreen({ onChangeUserName, onGoHome }: Props) {
  const { colors, globalStyles, theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const { user, isGoogleConnected, signInWithGoogle, signOutGoogle } = useFirebase();
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [showTerms, setShowTerms] = useState(false);
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
            { key: 'perfil', icon: '👤', label: t.settings.menuProfile, subtitle: t.settings.menuProfileSubtitle },
            { key: 'preferencias', icon: '⚙️', label: t.settings.menuOptions, subtitle: t.settings.menuOptionsSubtitle },
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
              <Text style={globalStyles.buttonPrimaryText}>{t.settings.profileNameSave}</Text>
            </TouchableOpacity>
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
                          Alert.alert(t.common.error, t.settings.profileGoogleDisconnectConfirm);
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
            <Text style={globalStyles.buttonPrimaryText}>Fechar</Text>
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
            <Text style={styles.aboutAppName}>supList</Text>
            <Text style={styles.aboutVersion}>Versão 1.0</Text>
            <Text style={styles.aboutTagline}>"Faça suas próprias escolhas"</Text>

            <View style={styles.aboutDivider} />

            <Text style={styles.aboutLabel}>Desenvolvido por</Text>
            <Text style={styles.aboutDeveloper}>Contest Software - Rangel Lira</Text>

            <View style={styles.aboutDivider} />

            <Text style={styles.aboutLabel}>{t.settings.aboutContactTitle}</Text>
            <View style={styles.aboutContactRow}>
              <TouchableOpacity
                style={styles.aboutContactBtn}
                onPress={() => Linking.openURL(`https://wa.me/${CONTACT_WHATSAPP}`)}>
                <Text style={styles.aboutContactIcon}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.aboutContactBtn}
                onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}>
                <Text style={styles.aboutContactIcon}>✉️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.aboutDivider} />

            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={() => setShowTerms(true)}>
              <Text style={globalStyles.buttonPrimaryText}>Ver termos de uso</Text>
            </TouchableOpacity>
          </View>

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

  menuBtn: {
    position: 'absolute',
    right: 20,
    top: HEADER_TOP_PADDING - 2,
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
  infoRowIcon: { fontSize: 20, marginTop: 1 },
}); }
