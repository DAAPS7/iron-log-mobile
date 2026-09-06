import React from 'react';
import { Alert, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Note,
  Screen,
  ScreenTitle,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { formatMinSec } from '../lib/sets';
import { weekdayKeyFor, WEEKDAY_LABELS } from '../lib/schedule';

export default function WorkoutsScreen({ navigation }) {
  const theme = useTheme();
  const { data, updateData } = useStore();
  if (!data) return null;

  const todayKey = weekdayKeyFor(new Date());
  const scheduledId = data.weeklySchedule?.[todayKey];
  const scheduled = data.workouts.find((w) => w.id === scheduledId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyDone =
    scheduled &&
    data.loggedWorkouts.some(
      (lw) => lw.date === todayStr && lw.workoutId === scheduled.id,
    );

  function removeWorkout(id) {
    Alert.alert('Apagar treino', 'Queres mesmo apagar este treino?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () =>
          updateData((prev) => ({
            ...prev,
            workouts: prev.workouts.filter((w) => w.id !== id),
          })),
      },
    ]);
  }

  return (
    <Screen>
      <ScreenTitle subtitle="Cria os teus treinos e regista cada sessão.">
        Treinos
      </ScreenTitle>

      {/* Lembrete do plano semanal */}
      {scheduled ? (
        <Card accent={alreadyDone ? theme.colors.cardio : theme.colors.gold}>
          <CardTitle>Plano de hoje ({WEEKDAY_LABELS[todayKey]})</CardTitle>
          {alreadyDone ? (
            <Note>✅ Já registaste o "{scheduled.name}" de hoje. Bom trabalho!</Note>
          ) : (
            <>
              <Body style={{ marginBottom: 10 }}>
                Hoje é dia de <Body style={{ fontFamily: theme.font.bodyBold }}>
                  {scheduled.name}
                </Body>.
              </Body>
              <Button
                title="Registar agora"
                variant="strength"
                onPress={() =>
                  navigation.navigate('LogSession', { workoutId: scheduled.id })
                }
              />
            </>
          )}
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: theme.spacing.lg }}>
        <Button
          title="+ Criar treino"
          variant="strength"
          onPress={() => navigation.navigate('WorkoutBuilder', {})}
        />
        <Button
          title="+ Treino livre"
          variant="ghost"
          onPress={() => navigation.navigate('LogSession', { free: true })}
        />
      </View>

      {data.workouts.length === 0 ? (
        <EmptyState
          title="Ainda sem treinos"
          message="Cria o teu primeiro treino com exercícios de força e/ou cardio."
        />
      ) : (
        data.workouts.map((w) => (
          <Card key={w.id}>
            <CardTitle>{w.name}</CardTitle>
            <Note style={{ marginBottom: 8 }}>
              {w.exercises.length} exercício(s)
            </Note>

            {w.exercises.map((ex, i) => {
              const warmup = ex.warmupSets ? `${ex.warmupSets}+` : '';
              const detail =
                ex.type === 'strength'
                  ? `${warmup}${ex.sets}x(${ex.minReps}-${ex.maxReps})`
                  : `${warmup}${ex.sets}x${formatMinSec(ex.duration)}${
                      ex.distance ? ` · ${ex.distance}${ex.distanceUnit || 'km'}` : ''
                    }`;
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 6,
                    paddingVertical: 7,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.colors.bgSoft,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 120 }}>
                    <Body>{ex.name}</Body>
                    {ex.notes ? (
                      <Note style={{ fontStyle: 'italic' }}>📝 {ex.notes}</Note>
                    ) : null}
                  </View>
                  <Note>{detail}</Note>
                </View>
              );
            })}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Button
                title="Registar"
                variant="strength"
                onPress={() => navigation.navigate('LogSession', { workoutId: w.id })}
                style={{ paddingVertical: 8, paddingHorizontal: 16 }}
              />
              <Button
                title="Editar"
                variant="ghost"
                onPress={() =>
                  navigation.navigate('WorkoutBuilder', { workoutId: w.id })
                }
                style={{ paddingVertical: 8, paddingHorizontal: 16 }}
              />
              <Button
                title="Apagar"
                variant="danger"
                onPress={() => removeWorkout(w.id)}
                style={{ paddingVertical: 8, paddingHorizontal: 16 }}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
