// ===========================
// COMPONENTE: SWIPE ROW
// Wrapper genérico de swipe horizontal para cards.
// — Swipe direita (> threshold): revela fundo verde e chama onSwipeRight
// — Swipe esquerda (< -threshold): revela fundo vermelho e chama onSwipeLeft
// Usado em: ListsScreen (F1)
// RoutineCard e EventCard têm o swipe embutido diretamente.
// ===========================

import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

interface Props {
  children: React.ReactNode;
  onSwipeRight?: () => void; // ação do swipe direita (ex: concluir)
  onSwipeLeft?: () => void;  // ação do swipe esquerda (ex: excluir)
  rightIcon?: string;        // ícone do fundo esquerdo (revelado no swipe direita)
  leftIcon?: string;         // ícone do fundo direito (revelado no swipe esquerda)
  rightColor?: string;       // cor do fundo do swipe direita (verde)
  leftColor?: string;        // cor do fundo do swipe esquerda (vermelho)
  disabled?: boolean;        // desativa o gesto completamente
  threshold?: number;        // distância mínima para acionar ação (px)
  style?: ViewStyle;         // estilo do container externo (ex: marginBottom)
}

export default function SwipeRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightIcon = '✓',
  leftIcon = '🗑️',
  rightColor = '#4caf50',
  leftColor = '#f44336',
  disabled = false,
  threshold = 80,
  style,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  // Mutable ref evita closures stale nos callbacks do PanResponder
  const actionsRef = useRef({ onSwipeRight, onSwipeLeft });
  actionsRef.current = { onSwipeRight, onSwipeLeft };

  // Fundo esquerdo (verde) — aparece ao deslizar para DIREITA
  const leftPanelOpacity = translateX.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Fundo direito (vermelho) — aparece ao deslizar para ESQUERDA
  const rightPanelOpacity = translateX.interpolate({
    inputRange: [-40, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        if (disabled) return false;
        return Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy);
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (disabled) {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          return;
        }
        const { dx } = g;
        if (dx > threshold && actionsRef.current.onSwipeRight) {
          // Dispara o callback ANTES de animar — evita race condition entre o native
          // thread (card ainda em voo) e o re-render do React após atualização de estado.
          actionsRef.current.onSwipeRight?.();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        } else if (dx < -threshold && actionsRef.current.onSwipeLeft) {
          actionsRef.current.onSwipeLeft?.();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        } else {
          // Abaixo do threshold — retorna com mola
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]}>
      {/* Camada de fundo — revelada pelo deslize do card */}
      {!disabled && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.bg}>
            {/* Painel esquerdo (swipe direita = concluir) */}
            <Animated.View style={[styles.bgLeft, { backgroundColor: rightColor, opacity: leftPanelOpacity }]}>
              <Text style={styles.bgIcon}>{rightIcon}</Text>
            </Animated.View>
            {/* Painel direito (swipe esquerda = excluir) */}
            <Animated.View style={[styles.bgRight, { backgroundColor: leftColor, opacity: rightPanelOpacity }]}>
              <Text style={styles.bgIcon}>{leftIcon}</Text>
            </Animated.View>
          </View>
        </View>
      )}

      {/* Conteúdo animado — desliza sobre o fundo */}
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  bg: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bgLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 24,
  },
  bgRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  bgIcon: {
    fontSize: 26,
    color: 'white',
  },
});
