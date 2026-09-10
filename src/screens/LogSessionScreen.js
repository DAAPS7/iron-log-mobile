import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  Body,
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Note,
  Screen,
  SegmentedControl,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { todayLocal } from '../lib/date';
import { uid } from '../lib/defaults';
import { confirmAsync, notify } from '../lib/confirm';
import {
  DISTANCE_UNITS,
  WEIGHT_UNITS,
  formatCardioSet,
  formatMinSec,
  formatStrengthSet,
  getEffectivePR,
  isWarmupSet,
} from '../lib/sets';

const DRAFT_KEY = 'iron_log_session_draft';

/** Converte um exercício do modelo de treino num exercício de sessão. */
function toSessionExercise(ex) {
  return {
    name: ex.name,
    type: ex.type,
    muscle: ex.muscle ?? null,
    minReps: ex.minReps ?? null,
    maxReps: ex.maxReps ?? null,
    duration: ex.duration ?? null,
    targetSets: ex.sets ?? null,
    targetWarmupSets: ex.warmupSets ?? null,
    targetDistance: ex.distance ?? null,
    targetDistanceUnit: ex.distanceUnit ?? 'km',
    plannedNote: ex.notes || null,
    sets: [],
  };
}

export default function LogSessionScreen({ route, navigation }) {
  const theme = useTheme();
  const { data, updateData } = useStore();

  const workoutId = route.params?.workoutId || null;
  const isFree = !!route.params?.free;
  const editingLogId = route.params?.logId || null;
  const editingEntry = editingLogId
    ? data.loggedWorkouts.find((lw) => lw.id === editingLogId)
    : null;
  const workout = workoutId ? data.workouts.find((w) => w.id === workoutId) : null;

  const [session, setSession] = useState(() => {
    if (editingEntry) {
      const template = data.workouts.find((w) => w.id === editingEntry.workoutId);
      let exercises;
      if (template) {
        // Começa a partir do treino modelo (para exercícios planeados mas
        // não registados nesse dia continuarem visíveis), e acrescenta os
        // que foram registados mas já não fazem parte do modelo.
        exercises = template.exercises.map((tex) => {
          const logged = editingEntry.exercises.find(
            (ex) => ex.type === tex.type && ex.name === tex.name,
          );
          return { ...toSessionExercise(tex), sets: logged ? [...logged.sets] : [] };
        });
        editingEntry.exercises.forEach((ex) => {
          const inTemplate = template.exercises.some(
            (tex) => tex.type === ex.type && tex.name === ex.name,
          );
          if (!inTemplate) {
            exercises.push({
              name: ex.name,
              type: ex.type,
              muscle: ex.muscle ?? null,
              minReps: null,
              maxReps: null,
              duration: null,
              targetSets: null,
              targetWarmupSets: null,
              targetDistance: null,
              targetDistanceUnit: 'km',
              plannedNote: null,
              sets: [...ex.sets],
            });
          }
        });
      } else {
        exercises = editingEntry.exercises.map((ex) => ({
          name: ex.name,
          type: ex.type,
          muscle: ex.muscle ?? null,
          minReps: null,
          maxReps: null,
          duration: null,
          targetSets: null,
          targetWarmupSets: null,
          targetDistance: null,
          targetDistanceUnit: 'km',
          plannedNote: null,
          sets: [...ex.sets],
        }));
      }
      return {
        editingLogId,
        workoutId: editingEntry.workoutId,
        workoutName: editingEntry.workoutName,
        date: editingEntry.date,
        exercises,
      };
    }
    return {
      editingLogId: null,
      workoutId,
      workoutName: workout?.name || '',
      date: todayLocal(),
      exercises: workout ? workout.exercises.map(toSessionExercise) : [],
    };
  });

  /* ---------- Rascunho automático ----------
     Só se aplica a sessões novas — editar um registo já existente não
     precisa de rascunho, já está guardado. */
  useEffect(() => {
    if (session.editingLogId) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(session)).catch(() => {});
  }, [session]);

  // Ao abrir uma sessão nova, oferece retomar um rascunho compatível.
  useEffect(() => {
    if (editingLogId) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const draft = JSON.parse(raw);
        const sameWorkout = draft.workoutId === workoutId;
        const hasSets = draft.exercises?.some((ex) => ex.sets.length);
        if (!sameWorkout || !hasSets) return;

        const shouldResume = await confirmAsync(
          'Registo por terminar',
          'Tens um registo deste treino por terminar. Queres continuar de onde ficaste?',
          'Continuar',
        );
        if (shouldResume) setSession(draft);
        else await AsyncStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        // rascunho ilegível — ignora
      }
    })();
    // Só corre à entrada do ecrã.
  }, []);

  function addSet(exIndex, setStr) {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, setStr] } : ex,
      ),
    }));
  }

  function removeSet(exIndex, setIndex) {
    setSession((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.filter((_, s) => s !== setIndex) }
          : ex,
      ),
    }));
  }

  function addExtraExercise(type, name) {
    setSession((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name,
          type,
          muscle: null,
          minReps: null,
          maxReps: null,
          duration: null,
          targetSets: null,
          targetWarmupSets: null,
          targetDistance: null,
          targetDistanceUnit: 'km',
          plannedNote: null,
          sets: [],
        },
      ],
    }));
  }

  async function finish() {
    const withSets = session.exercises.filter((ex) => ex.sets.length);
    if (!withSets.length) {
      notify('Nada registado', 'Regista pelo menos uma série.');
      return;
    }
    const exercisesOut = withSets.map((ex) => ({
      name: ex.name,
      type: ex.type,
      muscle: ex.muscle,
      sets: [...ex.sets],
    }));

    if (session.editingLogId) {
      updateData((prev) => ({
        ...prev,
        loggedWorkouts: prev.loggedWorkouts.map((lw) =>
          lw.id === session.editingLogId
            ? {
                ...lw,
                workoutName: session.workoutName.trim() || 'Treino Livre',
                date: session.date,
                exercises: exercisesOut,
              }
            : lw,
        ),
      }));
    } else {
      const entry = {
        id: uid(),
        workoutId: session.workoutId,
        workoutName: session.workoutName.trim() || 'Treino Livre',
        date: todayLocal(),
        exercises: exercisesOut,
      };
      updateData((prev) => ({
        ...prev,
        loggedWorkouts: [...prev.loggedWorkouts, entry],
      }));
      await AsyncStorage.removeItem(DRAFT_KEY);
    }
    navigation.goBack();
  }

  async function removeEntry() {
    const ok = await confirmAsync(
      'Apagar registo',
      'Queres mesmo apagar este treino registado?',
      'Apagar',
    );
    if (!ok) return;
    updateData((prev) => ({
      ...prev,
      loggedWorkouts: prev.loggedWorkouts.filter(
        (lw) => lw.id !== session.editingLogId,
      ),
    }));
    navigation.goBack();
  }

  return (
    <Screen>
      {!session.editingLogId ? (
        <Note style={{ marginBottom: 12 }}>
          💾 O progresso vai sendo guardado como rascunho no telemóvel (para
          não se perder se a app fechar a meio), mas só fica registado a
          sério quando premires "Concluir treino".
        </Note>
      ) : null}

      {isFree || (!workout && !session.editingLogId) ? (
        <Field label="Nome do treino">
          <Input
            value={session.workoutName}
            onChangeText={(v) => setSession((p) => ({ ...p, workoutName: v }))}
            placeholder="Ex: Treino de hoje"
          />
        </Field>
      ) : null}

      {session.editingLogId ? (
        <Field label="Data">
          <Input
            value={session.date}
            onChangeText={(v) => setSession((p) => ({ ...p, date: v }))}
            placeholder="AAAA-MM-DD"
          />
        </Field>
      ) : null}

      {session.exercises.map((ex, i) => (
        <ExerciseLogger
          key={`${ex.name}-${i}`}
          exercise={ex}
          onAddSet={(s) => addSet(i, s)}
          onRemoveSet={(si) => removeSet(i, si)}
          onRemove={() =>
            setSession((prev) => ({
              ...prev,
              exercises: prev.exercises.filter((_, idx) => idx !== i),
            }))
          }
        />
      ))}

      <ExtraExerciseAdder onAdd={addExtraExercise} />

      <Button
        title={session.editingLogId ? 'Guardar alterações' : 'Concluir treino'}
        variant="primary"
        onPress={finish}
      />

      {session.editingLogId ? (
        <Button
          title="Apagar registo"
          variant="danger"
          onPress={removeEntry}
          style={{ marginTop: 10 }}
        />
      ) : null}
    </Screen>
  );
}

