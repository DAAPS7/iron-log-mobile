/**
 * Anel de progresso com valor ao centro.
 * Equivalente ao ringCard() da versão web, agora em SVG nativo.
 */

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';
import { withAlpha } from '../theme/theme';

const SIZE = 118;
const STROKE = 10;
const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatRing({ value, unit, percent, tag, color }) {
  const theme = useTheme();
  const ringColor = color || theme.colors.strength;
  const offset = CIRCUMFERENCE - (Math.max(0, Math.min(100, percent)) / 100) * CIRCUMFERENCE;

  // A etiqueta usa um fundo translúcido da própria cor do anel; se a cor vier
  // como rgb() (escala contínua) usamos uma opacidade fixa via overlay.
  const tagBackground = ringColor.startsWith('#')
    ? withAlpha(ringColor, 0.16)
    : ringColor.replace('rgb(', 'rgba(').replace(')', ', 0.16)');

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: SIZE, height: SIZE, justifyContent: 'center' }}>
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={theme.colors.bgSoft}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            fill="none"
            // começa no topo em vez de à direita
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: theme.font.display,
              fontSize: 24,
              color: theme.colors.ink,
            }}
          >
            {value}
          </Text>
          {unit ? (
            <Text
              style={{
                fontFamily: theme.font.body,
                fontSize: 10,
                color: theme.colors.muted,
                textTransform: 'uppercase',
              }}
            >
              {unit}
            </Text>
          ) : null}
        </View>
      </View>

      {tag ? (
        <View
          style={{
            marginTop: 10,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: tagBackground,
          }}
        >
          <Text
            style={{
              fontFamily: theme.font.bodyBold,
              fontSize: 11,
              textTransform: 'uppercase',
              color: ringColor,
            }}
          >
            {tag}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
