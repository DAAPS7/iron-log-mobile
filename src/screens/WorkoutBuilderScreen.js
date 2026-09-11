import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

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
import { uid } from '../lib/defaults';
import { STRENGTH_EXERCISES } from '../lib/exercises';
import { DISTANCE_UNITS } from '../lib/sets';
import {
  recommendWarmupSets,
  estimateWorkoutTime,
  formatDuration,
  getGeneralTimeTips,
  getWorkoutSpecificTips,
} from '../lib/timeManagement';

/** Cria um exercício novo com valores por omissão sensatos. */
function blankExercise(type) {
  if (type === 'strength') {
    const first = STRENGTH_EXERCISES[0];
    return {
      type: 'strength',
      name: first.name,
      muscle: first.muscle,
      isCustom: false,
      sets: 3,
      minReps: 8,
      maxReps: 12,
      warmupSets: null,
      notes: '',
    };
  }
  return {
    type: 'cardio',
    name: '',
    sets: 1,
    duration: 20,
    distance: null,
    distanceUnit: 'km',
    warmupSets: null,
    notes: '',
  };
}

export default function WorkoutBuilderScreen({ route, navigation }) {
  const theme = useTheme();
  const { data, updateData } = useStore();
  const editingId = route.params?.workoutId || null;
  const existing = editingId
    ? data.workouts.find((w) => w.id === editingId)
    : null;

  const [name, setName] = useState(existing?.name || '');
  const [exercises, setExercises] = useState(
    existing ? existing.exercises.map((e) => ({ ...e })) : [],
  );
  const [error, setError] = useState(null);

  function patch(index, changes) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...changes } : ex)),
    );
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function save() {
    if (!name.trim()) return setError('Dá um nome ao treino.');
    if (!exercises.length) return setError('Adiciona pelo menos um exercício.');
    if (exercises.some((ex) => !ex.name.trim()))
      return setError('Todos os exercícios precisam de nome.');

    // Os campos numéricos podem ter ficado como texto solto durante a
    // edição (para não forçar um mínimo a cada tecla) — só aqui, no fim,
    // é que se convertem e se garante um mínimo de 1.
    const cleanExercises = exercises.map((ex) => {
      const clean = { ...ex };
      clean.sets = Math.max(1, num(ex.sets) || 1);
      if (ex.type === 'strength') {
        clean.minReps = Math.max(1, num(ex.minReps) || 1);
        clean.maxReps = Math.max(1, num(ex.maxReps) || 1);
      } else {
        // Duração é opcional — às vezes não sabes de antemão quanto tempo
        // vais correr/pedalar. Fica null se deixares em branco; a
        // estimativa de tempo assume um valor de referência nesse caso.
        const d = num(ex.duration);
        clean.duration = d && d > 0 ? d : null;
      }
      return clean;
    });

    const workout = { id: editingId || uid(), name: name.trim(), exercises: cleanExercises };
    updateData((prev) => ({
      ...prev,
      workouts: editingId
        ? prev.workouts.map((w) => (w.id === editingId ? workout : w))
        : [...prev.workouts, workout],
    }));
    navigation.goBack();
  }

  const num = (v) => {
    const n = parseInt(String(v), 10);
    return isNaN(n) ? null : n;
  };

  return (
    <Screen>
      <Field label="Nome do treino">
        <Input value={name} onChangeText={setName} placeholder="Ex: Peito & Tricep" />
      </Field>

      {exercises.map((ex, i) => (
        <Card key={i}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Note>{ex.type === 'strength' ? 'Força' : 'Cardio'}</Note>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <IconAction label="↑" onPress={() => move(i, -1)} disabled={i === 0} />
              <IconAction
                label="↓"
                onPress={() => move(i, 1)}
                disabled={i === exercises.length - 1}
              />
              <IconAction
                label="✕"
                onPress={() =>
                  setExercises((prev) => prev.filter((_, idx) => idx !== i))
                }
              />
            </View>
          </View>

          {ex.type === 'strength' ? (
            <>
              <Field label="Exercício">
                <ExercisePicker
                  value={ex.isCustom ? '__custom__' : ex.name}
                  onChange={(val) => {
                    if (val === '__custom__') {
                      patch(i, { isCustom: true, name: '', muscle: null });
                    } else {
                      const found = STRENGTH_EXERCISES.find((s) => s.name === val);
                      patch(i, {
                        isCustom: false,
                        name: found.name,
                        muscle: found.muscle,
                      });
                    }
                  }}
                />
              </Field>
              {ex.isCustom ? (
                <Field label="Nome do exercício">
                  <Input
                    value={ex.name}
                    onChangeText={(v) => patch(i, { name: v })}
                    placeholder="Ex: Machine Row unilateral"
                  />
                </Field>
              ) : null}

              <Row>
                <Field label="Séries" flex>
                  <Input
                    value={String(ex.sets)}
                    onChangeText={(v) => patch(i, { sets: v })}
                    keyboardType="number-pad"
                  />
                </Field>
                <Field label="Reps mín" flex>
                  <Input
                    value={String(ex.minReps)}
                    onChangeText={(v) => patch(i, { minReps: v })}
                    keyboardType="number-pad"
                  />
                </Field>
                <Field label="Reps máx" flex>
                  <Input
                    value={String(ex.maxReps)}
                    onChangeText={(v) => patch(i, { maxReps: v })}
                    keyboardType="number-pad"
                  />
                </Field>
              </Row>
            </>
          ) : (
            <>
              <Field label="Nome">
                <Input
                  value={ex.name}
                  onChangeText={(v) => patch(i, { name: v })}
                  placeholder="Ex: Corrida"
                />
              </Field>
              <Row>
                <Field label="Séries" flex>
                  <Input
                    value={String(ex.sets)}
                    onChangeText={(v) => patch(i, { sets: v })}
                    keyboardType="number-pad"
                  />
                </Field>
                <Field label="Duração (min)" flex>
                  <Input
                    value={ex.duration == null ? '' : String(ex.duration)}
                    onChangeText={(v) => patch(i, { duration: v })}
                    keyboardType="number-pad"
                  />
                </Field>
              </Row>
              <Row>
                <Field label="Distância (opc.)" flex>
                  <Input
                    value={ex.distance != null ? String(ex.distance) : ''}
                    onChangeText={(v) => {
                      const n = parseFloat(String(v).replace(',', '.'));
                      patch(i, { distance: isNaN(n) ? null : n });
                    }}
                    keyboardType="decimal-pad"
                  />
                </Field>
                <Field label="Unidade" flex>
                  <SegmentedControl
                    value={ex.distanceUnit || 'km'}
                    onChange={(v) => patch(i, { distanceUnit: v })}
                    options={DISTANCE_UNITS.map((u) => ({ value: u, label: u }))}
                  />
                </Field>
              </Row>
            </>
          )}

          <Field label="Séries de aquecimento (opcional)">
            <Input
              value={ex.warmupSets != null ? String(ex.warmupSets) : ''}
              onChangeText={(v) => {
                const n = num(v);
                patch(i, { warmupSets: n && n > 0 ? n : null });
              }}
              keyboardType="number-pad"
              placeholder="ex: 2"
            />
          </Field>

          <Field label="Notas (opcional)">
            <Input
              value={ex.notes || ''}
              onChangeText={(v) => patch(i, { notes: v })}
              placeholder="ex: técnica controlada"
            />
          </Field>
        </Card>
      ))}

      <TimeManagementCard exercises={exercises} />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md }}>
        <Button
          title="+ Força"
          variant="ghost"
          style={{ flex: 1 }}
          onPress={() => setExercises((p) => [...p, blankExercise('strength')])}
        />
        <Button
          title="+ Cardio"
          variant="ghost"
          style={{ flex: 1 }}
          onPress={() => setExercises((p) => [...p, blankExercise('cardio')])}
        />
      </View>

      {error ? <Body color={theme.colors.danger}>{error}</Body> : null}

      <Button
        title={editingId ? 'Guardar alterações' : 'Guardar treino'}
        variant="strength"
        onPress={save}
      />
    </Screen>
  );
}

