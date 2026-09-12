/**
 * Toma diária de creatina, com sequência (streak).
 *
 * Só aparece se o utilizador tiver ativado "Tomo creatina" no Perfil — não
 * faz sentido mostrar isto a quem não toma. A streak é sempre recalculada a
 * partir do registo real (nunca guardada à parte), tal como o PR e os
 * objetivos.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, CardTitle, Note } from './ui';
import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';

export default function CreatineCard({ takenToday, streak, onToggle }) {
  const theme = useTheme();

  return (
    <Card accent={theme.colors.gold}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.lg }}>
        <ToggleCircle onPress={onToggle} taken={takenToday} theme={theme} />

        <View style={{ flex: 1 }}>
          <CardTitle style={{ marginBottom: 2 }}>Creatina</CardTitle>
          <Text
            style={{
              fontFamily: theme.font.body,
              ...theme.type.secondary,
              color: theme.colors.textSecondary,
            }}
          >
            {takenToday ? 'Já tomaste hoje.' : 'Ainda não marcaste hoje.'}
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="flame" size={16} color={streak > 0 ? theme.colors.gold : theme.colors.textMuted} />
            <Text
              style={{
                fontFamily: theme.font.display,
                ...theme.type.numericSm,
                color: streak > 0 ? theme.colors.gold : theme.colors.textMuted,
              }}
            >
              {streak}
            </Text>
          </View>
          <Note>{streak === 1 ? 'dia' : 'dias'}</Note>
        </View>
      </View>
    </Card>
  );
}

// Botão circular de marcar/desmarcar — extraído à parte só para o toque
// (onPress) não competir com o resto do cartão.
function ToggleCircle({ onPress, taken, theme }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        borderRadius: theme.radii.pill,
        borderWidth: 1.5,
        borderColor: taken ? 'transparent' : theme.colors.borderStrong,
        backgroundColor: taken ? theme.colors.gold : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon
        name="check"
        size={20}
        strokeWidth={2.4}
        color={taken ? (theme.isDark ? '#0B0F0C' : '#FFFFFF') : theme.colors.textMuted}
      />
    </Pressable>
  );
}
