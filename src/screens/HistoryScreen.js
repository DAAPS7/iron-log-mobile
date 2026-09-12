import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Body, Button, Card, EmptyState, Note, Screen, ScreenTitle } from '../components/ui';
import Icon from '../components/Icon';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { confirmAsync } from '../lib/confirm';
import { markDeleted } from '../lib/defaults';

function formatDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Agrupa as sessões pelo nome do treino, mantendo a ordem por data. */
function groupByWorkoutName(loggedWorkouts) {
  const sorted = [...loggedWorkouts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const groups = [];
  const byName = new Map();
  sorted.forEach((lw) => {
    if (!byName.has(lw.workoutName)) {
      const group = { name: lw.workoutName, items: [] };
      byName.set(lw.workoutName, group);
      groups.push(group);
    }
    byName.get(lw.workoutName).items.push(lw);
  });
  return groups;
}

export default function HistoryScreen({ navigation }) {
  const theme = useTheme();
  const { data, updateData } = useStore();
  const [open, setOpen] = useState(() => new Set());

  const groups = useMemo(
    () => groupByWorkoutName(data?.loggedWorkouts || []),
    [data?.loggedWorkouts],
  );

  if (!data) return null;

  function toggle(name) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function remove(id) {
    const ok = await confirmAsync('Apagar registo', 'Queres apagar este treino registado?', 'Apagar');
    if (!ok) return;
    updateData((prev) => ({
      ...prev,
      loggedWorkouts: prev.loggedWorkouts.filter((lw) => lw.id !== id),
      deletedIds: markDeleted(prev, 'loggedWorkouts', id),
    }));
  }

  return (
    <Screen>
      <ScreenTitle subtitle="Os teus treinos registados, agrupados por treino.">
        Histórico
      </ScreenTitle>

      {!groups.length ? (
        <EmptyState
          title="Sem treinos registados"
          message="Regista uma sessão para a veres aqui."
        />
      ) : (
        groups.map((group) => {
          const isOpen = open.has(group.name);
          return (
            <View key={group.name} style={{ marginBottom: theme.spacing.lg }}>
              {/* Cabeçalho do grupo: é uma superfície própria (em vez de só
                  uma linha de texto com um traço por baixo), para se ler
                  claramente como algo tocável e para o estado aberto ser
                  óbvio. */}
              <Pressable
                onPress={() => toggle(group.name)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: theme.space.md,
                  paddingVertical: theme.space.md,
                  paddingHorizontal: theme.space.lg,
                  borderRadius: theme.radii.md,
                  borderWidth: 1,
                  borderColor: isOpen ? theme.colors.borderStrong : theme.colors.border,
                  backgroundColor: isOpen
                    ? theme.colors.surfaceElevated
                    : theme.colors.surface,
                  marginBottom: isOpen ? theme.space.md : 0,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: theme.font.display,
                      ...theme.type.h3,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {group.name}
                  </Text>
                  <Note style={{ marginTop: 1 }}>
                    {group.items.length}{' '}
                    {group.items.length === 1 ? 'sessão' : 'sessões'}
                  </Note>
                </View>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: theme.radii.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.bgSoft,
                  }}
                >
                  <Icon
                    name={isOpen ? 'chevronUp' : 'chevronDown'}
                    size={15}
                    color={theme.colors.textSecondary}
                  />
                </View>
              </Pressable>

              {isOpen
                ? group.items.map((lw) => (
                    <Card key={lw.id}>
                      <Body style={{ fontFamily: theme.font.bodyBold }}>
                        {formatDate(lw.date)}
                      </Body>
                      <Note style={{ marginTop: 6 }}>
                        {lw.exercises
                          .map((ex) => `${ex.name}: ${ex.sets.join(', ')}`)
                          .join(' · ')}
                      </Note>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <Button
                          title="Editar"
                          variant="ghost"
                          onPress={() =>
                            navigation.navigate('LogSession', { logId: lw.id })
                          }
                          style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                        />
                        <Button
                          title="Apagar"
                          variant="danger"
                          onPress={() => remove(lw.id)}
                          style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                        />
                      </View>
                    </Card>
                  ))
                : null}
            </View>
          );
        })
      )}
    </Screen>
  );
}
