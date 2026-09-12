/**
 * Cronómetro de descanso entre séries.
 *
 * Aparece automaticamente depois de registares uma série de trabalho (não
 * de aquecimento, que precisa de muito menos descanso) e conta para trás a
 * partir dos 2:30 — o meio do intervalo de 2-3 minutos que a app assume nas
 * estimativas de tempo, para o cronómetro e as estimativas não discordarem.
 *
 * Fica fixo no fundo do ecrã para continuar visível enquanto percorres a
 * lista de exercícios, e desaparece sozinho quando chega a zero.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from './Icon';
import ProgressRing from './ProgressRing';
import { useTheme } from '../context/ThemeContext';

export const DEFAULT_REST_SECONDS = 150; // 2:30

function format(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function RestTimer({ startedAt, totalSeconds = DEFAULT_REST_SECONDS, onDismiss }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [remaining, setRemaining] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;

  // A contagem é derivada do relógio (não de um contador incrementado), para
  // continuar correta mesmo que a app fique suspensa uns segundos.
  const pausedAtRef = useRef(null);
  const driftRef = useRef(0);

  useEffect(() => {
    setRemaining(totalSeconds);
    driftRef.current = 0;
    pausedAtRef.current = null;
    setPaused(false);
    Animated.timing(enter, {
      toValue: 1,
      duration: theme.motion.duration.slow,
      easing: Easing.bezier(...theme.motion.easing.spring),
      useNativeDriver: true,
    }).start();
  }, [startedAt, totalSeconds]);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt - driftRef.current) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        // Pequena pausa antes de sair, para dar tempo de ver o "0:00".
        setTimeout(() => onDismiss?.(), 900);
      }
    }, 250);
    return () => clearInterval(id);
  }, [startedAt, totalSeconds, paused]);

  function togglePause() {
    if (paused) {
      driftRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
      setPaused(false);
    } else {
      pausedAtRef.current = Date.now();
      setPaused(true);
    }
  }

  function addSeconds(extra) {
    // remaining = total - (agora - inicio - drift)/1000, ou seja, aumentar o
    // drift empurra o fim para mais tarde. Somar (não subtrair) é o que
    // acrescenta tempo ao descanso.
    driftRef.current += extra * 1000;
    setRemaining((r) => r + extra);
  }

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const nearlyDone = remaining <= 10 && remaining > 0;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: Math.max(insets.bottom, 10) + 8,
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
        ],
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.lg,
            backgroundColor: theme.colors.surfaceHigh,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: nearlyDone ? theme.colors.accent : theme.colors.border,
            padding: theme.space.lg,
          },
          theme.elevation.high,
        ]}
      >
        <ProgressRing progress={progress} size={62} thickness={6} gradient>
          <Text
            style={{
              fontFamily: theme.font.display,
              ...theme.type.numericSm,
              color: theme.colors.textPrimary,
            }}
          >
            {format(remaining)}
          </Text>
        </ProgressRing>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: theme.font.bodyBold,
              ...theme.type.label,
              textTransform: 'uppercase',
              color: nearlyDone ? theme.colors.accent : theme.colors.textMuted,
            }}
          >
            {paused ? 'Descanso em pausa' : nearlyDone ? 'Quase pronto' : 'Descanso'}
          </Text>
          <Text
            style={{
              fontFamily: theme.font.body,
              ...theme.type.secondary,
              color: theme.colors.textSecondary,
              marginTop: 2,
            }}
          >
            Prepara a próxima série.
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: theme.space.md }}>
            <SmallAction label="+30s" onPress={() => addSeconds(30)} />
            <SmallAction
              label={paused ? 'Retomar' : 'Pausar'}
              onPress={togglePause}
            />
            <SmallAction label="Saltar" onPress={onDismiss} emphasis />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function SmallAction({ label, onPress, emphasis }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: theme.radii.pill,
        borderWidth: 1,
        borderColor: emphasis ? 'transparent' : theme.colors.borderStrong,
        backgroundColor: emphasis ? theme.colors.accent : 'transparent',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: theme.font.bodyBold,
          ...theme.type.caption,
          textTransform: 'uppercase',
          color: emphasis
            ? theme.isDark
              ? '#0B0F0C'
              : '#FFFFFF'
            : theme.colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
