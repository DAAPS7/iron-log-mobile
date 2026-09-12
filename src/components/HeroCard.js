/**
 * Cartão de destaque do topo do painel.
 *
 * É a única superfície do ecrã com tratamento de "hero": ocupa mais espaço,
 * tem um gradiente de acento próprio e concentra a ação principal do dia.
 * Tudo o resto do ecrã é deliberadamente mais calmo, para que a hierarquia
 * seja óbvia num relance.
 *
 * Não inventa dados: recebe o treino planeado para hoje (ou nada, em dia de
 * descanso) e o estado de já ter sido registado, exatamente como o resto da
 * app já calcula.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Icon from './Icon';
import { Badge, FadeInView } from './ui';
import { useTheme } from '../context/ThemeContext';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Boa madrugada';
  if (h < 13) return 'Bom dia';
  if (h < 20) return 'Boa tarde';
  return 'Boa noite';
}

export default function HeroCard({
  name,
  weekdayLabel,
  scheduledWorkout,
  alreadyDone,
  hasSchedule,
  onStart,
}) {
  const theme = useTheme();

  // Três estados possíveis, cada um com a sua mensagem e ação.
  let title;
  let caption;
  let badge = null;
  let action = null;

  if (scheduledWorkout && !alreadyDone) {
    title = scheduledWorkout.name;
    caption = `O teu treino de ${weekdayLabel.toLowerCase()}`;
    badge = { text: 'Hoje', color: theme.colors.accent };
    action = { label: 'Começar treino', icon: 'dumbbell' };
  } else if (scheduledWorkout && alreadyDone) {
    title = 'Treino concluído';
    caption = `Já registaste o ${scheduledWorkout.name} de hoje.`;
    badge = { text: 'Feito', color: theme.colors.good };
  } else if (hasSchedule) {
    title = 'Dia de descanso';
    caption = 'Sem treino planeado para hoje. Recuperar também é treinar.';
    badge = { text: 'Descanso', color: theme.colors.info };
  } else {
    title = 'Pronto para começar';
    caption = 'Define o teu plano semanal para veres aqui o treino do dia.';
  }

  return (
    <FadeInView>
      <View
        style={[
          {
            borderRadius: theme.radii.xl,
            overflow: 'hidden',
            marginBottom: theme.space.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceHigh,
          },
          theme.elevation.medium,
        ]}
      >
        {/* Lavagem de cor muito ténue: dá identidade sem competir com o texto. */}
        <LinearGradient
          colors={[
            hexToRgba(theme.colors.accent, theme.isDark ? 0.16 : 0.13),
            hexToRgba(theme.colors.accent2, 0.02),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          pointerEvents="none"
        />

        <View style={{ padding: theme.space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: theme.font.body,
                ...theme.type.secondary,
                color: theme.colors.textSecondary,
              }}
            >
              {greeting()}
              {name ? `, ${name}` : ''}
            </Text>
            {badge ? <Badge color={badge.color}>{badge.text}</Badge> : null}
          </View>

          <Text
            style={{
              fontFamily: theme.font.display,
              ...theme.type.h1,
              color: theme.colors.textPrimary,
              marginTop: theme.space.md,
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
            {caption}
          </Text>

          {action && onStart ? (
            <Pressable
              onPress={onStart}
              style={({ pressed }) => ({
                marginTop: theme.space.xl,
                alignSelf: 'flex-start',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <LinearGradient
                colors={theme.gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 13,
                  paddingHorizontal: theme.space.xl,
                  borderRadius: theme.radii.pill,
                }}
              >
                <Icon
                  name={action.icon}
                  size={18}
                  color={theme.isDark ? '#0B0F0C' : '#FFFFFF'}
                  strokeWidth={2.1}
                />
                <Text
                  style={{
                    fontFamily: theme.font.bodyBold,
                    ...theme.type.button,
                    textTransform: 'uppercase',
                    color: theme.isDark ? '#0B0F0C' : '#FFFFFF',
                  }}
                >
                  {action.label}
                </Text>
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>
      </View>
    </FadeInView>
  );
}

function hexToRgba(color, alpha) {
  if (!color) return 'transparent';
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  const h = color.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return `rgba(${parseInt(full.slice(0, 2), 16)}, ${parseInt(full.slice(2, 4), 16)}, ${parseInt(full.slice(4, 6), 16)}, ${alpha})`;
}
