/**
 * Resumo do dia na Nutrição.
 *
 * Junta num só bloco o que antes eram três cartões separados (navegação de
 * data, calorias e macros). A composição é deliberadamente diferente do
 * resto: anel grande à esquerda com as calorias, macros compactos à
 * direita — dá para ler o dia inteiro num relance, sem scroll.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Icon from './Icon';
import ProgressRing from './ProgressRing';
import { useTheme } from '../context/ThemeContext';

function MacroBar({ label, value, goal, color }) {
  const theme = useTheme();
  const pct = goal ? Math.max(0, Math.min(1, value / goal)) : 0;
  return (
    <View style={{ marginBottom: 9 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text
          style={{
            fontFamily: theme.font.bodyBold,
            ...theme.type.caption,
            textTransform: 'uppercase',
            color: theme.colors.textMuted,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: theme.font.body,
            ...theme.type.caption,
            color: theme.colors.textSecondary,
          }}
        >
          {Math.round(value)}
          {goal ? `/${goal}` : ''}g
        </Text>
      </View>
      <View
        style={{
          height: 5,
          borderRadius: 999,
          backgroundColor: theme.colors.hairline,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct * 100}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

export default function DailySummary({
  date,
  onShiftDate,
  isToday,
  calories,
  calorieGoal,
  macros,
  macroGoals,
}) {
  const theme = useTheme();
  const progress = calorieGoal ? calories / calorieGoal : 0;
  const over = calorieGoal && calories > calorieGoal;

  const label = new Date(`${date}T00:00:00`).toLocaleDateString('pt-PT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  return (
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
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 90 }}
        pointerEvents="none"
      />

      {/* Navegação de dia */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.space.md,
          paddingTop: theme.space.md,
        }}
      >
        <DateArrow icon="chevronLeft" onPress={() => onShiftDate(-1)} />
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: theme.font.bodyBold,
              ...theme.type.label,
              textTransform: 'uppercase',
              color: isToday ? theme.colors.accent : theme.colors.textSecondary,
            }}
          >
            {isToday ? 'Hoje' : label}
          </Text>
        </View>
        <DateArrow icon="chevronRight" onPress={() => onShiftDate(1)} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.xl,
          padding: theme.space.xl,
          paddingTop: theme.space.lg,
        }}
      >
        <ProgressRing
          progress={progress}
          size={104}
          thickness={9}
          gradient={!over}
          color={over ? theme.colors.warning : undefined}
        >
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: theme.font.display,
                ...theme.type.numericMd,
                color: theme.colors.textPrimary,
              }}
            >
              {Math.round(calories)}
            </Text>
            <Text
              style={{
                fontFamily: theme.font.body,
                ...theme.type.caption,
                color: theme.colors.textMuted,
              }}
            >
              {calorieGoal ? `de ${calorieGoal}` : 'kcal'}
            </Text>
          </View>
        </ProgressRing>

        <View style={{ flex: 1 }}>
          <MacroBar
            label="Proteína"
            value={macros.protein}
            goal={macroGoals.protein}
            color={theme.colors.accent}
          />
          <MacroBar
            label="Hidratos"
            value={macros.carbs}
            goal={macroGoals.carbs}
            color={theme.colors.accent2}
          />
          <MacroBar
            label="Gordura"
            value={macros.fat}
            goal={macroGoals.fat}
            color={theme.colors.gold}
          />
        </View>
      </View>

      {calorieGoal ? (
        <View
          style={{
            paddingHorizontal: theme.space.xl,
            paddingBottom: theme.space.lg,
            marginTop: -theme.space.sm,
          }}
        >
          <Text
            style={{
              fontFamily: theme.font.body,
              ...theme.type.secondary,
              color: over ? theme.colors.warning : theme.colors.textMuted,
            }}
          >
            {over
              ? `${Math.round(calories - calorieGoal)} kcal acima da meta.`
              : `Faltam ${Math.round(calorieGoal - calories)} kcal para a meta.`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function DateArrow({ icon, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 38,
        height: 38,
        borderRadius: theme.radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.5 : 1,
      })}
    >
      <Icon name={icon} size={18} color={theme.colors.textSecondary} />
    </Pressable>
  );
}
