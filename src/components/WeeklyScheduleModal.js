/**
 * Modal do plano semanal: atribui um treino (ou nenhum) a cada dia.
 * Equivalente ao modalWeeklySchedule da versão web.
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Body, Button, Note } from './ui';
import { useTheme } from '../context/ThemeContext';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '../lib/schedule';

export default function WeeklyScheduleModal({ visible, onClose, workouts, schedule, onSave }) {
  const theme = useTheme();
  const [draft, setDraft] = useState(schedule);

  // Reabre sempre com o valor mais recente guardado.
  React.useEffect(() => {
    if (visible) setDraft(schedule);
  }, [visible, schedule]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.font.display,
                  fontSize: 20,
                  color: theme.colors.ink,
                  textTransform: 'uppercase',
                }}
              >
                Plano Semanal
              </Text>
              <Pressable onPress={onClose}>
                <Text style={{ fontSize: 18, color: theme.colors.muted }}>✕</Text>
              </Pressable>
            </View>
            <Note style={{ marginBottom: 16 }}>
              Define que treino fazes em cada dia (deixa em "Nenhum" os dias de
              descanso). Quando abrires a app nesse dia, avisamos-te.
            </Note>

            {workouts.length === 0 ? (
              <Note>Cria pelo menos um treino antes de montares o plano semanal.</Note>
            ) : (
              WEEKDAY_ORDER.map((day) => (
                <View key={day} style={{ marginBottom: 14 }}>
                  <Text
                    style={{
                      fontFamily: theme.font.bodyBold,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: theme.colors.muted,
                      marginBottom: 6,
                    }}
                  >
                    {WEEKDAY_LABELS[day]}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <DayOption
                      label="Nenhum"
                      active={!draft[day]}
                      onPress={() => setDraft((d) => ({ ...d, [day]: null }))}
                    />
                    {workouts.map((w) => (
                      <DayOption
                        key={w.id}
                        label={w.name}
                        active={draft[day] === w.id}
                        onPress={() => setDraft((d) => ({ ...d, [day]: w.id }))}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}

            <Button
              title="Guardar plano"
              variant="strength"
              onPress={() => onSave(draft)}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
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
      style={{
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: active ? theme.colors.ink : theme.colors.border,
        backgroundColor: active ? theme.colors.ink : 'transparent',
      }}
    >
      <Body color={active ? theme.colors.bg : theme.colors.ink}>{label}</Body>
    </Pressable>
  );
}
