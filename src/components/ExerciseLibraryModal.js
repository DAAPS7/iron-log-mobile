/**
 * Biblioteca de exercícios.
 *
 * Dois modos de organização:
 *  - alfabética: lista única, como antes;
 *  - por músculo: um grupo colapsável por músculo, para navegar por zona do
 *    corpo em vez de percorrer a lista toda.
 *
 * Quando recebe `onSelect`, a biblioteca funciona como seletor — tocar num
 * exercício escolhe-o e fecha, em vez de ser só consulta. É o que o
 * construtor de treino usa agora para escolher exercícios, em vez do
 * dropdown simples que tinha antes.
 */

import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import Icon from './Icon';
import { Note, SegmentedControl } from './ui';
import { useTheme } from '../context/ThemeContext';
import { STRENGTH_EXERCISES } from '../lib/exercises';

const PALETTE_KEYS = ['strength', 'cardio', 'gold', 'info'];

export default function ExerciseLibraryModal({ visible, onClose, onSelect, allowCustom }) {
  const theme = useTheme();
  const [sortMode, setSortMode] = useState('muscle'); // 'muscle' | 'alpha'
  const [openMuscle, setOpenMuscle] = useState(null);

  const alphaSorted = useMemo(
    () => [...STRENGTH_EXERCISES].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const byMuscle = useMemo(() => {
    const groups = {};
    alphaSorted.forEach((ex) => {
      if (!groups[ex.muscle]) groups[ex.muscle] = [];
      groups[ex.muscle].push(ex);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [alphaSorted]);

  const muscleColors = useMemo(() => {
    const map = {};
    let i = 0;
    byMuscle.forEach(([muscle]) => {
      map[muscle] = theme.colors[PALETTE_KEYS[i % PALETTE_KEYS.length]];
      i++;
    });
    return map;
  }, [byMuscle, theme.colors]);

  function pick(ex) {
    if (onSelect) onSelect(ex);
    onClose();
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
              Biblioteca de Exercícios
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ fontSize: 18, color: theme.colors.textMuted }}>✕</Text>
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: theme.space.lg, marginBottom: theme.space.sm }}>
            <SegmentedControl
              value={sortMode}
              onChange={setSortMode}
              options={[
                { value: 'muscle', label: 'Por músculo' },
                { value: 'alpha', label: 'A-Z' },
              ]}
            />
          </View>

          <ScrollView contentContainerStyle={{ padding: theme.space.lg, paddingTop: 0 }}>
            {allowCustom ? (
              <Pressable
                onPress={() => pick(null)}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.hairline,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: theme.font.bodyBold,
                    ...theme.type.body,
                    color: theme.colors.accent,
                  }}
                >
                  + Exercício personalizado…
                </Text>
              </Pressable>
            ) : null}

            {sortMode === 'alpha'
              ? alphaSorted.map((ex, i) => (
                  <ExerciseRow
                    key={ex.name}
                    exercise={ex}
                    color={muscleColors[ex.muscle]}
                    showTopBorder={i > 0 || allowCustom}
                    onPress={onSelect ? () => pick(ex) : undefined}
                  />
                ))
              : byMuscle.map(([muscle, list]) => {
                  const isOpen = openMuscle === muscle;
                  return (
                    <View key={muscle} style={{ marginBottom: 8 }}>
                      <Pressable
                        onPress={() => setOpenMuscle(isOpen ? null : muscle)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 12,
                          paddingHorizontal: theme.space.md,
                          borderRadius: theme.radii.md,
                          backgroundColor: isOpen
                            ? theme.colors.surface
                            : theme.colors.bgSoft,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: muscleColors[muscle],
                            }}
                          />
                          <Text
                            style={{
                              fontFamily: theme.font.bodyBold,
                              ...theme.type.body,
                              color: theme.colors.textPrimary,
                            }}
                          >
                            {muscle}
                          </Text>
                          <Note>({list.length})</Note>
                        </View>
                        <Icon
                          name={isOpen ? 'chevronUp' : 'chevronDown'}
                          size={16}
                          color={theme.colors.textMuted}
                        />
                      </Pressable>

                      {isOpen
                        ? list.map((ex, i) => (
                            <ExerciseRow
                              key={ex.name}
                              exercise={ex}
                              color={muscleColors[ex.muscle]}
                              showMuscleBadge={false}
                              showTopBorder={i > 0}
                              indent
                              onPress={onSelect ? () => pick(ex) : undefined}
                            />
                          ))
                        : null}
                    </View>
                  );
                })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ExerciseRow({ exercise, color, onPress, showMuscleBadge = true, showTopBorder, indent }) {
  const theme = useTheme();
  const baseStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    paddingLeft: indent ? theme.space.lg : 0,
    borderTopWidth: showTopBorder ? 1 : 0,
    borderTopColor: theme.colors.hairline,
  };

  const content = (
    <>
      <Text
        style={{
          fontFamily: theme.font.body,
          ...theme.type.body,
          color: theme.colors.textPrimary,
          flex: 1,
        }}
      >
        {exercise.name}
      </Text>
      {showMuscleBadge ? (
        <View
          style={{
            paddingVertical: 3,
            paddingHorizontal: 10,
            borderRadius: theme.radii.pill,
            backgroundColor: `${color}26`,
          }}
        >
          <Text style={{ fontFamily: theme.font.bodyBold, fontSize: 11, color }}>
            {exercise.muscle}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (!onPress) return <View style={baseStyle}>{content}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [baseStyle, pressed ? { opacity: 0.6 } : null]}>
      {content}
    </Pressable>
  );
}