/** Um exercício dentro da sessão: alvo, séries feitas e formulário. */
function ExerciseLogger({ exercise: ex, onAddSet, onRemoveSet, onRemove }) {
  const theme = useTheme();
  const { data } = useStore();
  const isStrength = ex.type === 'strength';
  const [historyOpen, setHistoryOpen] = useState(false);

  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('kg');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState(ex.targetDistanceUnit || 'km');
  const [notes, setNotes] = useState('');
  const [warmup, setWarmup] = useState(false);

  const warmupPrefix = ex.targetWarmupSets ? `${ex.targetWarmupSets}+` : '';
  const hasTarget = ex.targetSets != null;
  const target = !hasTarget
    ? 'Exercício extra'
    : isStrength
      ? `Alvo: ${warmupPrefix}${ex.targetSets}x(${ex.minReps}-${ex.maxReps} reps)`
      : `Alvo: ${warmupPrefix}${ex.targetSets}x${ex.duration != null ? formatMinSec(ex.duration) : 'duração livre'}${
          ex.targetDistance ? ` · ${ex.targetDistance}${ex.targetDistanceUnit}` : ''
        }`;

  const workingCount = ex.sets.filter((s) => !isWarmupSet(s)).length;
  const warmupCount = ex.sets.length - workingCount;

  function submit() {
    if (isStrength) {
      const r = parseInt(reps, 10);
      if (!r || r < 1) return;
      const w = parseFloat(String(weight).replace(',', '.')) || 0;
      onAddSet(
        formatStrengthSet({ reps: r, weight: w, unit, notes: notes.trim(), isWarmup: warmup }),
      );
    } else {
      const m = parseInt(minutes, 10) || 0;
      const s = parseInt(seconds, 10) || 0;
      if (m <= 0 && s <= 0) return;
      const d = parseFloat(String(distance).replace(',', '.'));
      onAddSet(
        formatCardioSet({
          minutes: m,
          seconds: s,
          distance: isNaN(d) ? 0 : d,
          distanceUnit,
          notes: notes.trim(),
          isWarmup: warmup,
        }),
      );
    }
    setReps('');
    setWeight('');
    setMinutes('');
    setSeconds('');
    setDistance('');
    setNotes('');
    setWarmup(false);
  }

  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <Body style={{ fontFamily: theme.font.bodyBold, flex: 1 }}>{ex.name}</Body>
        <Pressable onPress={onRemove}>
          <Text style={{ color: theme.colors.muted, fontSize: 16 }}>✕</Text>
        </Pressable>
      </View>

      <Note>
        {target}
        {ex.targetSets ? ` · ${workingCount}/${ex.targetSets} feitas` : ''}
        {ex.targetWarmupSets
          ? ` · aquecimento ${warmupCount}/${ex.targetWarmupSets}`
          : warmupCount
            ? ` · ${warmupCount} aquecimento`
            : ''}
      </Note>

      {ex.plannedNote ? (
        <Note style={{ fontStyle: 'italic', marginTop: 4 }}>📝 {ex.plannedNote}</Note>
      ) : null}

      <Pressable onPress={() => setHistoryOpen(true)} style={{ marginTop: 8, marginBottom: 4 }}>
        <Note color={theme.colors.info}>
          📊 {isStrength ? 'Últimos pesos' : 'Últimos registos'}
        </Note>
      </Pressable>

      {/* Séries já registadas */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {ex.sets.map((s, si) => (
          <Pressable
            key={si}
            onLongPress={() => onRemoveSet(si)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.colors.bgSoft,
              borderRadius: 999,
              paddingVertical: 5,
              paddingHorizontal: 12,
            }}
          >
            <Note color={theme.colors.ink}>{s}</Note>
            <Text style={{ color: theme.colors.muted, fontSize: 12 }}>✕</Text>
          </Pressable>
        ))}
      </View>
      {ex.sets.length ? (
        <Note style={{ marginTop: 4 }}>Mantém premida uma série para a remover.</Note>
      ) : null}

      {/* Formulário de nova série */}
      <View style={{ marginTop: 12 }}>
        {isStrength ? (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="Reps"
                style={{ flex: 1 }}
              />
              <Input
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="Peso"
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ marginTop: 8 }}>
              <SegmentedControl
                value={unit}
                onChange={setUnit}
                options={WEIGHT_UNITS.map((u) => ({ value: u, label: u }))}
              />
            </View>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                placeholder="Minutos"
                style={{ flex: 1 }}
              />
              <Input
                value={seconds}
                onChangeText={setSeconds}
                keyboardType="number-pad"
                placeholder="Segundos"
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Input
                value={distance}
                onChangeText={setDistance}
                keyboardType="decimal-pad"
                placeholder="Distância (opc.)"
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ marginTop: 8 }}>
              <SegmentedControl
                value={distanceUnit}
                onChange={setDistanceUnit}
                options={DISTANCE_UNITS.map((u) => ({ value: u, label: u }))}
              />
            </View>
          </>
        )}

        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Notas (RIR, microload…) — opcional"
          style={{ marginTop: 8 }}
        />

        <Pressable
          onPress={() => setWarmup((w) => !w)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              borderWidth: 1.5,
              borderColor: warmup ? theme.colors.gold : theme.colors.border,
              backgroundColor: warmup ? theme.colors.gold : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {warmup ? <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text> : null}
          </View>
          <Note>Série de aquecimento (não conta para o PR)</Note>
        </Pressable>

        <Button
          title="+ Adicionar série"
          variant={isStrength ? 'strength' : 'cardio'}
          onPress={submit}
          style={{ marginTop: 10 }}
        />
      </View>

      <ExerciseHistoryModal
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exercise={ex}
        loggedWorkouts={data?.loggedWorkouts || []}
        manualPRs={data?.exercisePRs || {}}
      />
    </Card>
  );
}

