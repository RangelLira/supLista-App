// ===========================
// TELA: ONBOARDING (primeira vez)
// ===========================

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFirebase } from '../contexts/FirebaseContext';
import { LangType, useLanguage } from '../contexts/LanguageContext';
import { ThemeType, useTheme } from '../contexts/ThemeContext';
import { saveSettings } from '../utils/storage';
import { termsOfService } from '../content/termsOfService';
import { AccentColor, ACCENT_PRESETS } from '../styles/theme';

interface Props {
  onDone: () => void;
}

type Step =
  | 'language'
  | 'google'
  | 'manual_profile'
  | 'sharing'
  | 'terms';

export default function OnboardingScreen({ onDone }: Props) {
  const { colors, theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const { setSharingEnabled, signInWithGoogle } = useFirebase();

  const [step, setStep] = useState<Step>('language');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [termsScrolled, setTermsScrolled] = useState(false);

  const s = createStyles(colors);

  // ─── Handlers ────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) setStep('sharing');
      // null = cancelado pelo usuário — fica na tela
    } catch (error) {
      Alert.alert(t.common.error, t.onboarding.googleErrorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleManualProfileContinue = async () => {
    const name = displayName.trim() || 'Usuário';
    setLoading(true);
    await saveSettings({
      displayName: name,
      sharingEnabled: false,
    });
    setLoading(false);
    setStep('terms');
  };

  const handleSharingYes = async () => {
    setLoading(true);
    await setSharingEnabled(true);
    setLoading(false);
    setStep('terms');
  };

  const handleTermsScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 32) {
      setTermsScrolled(true);
    }
  };

  const handleAcceptTerms = async () => {
    await saveSettings({
      onboardingDone: true,
      termsAccepted: true,
      termsAcceptedAt: new Date().toISOString(),
    });
    onDone();
  };

  // ─── ETAPA 1: Idioma + Tema ───────────────────────────────
  if (step === 'language') {
    return (
      <View style={s.screen}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Text style={s.appName}>supList</Text>
          <Text style={s.welcomeSub}>{t.onboarding.welcomeSub}</Text>

          <Text style={s.sectionLabel}>{t.onboarding.languageLabel}</Text>
          <View style={s.langButtons}>
            {([
              { key: 'pt' as LangType, flag: '🇧🇷', label: 'Português' },
              { key: 'en' as LangType, flag: '🇺🇸', label: 'English' },
              { key: 'es' as LangType, flag: '🇪🇸', label: 'Español' },
            ]).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.langBtn, lang === opt.key && s.langBtnSelected]}
                onPress={() => setLanguage(opt.key)}>
                <Text style={s.langFlag}>{opt.flag}</Text>
                <Text style={[s.langLabel, lang === opt.key && s.langLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sectionLabel, { marginTop: 28 }]}>{t.onboarding.themeLabel}</Text>
          <View style={s.themeButtons}>
            {([
              { key: 'escuro' as ThemeType, icon: '🌙', label: t.onboarding.themeDark },
              { key: 'claro'  as ThemeType, icon: '☀️', label: t.onboarding.themeLight },
              { key: 'auto'   as ThemeType, icon: '🌓', label: t.onboarding.themeAuto, hint: t.onboarding.themeAutoHint },
            ]).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[s.themeBtn, theme === opt.key && s.themeBtnSelected]}
                onPress={() => setTheme(opt.key)}>
                <Text style={s.themeIcon}>{opt.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.themeBtnLabel, theme === opt.key && s.themeBtnLabelSelected]}>
                    {opt.label}
                  </Text>
                  {opt.hint ? <Text style={s.themeHint}>{opt.hint}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sectionLabel, { marginTop: 28 }]}>{t.settings.accentColorTitle}</Text>
          <View style={s.accentRow}>
            {([
              { value: 'roxo' as AccentColor, label: t.settings.accentRoxo },
              { value: 'vermelho' as AccentColor, label: t.settings.accentVermelho },
              { value: 'azul' as AccentColor, label: t.settings.accentAzul },
              { value: 'verde' as AccentColor, label: t.settings.accentVerde },
            ]).map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={s.accentSwatchWrap}
                onPress={() => setAccentColor(opt.value)}>
                <View style={[
                  s.accentSwatch,
                  { backgroundColor: ACCENT_PRESETS[opt.value].dark.primary },
                  accentColor === opt.value && s.accentSwatchSelected,
                ]}>
                  {accentColor === opt.value && <Text style={s.accentSwatchCheck}>✓</Text>}
                </View>
                <Text style={s.accentSwatchLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: 32 }]}
            onPress={() => setStep('google')}>
            <Text style={s.primaryBtnText}>{t.onboarding.continueBtn}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── ETAPA 2: Google Sign-In ──────────────────────────────
  if (step === 'google') {
    return (
      <View style={s.screen}>
        <View style={s.centeredContent}>
          <Text style={s.stepIcon}>🔑</Text>
          <Text style={s.stepTitle}>{t.onboarding.googleTitle}</Text>
          <Text style={s.stepDesc}>{t.onboarding.googleDesc}</Text>

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.primaryBtnText}>{t.onboarding.googleSignInBtn}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setStep('manual_profile')}
            disabled={loading}>
            <Text style={s.secondaryBtnText}>{t.onboarding.googleSkipBtn}</Text>
          </TouchableOpacity>

          <Text style={s.hint}>{t.onboarding.googleSkipWarning}</Text>
        </View>
      </View>
    );
  }

  // ─── ETAPA 2b: Perfil manual (sem Google) ─────────────────
  if (step === 'manual_profile') {
    return (
      <View style={s.screen}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={s.stepIcon}>👋</Text>
          <Text style={s.stepTitle}>{t.onboarding.manualTitle}</Text>
          <Text style={s.stepDesc}>{t.onboarding.manualDesc}</Text>

          <Text style={s.fieldLabel}>{t.onboarding.manualNameLabel}</Text>
          <TextInput
            style={s.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t.onboarding.manualNamePlaceholder}
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={handleManualProfileContinue}
          />

          <Text style={[s.hint, { marginTop: 12, marginBottom: 20 }]}>
            {t.onboarding.manualLimitationNote}
          </Text>

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleManualProfileContinue}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.primaryBtnText}>{t.onboarding.continueBtn}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── ETAPA 3: Compartilhamento (só com Google) ────────────
  if (step === 'sharing') {
    return (
      <View style={s.screen}>
        <View style={s.centeredContent}>
          <Text style={s.stepIcon}>🔗</Text>
          <Text style={s.stepTitle}>{t.onboarding.sharingTitle}</Text>
          <Text style={s.stepDesc}>{t.onboarding.sharingDesc}</Text>

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleSharingYes}
            disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.primaryBtnText}>{t.onboarding.sharingEnableBtn}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={async () => {
              await saveSettings({ sharingEnabled: false });
              setStep('terms');
            }}
            disabled={loading}>
            <Text style={s.secondaryBtnText}>{t.onboarding.sharingSkipBtn}</Text>
          </TouchableOpacity>

          <Text style={s.hint}>{t.onboarding.sharingHint}</Text>
        </View>
      </View>
    );
  }

  // ─── ETAPA 4: Termos de uso ───────────────────────────────
  const termsText = termsOfService[lang as 'pt' | 'en' | 'es'] ?? termsOfService.pt;
  return (
    <View style={s.screen}>
      <View style={s.termsWrapper}>
        <Text style={s.stepTitle}>{t.onboarding.termsTitle}</Text>
        <Text style={s.termsSubtitle}>{t.onboarding.termsSubtitle}</Text>

        <ScrollView
          style={s.termsScroll}
          contentContainerStyle={s.termsScrollContent}
          onScroll={handleTermsScroll}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator>
          <Text style={s.termsText}>{termsText}</Text>
        </ScrollView>

        {!termsScrolled && (
          <Text style={s.termsScrollHint}>{t.onboarding.termsScrollHint}</Text>
        )}

        <TouchableOpacity
          style={[s.primaryBtn, !termsScrolled && s.primaryBtnDisabled]}
          onPress={handleAcceptTerms}
          disabled={!termsScrolled}>
          <Text style={s.primaryBtnText}>{t.onboarding.termsAcceptBtn}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────

function createStyles(c: typeof import('../styles/theme').darkColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bgMain,
    },

    // Layout para etapas com ScrollView (Idioma, Perfil manual)
    scrollContent: {
      paddingHorizontal: 28,
      paddingVertical: 36,
      alignItems: 'center',
    },

    // Layout para etapas centradas verticalmente (Google, Compartilhamento)
    centeredContent: {
      flex: 1,
      paddingHorizontal: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },

    appName: {
      color: c.primary,
      fontSize: 44,
      fontWeight: '800',
      marginBottom: 6,
    },
    welcomeSub: {
      color: c.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 32,
    },
    sectionLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      alignSelf: 'flex-start',
      marginBottom: 10,
    },

    // ─── Idioma ───
    langButtons: { width: '100%', gap: 10 },
    langBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 14,
      borderWidth: 2,
      borderColor: c.border,
      gap: 12,
    },
    langBtnSelected: { borderColor: c.primary, backgroundColor: c.bgSecondary },
    langFlag: { fontSize: 24 },
    langLabel: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    langLabelSelected: { color: c.primary, fontWeight: '700' },

    // ─── Tema ───
    themeButtons: { width: '100%', gap: 10 },
    themeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 14,
      borderWidth: 2,
      borderColor: c.border,
      gap: 12,
      width: '100%',
    },
    themeBtnSelected: { borderColor: c.primary, backgroundColor: c.bgSecondary },
    themeIcon: { fontSize: 22 },
    themeBtnLabel: { color: c.textPrimary, fontSize: 15, fontWeight: '500' },
    themeBtnLabelSelected: { color: c.primary, fontWeight: '700' },
    themeHint: { color: c.textMuted, fontSize: 11, marginTop: 2 },

    // ─── Cor de destaque ───
    accentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 4,
    },
    accentSwatchWrap: { alignItems: 'center', gap: 6, flex: 1 },
    accentSwatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    accentSwatchSelected: { borderColor: c.textPrimary },
    accentSwatchCheck: { color: 'white', fontSize: 16, fontWeight: '700' },
    accentSwatchLabel: { color: c.textSecondary, fontSize: 11, textAlign: 'center' },

    // ─── Genérico ───
    stepIcon: { fontSize: 52, marginBottom: 16 },
    stepTitle: {
      color: c.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 14,
    },
    stepDesc: {
      color: c.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 23,
      marginBottom: 28,
    },

    // ─── Botões ───
    primaryBtn: {
      width: '100%',
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 12,
    },
    primaryBtnDisabled: { opacity: 0.35 },
    primaryBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
    secondaryBtn: {
      width: '100%',
      backgroundColor: c.bgCard,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 14,
    },
    secondaryBtnText: { color: c.textSecondary, fontSize: 15 },
    hint: { color: c.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },

    // ─── Perfil manual ───
    fieldLabel: {
      color: c.textSecondary,
      fontSize: 13,
      fontWeight: '600',
      alignSelf: 'flex-start',
      marginTop: 16,
      marginBottom: 6,
    },
    input: {
      width: '100%',
      backgroundColor: c.bgCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontSize: 15,
    },
    fieldHint: {
      color: c.textMuted,
      fontSize: 11,
      alignSelf: 'flex-start',
      marginTop: 4,
    },

    // ─── Termos ───
    termsWrapper: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 20,
    },
    termsSubtitle: {
      color: c.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 14,
    },
    termsScroll: {
      flex: 1,
      backgroundColor: c.bgCard,
      borderRadius: 12,
      marginBottom: 10,
    },
    termsScrollContent: { padding: 16 },
    termsText: { color: c.textSecondary, fontSize: 13, lineHeight: 20 },
    termsScrollHint: {
      color: c.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 10,
    },
  });
}
