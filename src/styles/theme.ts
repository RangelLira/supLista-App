// ===========================
// TEMA E CORES GLOBAIS
// ===========================

import { Platform, StatusBar, StyleSheet } from 'react-native';

const HEADER_TOP_PADDING = (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44) + 22;

// ===========================
// PALETA ESCURA (padrão)
// ===========================
export const darkColors = {
  primary: '#6c7ce7',
  primaryLight: '#8b9cf7',
  bgMain: '#1a1a1a',
  bgCard: '#3a3a3a',
  bgInput: '#2d2d2d',
  bgSecondary: '#4a4a4a',
  textPrimary: '#f7fafc',
  textSecondary: '#a0aec0',
  textMuted: '#e2e8f0',
  success: '#48bb78',
  successBg: '#2d4a2d',
  successBorder: '#4a7c59',
  warning: '#f6ad55',
  danger: '#e53e3e',
  dangerBg: '#4a2323',
  dangerBorder: '#e53e3e',
  dangerLight: '#fed7d7',
  border: '#4a4a4a',
  borderCard: '#4a4a4a',
};

// ===========================
// PALETA CLARA
// ===========================
export const lightColors: typeof darkColors = {
  primary: '#5a6fd6',
  primaryLight: '#7b8ef5',
  bgMain: '#f0f2f5',
  bgCard: '#ffffff',
  bgInput: '#e8ecf0',
  bgSecondary: '#dde2e8',
  textPrimary: '#1a202c',
  textSecondary: '#4a5568',
  textMuted: '#2d3748',
  success: '#2f855a',
  successBg: '#c6f6d5',
  successBorder: '#68d391',
  warning: '#c05621',
  danger: '#c53030',
  dangerBg: '#fff5f5',
  dangerBorder: '#fc8181',
  dangerLight: '#c53030',
  border: '#cbd5e0',
  borderCard: '#e2e8f0',
};

// ===========================
// FACTORY DE ESTILOS GLOBAIS
// ===========================
export function createGlobalStyles(c: typeof darkColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bgMain,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    header: {
      backgroundColor: c.primary,
      paddingTop: HEADER_TOP_PADDING,
      paddingBottom: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    headerTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight: '600',
    },
    headerSubtitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 14,
      marginTop: 4,
    },
    card: {
      backgroundColor: c.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borderCard,
    },
    cardCompleted: {
      backgroundColor: c.successBg,
      borderColor: c.successBorder,
    },
    buttonPrimary: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    buttonPrimaryText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    buttonSecondary: {
      backgroundColor: c.bgSecondary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    buttonSecondaryText: {
      color: c.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    buttonDanger: {
      backgroundColor: c.danger,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    buttonDangerText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    input: {
      backgroundColor: c.bgCard,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 12,
      color: c.textPrimary,
      fontSize: 16,
    },
    inputLabel: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      marginTop: 16,
    },
    textTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    textBody: {
      color: c.textPrimary,
      fontSize: 15,
    },
    textMuted: {
      color: c.textSecondary,
      fontSize: 13,
    },
    emptyText: {
      color: c.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 40,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: c.bgInput,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      backgroundColor: c.primary,
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    modalTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight: '600',
    },
    navbar: {
      flexDirection: 'row',
      backgroundColor: c.bgInput,
      paddingBottom: 20,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
    },
    navLabel: {
      fontSize: 10,
      marginTop: 4,
      color: c.textSecondary,
    },
    navLabelActive: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}

// ===========================
// EXPORTS DE COMPATIBILIDADE (tema escuro por padrão)
// Usados por componentes que ainda não foram migrados para useTheme()
// ===========================
export const colors = darkColors;
export const globalStyles = createGlobalStyles(darkColors);