/** Últimos registos deste exercício + PR atual (se for de força). */
function ExerciseHistoryModal({ visible, onClose, exercise: ex, loggedWorkouts, manualPRs }) {
  const theme = useTheme();
  const isStrength = ex.type === 'strength';

  const sessions = loggedWorkouts
    .filter((lw) => lw.exercises.some((e) => e.type === ex.type && e.name === ex.name))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((lw) => {
      const match = lw.exercises.find((e) => e.type === ex.type && e.name === ex.name);
      return { date: lw.date, sets: match.sets };
    });

  const pr = isStrength ? getEffectivePR(loggedWorkouts, manualPRs, 'strength', ex.name) : null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius,
            padding: theme.spacing.lg,
            maxHeight: '80%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontFamily: theme.font.display,
                fontSize: 16,
                color: theme.colors.ink,
                textTransform: 'uppercase',
                flex: 1,
              }}
            >
              {ex.name}
            </Text>
            <Pressable onPress={onClose}>
              <Text style={{ fontSize: 18, color: theme.colors.muted }}>✕</Text>
            </Pressable>
          </View>

          {pr ? (
            <View
              style={{
                backgroundColor: theme.colors.bgSoft,
                borderRadius: theme.radiusSm,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <Note>PR (Recorde Pessoal)</Note>
              <Text
                style={{
                  fontFamily: theme.font.display,
                  fontSize: 22,
                  color: theme.colors.gold,
                }}
              >
                {pr.weight} {pr.unit}
                {pr.reps ? ` @ ${pr.reps} reps` : ''}
              </Text>
            </View>
          ) : null}

          {sessions.length === 0 ? (
            <Note>Ainda sem registos anteriores deste exercício.</Note>
          ) : (
            sessions.map((s, i) => (
              <View
                key={s.date + i}
                style={{
                  paddingVertical: 8,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: theme.colors.bgSoft,
                }}
              >
                <Body style={{ fontFamily: theme.font.bodyBold }}>
                  {new Date(`${s.date}T00:00:00`).toLocaleDateString('pt-PT')}
                </Body>
                <Note>{s.sets.join(', ')}</Note>
              </View>
            ))
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Adiciona um exercício fora do plano, a meio da sessão. */
function ExtraExerciseAdder({ onAdd }) {
  const [type, setType] = useState('strength');
  const [name, setName] = useState('');

  return (
    <Card>
      <CardTitle>Exercício extra</CardTitle>
      <SegmentedControl
        value={type}
        onChange={setType}
        options={[
          { value: 'strength', label: 'Força' },
          { value: 'cardio', label: 'Cardio' },
        ]}
      />
      <Input
        value={name}
        onChangeText={setName}
        placeholder="Nome do exercício"
        style={{ marginTop: 10 }}
      />
      <Button
        title="+ Adicionar à sessão"
        variant="ghost"
        style={{ marginTop: 10 }}
        onPress={() => {
          if (!name.trim()) return;
          onAdd(type, name.trim());
          setName('');
        }}
      />
    </Card>
  );
}