function Row({ children }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function IconAction({ label, onPress, disabled }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text
        style={{
          fontSize: 16,
          color: disabled ? theme.colors.border : theme.colors.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Seletor de exercício. Em vez de um dropdown nativo (que difere muito entre
 * plataformas), mostra uma lista rolável de opções — mais previsível e mais
 * fácil de estender quando a biblioteca crescer.
 */
function ExercisePicker({ value, onChange }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const label =
    value === '__custom__'
      ? 'Personalizado…'
      : value || 'Escolher exercício';

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          borderRadius: theme.radiusSm,
          padding: 12,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Body>{label} ▾</Body>
      </Pressable>

      {open ? (
        <View
          style={{
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderRadius: theme.radiusSm,
            marginTop: 6,
            maxHeight: 240,
            overflow: 'hidden',
            backgroundColor: theme.colors.surface,
          }}
        >
          <Screen scroll contentStyle={{ padding: 0 }}>
            <Pressable
              onPress={() => {
                onChange('__custom__');
                setOpen(false);
              }}
              style={{ padding: 12 }}
            >
              <Body>+ Personalizado…</Body>
            </Pressable>
            {STRENGTH_EXERCISES.map((s) => (
              <Pressable
                key={s.name}
                onPress={() => {
                  onChange(s.name);
                  setOpen(false);
                }}
                style={{
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.bgSoft,
                }}
              >
                <Body>{s.name}</Body>
                <Note>{s.muscle}</Note>
              </Pressable>
            ))}
          </Screen>
        </View>
      ) : null}
    </View>
  );
}

/** Estimativa de duração + recomendação de aquecimento + dicas para o treino a ser montado. */
function TimeManagementCard({ exercises }) {
  const theme = useTheme();
  const [tipsOpen, setTipsOpen] = useState(false);

  const workout = useMemo(() => ({ exercises }), [exercises]);
  const { totalSeconds, breakdown, overheadSeconds } = useMemo(() => estimateWorkoutTime(workout), [workout]);
  const specificTips = useMemo(() => getWorkoutSpecificTips(workout), [workout]);
  const generalTips = useMemo(() => getGeneralTimeTips(), []);

  if (!exercises.length) return null;

  return (
    <Card accent={theme.colors.gold}>
      <CardTitle>⏱️ Gestão de Tempo</CardTitle>
      <Body style={{ fontFamily: theme.font.display, fontSize: 22, color: theme.colors.gold, marginBottom: 8 }}>
        ≈ {formatDuration(totalSeconds)}
      </Body>
      <Note style={{ marginBottom: 10 }}>
        Assume 2-3min de descanso entre séries de trabalho, aquecimento mais
        curto, uma margem para trocar de exercício, e tempo extra para casa
        de banho/água/deslocações no ginásio. Os exercícios sem aquecimento
        definido manualmente usam a recomendação abaixo.
      </Note>

      {breakdown.map((b, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: 6,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: theme.colors.bgSoft,
          }}
        >
          <Note>
            {b.name}
            {b.warmupSets ? ` (+${b.warmupSets} aquecimento sugerido)` : ''}
          </Note>
          <Note>{formatDuration(b.seconds)}</Note>
        </View>
      ))}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 6,
          borderTopWidth: 1,
          borderTopColor: theme.colors.bgSoft,
        }}
      >
        <Note>🚻 Casa de banho, água, deslocações</Note>
        <Note>{formatDuration(overheadSeconds)}</Note>
      </View>

      {specificTips.length || generalTips.length ? (
        <Pressable
          onPress={() => setTipsOpen((o) => !o)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}
        >
          <Note color={theme.colors.ink}>💡 Dicas para poupar tempo</Note>
          <Text style={{ color: theme.colors.muted }}>{tipsOpen ? '▴' : '▾'}</Text>
        </Pressable>
      ) : null}

      {tipsOpen ? (
        <View style={{ marginTop: 8 }}>
          {specificTips.map((t, i) => (
            <Note key={`s${i}`} style={{ marginBottom: 6 }} color={theme.colors.info}>
              • {t}
            </Note>
          ))}
          {generalTips.map((t, i) => (
            <Note key={`g${i}`} style={{ marginBottom: 6 }}>
              • {t}
            </Note>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
