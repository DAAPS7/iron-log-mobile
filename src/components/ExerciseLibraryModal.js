/**
 * Biblioteca de exercícios: lista alfabética, com badge por grupo muscular.
 * Equivalente ao modalExerciseLibrary da versão web.
 */

import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Note } from './ui';
import { useTheme } from '../context/ThemeContext';
import { STRENGTH_EXERCISES } from '../lib/exercises';

const PALETTE_KEYS = ['strength', 'cardio', 'gold', 'info'];

export default function ExerciseLibraryModal({ visible, onClose }) {
  const theme = useTheme();

  const sorted = useMemo(
    () => [...STRENGTH_EXERCISES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  // Atribui uma cor consistente a cada grupo muscular, ciclando pela paleta.
  const muscleColors = useMemo(() => {
    const map = {};
    let i = 0;
    sorted.forEach((ex) => {
      if (!map[ex.muscle]) {
        map[ex.muscle] = theme.colors[PALETTE_KEYS[i % PALETTE_KEYS.length]];
        i++;
      }
    });
    return map;
  }, [sorted, theme.colors]);

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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.lg,
              paddingBottom: 6,
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
              Biblioteca de Exercícios
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 18, color: theme.colors.muted }}>✕</Text>
            </Pressable>
          </View>
          <Note style={{ paddingHorizontal: theme.spacing.lg, marginBottom: 8 }}>
            Os exercícios de força disponíveis na app, por ordem alfabética.
          </Note>

          <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: 0 }}>
            {sorted.map((ex, i) => {
              const color = muscleColors[ex.muscle];
              return (
                <View
                  key={ex.name}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.colors.bgSoft,
                  }}
                >
                  <Text style={{ fontFamily: theme.font.body, color: theme.colors.ink, flex: 1 }}>
                    {ex.name}
                  </Text>
                  <View
                    style={{
                      paddingVertical: 3,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      backgroundColor: `${color}26`,
                    }}
                  >
                    <Text style={{ fontFamily: theme.font.bodyBold, fontSize: 11, color }}>
                      {ex.muscle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
