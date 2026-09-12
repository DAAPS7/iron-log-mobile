/**
 * Anel de progresso circular, animado.
 *
 * Usado no cronómetro de descanso e no progresso da sessão. O traço anima
 * suavemente entre valores (em vez de saltar), o que faz a mudança ser
 * percebida sem o utilizador ter de ler o número.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({
  progress = 0, // 0 a 1
  size = 120,
  thickness = 10,
  color,
  trackColor,
  gradient = false,
  children,
  duration,
}) {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: duration ?? theme.motion.duration.base,
      easing: Easing.bezier(...theme.motion.easing.standard),
      // strokeDashoffset não é suportado pelo native driver.
      useNativeDriver: false,
    }).start();
  }, [clamped, duration]);

  const dashOffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const stroke = color || theme.colors.accent;
  const gradientId = `ring-${Math.round(size)}-${gradient ? 'g' : 'p'}`;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {gradient ? (
          <Defs>
            <SvgGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.gradients.accent[0]} />
              <Stop offset="1" stopColor={theme.gradients.accent[1]} />
            </SvgGradient>
          </Defs>
        ) : null}

        {/* Trilho de fundo */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor || theme.colors.hairline}
          strokeWidth={thickness}
          fill="none"
        />
        {/* Progresso — começa no topo (daí a rotação de -90°) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradient ? `url(#${gradientId})` : stroke}
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
