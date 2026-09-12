/**
 * Modal do plano semanal: atribui um treino (ou nenhum) a cada dia.
 *
 * Antes mostrava todos os treinos como botões lado a lado, repetidos para
 * cada um dos 7 dias — com poucos treinos já enchia o ecrã todo e era
 * difícil ver o plano da semana de relance. Agora cada dia é uma linha
 * compacta com a escolha atual; tocar abre a lista só para esse dia, e a
 * escolha grava-se logo (não é preciso lembrar de tocar em "Guardar").
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import Icon from './Icon';
import { Note } from './ui';
import { useTheme } from '../context/ThemeContext';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '../lib/schedule';

export default function WeeklyScheduleModal({ visible, onClose, workouts, schedule, onSave }) {
  const theme = useTheme();
  const [draft, setDraft] = useState(schedule);
  const [openDay, setOpenDay] = useState(null);

  // Reabre sempre com o valor mais recente guardado.
  React.useEffect(() => {
    if (visible) {
      setDraft(schedule);
      setOpenDay(null);
    }
  }, [visible, schedule]);

  function choose(day, workoutId) {
    const next = { ...draft, [day]: workoutId };
    setDraft(next);
    onSave(next);
    setOpenDay(null);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.scrim, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            maxHeight: '85%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.space.lg,
              paddingBottom: theme.space.sm,
            }}
          >
            <Text
              style={{
                fontFamily: theme.font.display,
                ...theme.type.h3,
                color: theme.colors.textPrimary,
              }}
            >
              Plano Semanal
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ fontSize: 18, color: theme.colors.textMuted }}>✕</Text>
            </Pressable>
          </View>
          <Note style={{ paddingHorizontal: theme.space.lg, marginBottom: theme.space.sm }}>
            Toca num dia para escolheres o treino (ou "Descanso"). Grava-se sozinho.
          </Note>

          {workouts.length === 0 ? (
            <Note style={{ padding: theme.space.lg }}>
              Cria pelo menos um treino antes de montares o plano semanal.
            </Note>
          ) : (
            <ScrollView contentContainerStyle={{ padding: theme.space.lg, paddingTop: theme.space.sm }}>
              {WEEKDAY_ORDER.map((day) => {
                const chosen = workouts.find((w) => w.id === draft[day]);
                const isOpen = openDay === day;
                return (
                  <View
                    key={day}
                    style={{
                      marginBottom: theme.space.sm,
                      borderRadius: theme.radii.md,
                      borderWidth: 1,
                      borderColor: isOpen ? theme.colors.borderStrong : theme.colors.border,
                      backgroundColor: isOpen ? theme.colors.surface : 'transparent',
                      overflow: 'hidden',
                    }}
                  >
                    <Pressable
                      onPress={() => setOpenDay(isOpen ? null : day)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: theme.space.md,
                        paddingHorizontal: theme.space.lg,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text
                        style={{
                          fontFamily: theme.font.bodyBold,
                          ...theme.type.body,
                          color: theme.colors.textPrimary,
                          width: 78,
                        }}
                      >
                        {WEEKDAY_LABELS[day]}
                      </Text>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            fontFamily: theme.font.body,
                            ...theme.type.secondary,
                            color: chosen ? theme.colors.accent : theme.colors.textMuted,
                          }}
                        >
                          {chosen ? chosen.name : 'Descanso'}
                        </Text>
                        <Icon
                          name={isOpen ? 'chevronUp' : 'chevronDown'}
                          size={16}
                          color={theme.colors.textMuted}
                        />
                      </View>
                    </Pressable>

                    {isOpen ? (
                      <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.hairline }}>
                        <DayOption
                          label="Descanso"
                          active={!draft[day]}
                          onPress={() => choose(day, null)}
                        />
                        {workouts.map((w) => (
                          <DayOption
                            key={w.id}
                            label={w.name}
                            active={draft[day] === w.id}
                            onPress={() => choose(day, w.id)}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DayOption({ label, active, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 11,
        paddingHorizontal: theme.space.lg,
        backgroundColor: pressed ? theme.colors.bgSoft : 'transparent',
      })}
    >
      <Text
        style={{
          fontFamily: theme.font.body,
          ...theme.type.body,
          color: active ? theme.colors.accent : theme.colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {active ? <Icon name="check" size={16} color={theme.colors.accent} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}
