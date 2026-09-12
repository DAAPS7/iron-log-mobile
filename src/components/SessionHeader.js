/**
 * Cabeçalho da sessão de treino.
 *
 * Responde às duas perguntas que se fazem a meio de um treino: "quanto já
 * fiz?" e "quanto falta?". O progresso conta apenas séries de trabalho — as
 * de aquecimento não contam para o alvo, tal como em todo o resto da app.
 */

import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import ProgressRing from './ProgressRing';
import { FadeInView } from './ui';
import { useTheme } from '../context/ThemeContext';

export default function SessionHeader({ title, completedSets, targetSets, exercisesDone, exercisesTotal }) {
  const theme = useTheme();
  const progress = targetSets > 0 ? Math.min(1, completedSets / targetSets) : 0;
  const complete = targetSets > 0 && completedSets >= targetSets;

  return (
    <FadeInView>
      <View
        style={[
          {
            borderRadius: theme.radii.xl,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceHigh,
            marginBottom: theme.space.lg,
          },
          theme.elevation.medium,
        ]}
      >
        <LinearGradient
          colors={theme.gradients.surfaceSheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 150 }}
          pointerEvents="none"
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.lg,
            padding: theme.space.xl,
          }}
        >
          <ProgressRing progress={progress} size={76} thickness={7} gradient>
            <Text
              style={{
                fontFamily: theme.font.display,
                ...theme.type.numericSm,
                color: complete ? theme.colors.good : theme.colors.textPrimary,
              }}
            >
              {Math.round(progress * 100)}%
            </Text>
          </ProgressRing>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: theme.font.display,
                ...theme.type.h2,
                color: theme.colors.textPrimary,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: theme.font.body,
                ...theme.type.secondary,
                color: theme.colors.textMuted,
                marginTop: 4,
              }}
            >
              {targetSets > 0
                ? `${completedSets} de ${targetSets} séries · ${exercisesDone}/${exercisesTotal} exercícios`
                : `${completedSets} série(s) registada(s)`}
            </Text>
          </View>
        </View>
      </View>
    </FadeInView>
  );
}
