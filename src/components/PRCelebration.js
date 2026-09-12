/**
 * Celebração de recorde pessoal.
 *
 * Aparece por cima do ecrã durante uns segundos quando uma série bate o PR
 * do exercício. A animação é curta e some sozinha — a ideia é reconhecer o
 * momento sem interromper o treino (não é um modal, não pede toque, não
 * bloqueia nada).
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';

const VISIBLE_MS = 3200;

export default function PRCelebration({ pr, onDismiss }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pr) return undefined;

    anim.setValue(0);
    shine.setValue(0);

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: theme.motion.duration.slow,
        easing: Easing.bezier(...theme.motion.easing.spring),
        useNativeDriver: true,
      }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(anim, {
        toValue: 0,
        duration: theme.motion.duration.base,
        easing: Easing.bezier(...theme.motion.easing.accelerate),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onDismiss?.();
    });

    // Brilho que atravessa o cartão uma vez, para dar o toque de "conquista".
    Animated.timing(shine, {
      toValue: 1,
      duration: 900,
      delay: 180,
      easing: Easing.bezier(...theme.motion.easing.standard),
      useNativeDriver: true,
    }).start();

    return undefined;
  }, [pr]);

  if (!pr) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top: insets.top + 10,
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      <Pressable onPress={onDismiss}>
        <View
          style={[
            {
              borderRadius: theme.radii.lg,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.colors.gold,
              backgroundColor: theme.colors.surfaceHigh,
            },
            theme.elevation.high,
          ]}
        >
          <LinearGradient
            colors={[rgba(theme.colors.gold, 0.22), rgba(theme.colors.gold, 0.04)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            pointerEvents="none"
          />

          {/* Faixa de brilho que passa uma vez da esquerda para a direita. */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 90,
              opacity: shine.interpolate({
                inputRange: [0, 0.15, 0.85, 1],
                outputRange: [0, 0.5, 0.5, 0],
              }),
              transform: [
                {
                  translateX: shine.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-120, 460],
                  }),
                },
                { rotate: '18deg' },
              ],
            }}
          >
            <LinearGradient
              colors={['transparent', rgba('#FFFFFF', 0.45), 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.lg,
              padding: theme.space.lg,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: theme.radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: rgba(theme.colors.gold, 0.18),
              }}
            >
              <Icon name="trophy" size={24} color={theme.colors.gold} strokeWidth={2} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: theme.font.bodyBold,
                  ...theme.type.label,
                  textTransform: 'uppercase',
                  color: theme.colors.gold,
                }}
              >
                Novo recorde pessoal
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: theme.font.display,
                  ...theme.type.h3,
                  color: theme.colors.textPrimary,
                  marginTop: 2,
                }}
              >
                {pr.name}
              </Text>
              <Text
                style={{
                  fontFamily: theme.font.body,
                  ...theme.type.secondary,
                  color: theme.colors.textSecondary,
                  marginTop: 2,
                }}
              >
                {pr.weight} {pr.unit}
                {pr.reps ? ` × ${pr.reps} reps` : ''}
                {pr.previous
                  ? ` · antes ${pr.previous.weight} ${pr.previous.unit}`
                  : ' · primeiro registo'}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function rgba(color, alpha) {
  if (!color) return 'transparent';
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  const h = color.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `rgba(${parseInt(full.slice(0, 2), 16)}, ${parseInt(full.slice(2, 4), 16)}, ${parseInt(full.slice(4, 6), 16)}, ${alpha})`;
}
