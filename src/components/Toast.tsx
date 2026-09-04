// ===========================
// COMPONENTE: TOAST / SNACKBAR GLOBAL
// ===========================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { darkColors } from '../styles/theme';
import { ToastContext } from '../hooks/useToast';

interface ToastState {
  message: string;
  onUndo?: () => void;
}

function createStyles(c: typeof darkColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
    },
    container: {
      position: 'absolute',
      bottom: 90,
      left: 16,
      right: 16,
      backgroundColor: c.bgCard,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      // Android shadow
      elevation: 10,
      // iOS shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      zIndex: 9999,
    },
    message: {
      color: c.textPrimary,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    undoBtn: {
      marginLeft: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: c.primary,
      borderRadius: 8,
    },
    undoBtnText: {
      color: 'white',
      fontSize: 13,
      fontWeight: '600',
    },
  });
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const showToast = (message: string, onUndo?: () => void) => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setToast({ message, onUndo });
    translateY.setValue(100);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    hideTimeout.current = setTimeout(hide, 3000);
  };

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  const handleUndo = () => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    toast?.onUndo?.();
    hide();
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.wrapper}>
        {children}
        {toast && (
          <Animated.View
            style={[
              styles.container,
              { transform: [{ translateY }], opacity },
            ]}>
            <Text style={styles.message}>{toast.message}</Text>
            {toast.onUndo && (
              <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
                <Text style={styles.undoBtnText}>{t.toast.undo}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}
