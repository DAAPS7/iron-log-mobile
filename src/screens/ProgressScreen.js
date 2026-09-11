import React, { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import LineChart from '../components/LineChart';
import WeightChart from '../components/WeightChart';
import BodyMuscleMap from '../components/BodyMuscleMap';
import {
  Body,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Field,
  Input,
  MAX_CONTENT_WIDTH,
  Note,
  Screen,
  ScreenTitle,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { uid, markDeleted } from '../lib/defaults';
import { evaluateAllGoals } from '../lib/goals';
import { computeMuscleRegionProgress } from '../lib/muscleProgress';
import { confirmAsync } from '../lib/confirm';
import {
  computeBestFromSessions,
  getEffectivePR,
  isWarmupSet,
  parseCardioSet,
  parseStrengthSet,
} from '../lib/sets';

const WEIGHT_KEY = '__weight__';

/** Todas as métricas disponíveis: peso corporal + cada exercício registado. */
function buildMetricOptions(data) {
  const options = [];
  if (data.weightHistory.length) {
    options.push({ key: WEIGHT_KEY, label: 'Peso Corporal' });
  }
  const seen = new Map();
  data.loggedWorkouts.forEach((lw) =>
    lw.exercises.forEach((ex) => {
      const key = `${ex.type}::${ex.name}`;
      if (!seen.has(key)) seen.set(key, { key, label: `${ex.name} (${ex.type === 'strength' ? 'Força' : 'Cardio'})` });
    }),
  );
  return [...options, ...[...seen.values()].sort((a, b) => a.label.localeCompare(b.label))];
}

/**
 * Série de pontos para a métrica escolhida.
 * Para cardio com distância registada usamos o ritmo (min por unidade),
 * onde valores mais baixos são melhores.
 */
function buildSeries(data, key) {
  if (key === WEIGHT_KEY) {
    const points = [...data.weightHistory]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((w) => ({ date: w.date, value: w.weight, detail: `${w.weight} kg` }));

    // Sem objetivo definido, assume-se o caso mais comum (perder/manter).
    // Com objetivo definido, usa-se a direção real: se a meta é mais alta
    // que o peso atual, subir é que é a melhoria.
    const weightGoal = data.metricGoals?.weight;
    let higherIsBetter = false;
    if (weightGoal?.target != null && points.length) {
      const currentWeight = points[points.length - 1].value;
      higherIsBetter = weightGoal.target > currentWeight;
    }

    return { points, higherIsBetter, unitNote: 'Eixo vertical: peso corporal (kg).' };
  }

  const [type, name] = key.split('::');
  const sessions = [...data.loggedWorkouts].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const paceMode =
    type === 'cardio' &&
    sessions.some((lw) =>
      lw.exercises.some(
        (ex) =>
          ex.type === type &&
          ex.name === name &&
          ex.sets.some((s) => !isWarmupSet(s) && parseCardioSet(s)?.distance),
      ),
    );

  const points = [];
  sessions.forEach((lw) => {
    lw.exercises.forEach((ex) => {
      if (ex.type !== type || ex.name !== name) return;
      const working = ex.sets.filter((s) => !isWarmupSet(s));
      if (!working.length) return;

      if (type === 'strength') {
        let best = null;
        working.forEach((s) => {
          const p = parseStrengthSet(s);
          if (p && (!best || p.weight > best.weight)) best = p;
        });
        if (best) {
          points.push({
            date: lw.date,
            value: best.weight,
            detail: `Melhor série: ${best.reps} reps @ ${best.weight}${best.unit}`,
          });
        }
      } else if (paceMode) {
        let bestPace = null;
        let unit = 'km';
        working.forEach((s) => {
          const p = parseCardioSet(s);
          if (p && p.distance > 0) {
            const pace = p.totalMinutes / p.distance;
            if (bestPace == null || pace < bestPace) {
              bestPace = Math.round(pace * 100) / 100;
              unit = p.unit || unit;
            }
          }
        });
        if (bestPace != null) {
          points.push({
            date: lw.date,
            value: bestPace,
            detail: `Melhor ritmo: ${bestPace} min/${unit}`,
          });
        }
      } else {
        let best = 0;
        working.forEach((s) => {
          const p = parseCardioSet(s);
          if (p && p.totalMinutes > best) best = p.totalMinutes;
        });
        if (best > 0) {
          points.push({
            date: lw.date,
            value: Math.round(best * 100) / 100,
            detail: `Melhor série: ${best.toFixed(1)} min`,
          });
        }
      }
    });
  });

  return {
    points,
    higherIsBetter: type === 'strength' ? true : !paceMode,
    unitNote:
      type === 'strength'
        ? 'Eixo vertical: peso da melhor série (ignora aquecimentos).'
        : paceMode
          ? 'Eixo vertical: ritmo — valores mais baixos são melhores.'
          : 'Eixo vertical: duração da série (min).',
  };
}

export default function ProgressScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { data, updateData } = useStore();
  const [selected, setSelected] = useState(WEIGHT_KEY);
  const [showAll, setShowAll] = useState(false);

  const options = useMemo(() => (data ? buildMetricOptions(data) : []), [data]);
  const activeKey = options.some((o) => o.key === selected)
    ? selected
    : options[0]?.key;
  const series = useMemo(
    () => (data && activeKey ? buildSeries(data, activeKey) : null),
    [data, activeKey],
  );
  const muscleProgress = useMemo(
    () => (data ? computeMuscleRegionProgress(data) : null),
    [data],
  );

  if (!data) return null;
  if (!options.length) {
    return (
      <Screen>
        <ScreenTitle>Progresso</ScreenTitle>
        <EmptyState
          title="Ainda sem dados"
          message="Regista o teu peso ou conclui treinos para veres a tua evolução."
        />
      </Screen>
    );
  }

  const pr =
    activeKey && activeKey !== WEIGHT_KEY && activeKey.startsWith('strength::')
      ? getEffectivePR(
          data.loggedWorkouts,
          data.exercisePRs,
          'strength',
          activeKey.split('::')[1],
        )
      : null;

  const effectiveWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const chartWidth = effectiveWidth - theme.spacing.md * 2 - theme.spacing.lg * 2;
  const visible = showAll ? series.points : series.points.slice(-3);

  return (
    <Screen>
      <ScreenTitle subtitle="Evolução do peso corporal e dos teus exercícios.">
        Progresso
      </ScreenTitle>

      <Card>
        <CardTitle>Volume Muscular da Semana</CardTitle>
        <Note style={{ marginBottom: 10 }}>
          Cada zona fica mais intensa conforme completas as séries planeadas
          para ela esta semana. Reinicia sozinho todas as segundas-feiras.
        </Note>
        <BodyMuscleMap progress={muscleProgress} />
      </Card>

      <Card>
        <CardTitle>Métrica</CardTitle>
        <MetricDropdown
          options={options}
          value={activeKey}
          onChange={(key) => {
            setSelected(key);
            setShowAll(false);
          }}
        />
      </Card>

      <Card>
        {activeKey === WEIGHT_KEY ? (
          <WeightChart points={series.points} width={chartWidth} />
        ) : (
          <LineChart
            points={series.points}
            width={chartWidth}
            color={theme.colors.strength}
          />
        )}
        <Note style={{ marginTop: 6 }}>{series.unitNote}</Note>
      </Card>

      {pr ? (
        <Card accent={theme.colors.gold}>
          <CardTitle>PR (Recorde Pessoal)</CardTitle>
          <Body style={{ fontFamily: theme.font.display, fontSize: 24, color: theme.colors.gold }}>
            {pr.weight} {pr.unit}
            {pr.reps ? ` @ ${pr.reps} reps` : ''}
          </Body>
          <Note style={{ marginTop: 6 }}>
            Calculado a partir do histórico — sobe quando bates um recorde e
            acompanha automaticamente se apagares registos.
          </Note>
        </Card>
      ) : null}

      {activeKey && activeKey.startsWith('strength::') ? (
        <ExerciseGoalCard
          exerciseName={activeKey.split('::')[1]}
          goals={data.exerciseGoals || []}
          loggedWorkouts={data.loggedWorkouts}
          onAdd={(goal) =>
            updateData((prev) => ({
              ...prev,
              exerciseGoals: [...(prev.exerciseGoals || []), goal],
            }))
          }
          onRemove={(id) =>
            updateData((prev) => ({
              ...prev,
              exerciseGoals: (prev.exerciseGoals || []).filter((g) => g.id !== id),
              deletedIds: markDeleted(prev, 'exerciseGoals', id),
            }))
          }
        />
      ) : null}

      <Card>
        <CardTitle>Registos</CardTitle>
        {[...visible].reverse().map((p, i, arr) => {
          // A diferença compara com o registo imediatamente anterior no tempo.
          const idxInSeries = series.points.findIndex((x) => x.date === p.date && x.value === p.value);
          const prev = idxInSeries > 0 ? series.points[idxInSeries - 1] : null;
          const diff = prev ? Math.round((p.value - prev.value) * 100) / 100 : null;
          let diffColor = theme.colors.muted;
          if (diff) {
            const improved = series.higherIsBetter ? diff > 0 : diff < 0;
            diffColor = improved ? theme.colors.good : theme.colors.danger;
          }
          return (
            <View
              key={`${p.date}-${i}`}
              style={{
                paddingVertical: 9,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.colors.bgSoft,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontFamily: theme.font.bodyBold }}>
                    {new Date(`${p.date}T00:00:00`).toLocaleDateString('pt-PT')}
                  </Body>
                  <Note>{p.detail}</Note>
                  {diff ? (
                    <Note color={diffColor}>
                      {diff > 0 ? '+' : ''}
                      {diff} desde o registo anterior
                    </Note>
                  ) : null}
                </View>
                {activeKey === WEIGHT_KEY ? (
                  <Pressable
                    onPress={async () => {
                      const ok = await confirmAsync(
                        'Apagar registo',
                        `Queres mesmo apagar o registo de peso de ${new Date(`${p.date}T00:00:00`).toLocaleDateString('pt-PT')}?`,
                        'Apagar',
                      );
                      if (!ok) return;
                      updateData((prev) => ({
                        ...prev,
                        weightHistory: prev.weightHistory.filter((w) => w.date !== p.date),
                        deletedIds: markDeleted(prev, 'weightHistory', p.date),
                      }));
                    }}
                  >
                    <Text style={{ color: theme.colors.danger, fontSize: 16 }}>✕</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}

        {series.points.length > 3 ? (
          <Pressable onPress={() => setShowAll((s) => !s)} style={{ marginTop: 10 }}>
            <Note color={theme.colors.ink}>
              {showAll
                ? '▴ Mostrar menos'
                : `▾ Ver todos os registos (${series.points.length})`}
            </Note>
          </Pressable>
        ) : null}
      </Card>
    </Screen>
  );
}

/** Dropdown de seleção de métrica — evita listar dezenas de exercícios de uma vez. */
function MetricDropdown({ options, value, onChange }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          borderRadius: theme.radiusSm,
          padding: 12,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Body>{current?.label || 'Escolher métrica'}</Body>
        <Text style={{ color: theme.colors.muted }}>{open ? '▴' : '▾'}</Text>
      </Pressable>

      {open ? (
        <View
          style={{
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderRadius: theme.radiusSm,
            marginTop: 6,
            maxHeight: 280,
            overflow: 'hidden',
            backgroundColor: theme.colors.surface,
          }}
        >
          <Screen scroll contentStyle={{ padding: 0 }}>
            {options.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                style={{
                  padding: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.bgSoft,
                  backgroundColor:
                    opt.key === value ? theme.colors.bgSoft : 'transparent',
                }}
              >
                <Body>{opt.label}</Body>
              </Pressable>
            ))}
          </Screen>
        </View>
      ) : null}
    </View>
  );
}

/** Objetivos de peso definidos para o exercício atual, com estado calculado. */
function ExerciseGoalCard({ exerciseName, goals, loggedWorkouts, onAdd, onRemove }) {
  const theme = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const forThisExercise = useMemo(
    () => evaluateAllGoals(goals.filter((g) => g.exerciseName === exerciseName), loggedWorkouts),
    [goals, exerciseName, loggedWorkouts],
  );

  const STATUS_LABEL = {
    achieved: { label: 'Cumprido', color: theme.colors.good },
    missed: { label: 'Prazo passado', color: theme.colors.danger },
    pending: { label: 'Em curso', color: theme.colors.info },
  };

  return (
    <Card accent={theme.colors.info}>
      <CardTitle
        right={
          <Button
            title={showForm ? 'Cancelar' : '+ Novo objetivo'}
            variant="ghost"
            onPress={() => setShowForm((s) => !s)}
            style={{ paddingVertical: 6, paddingHorizontal: 12 }}
          />
        }
      >
        Objetivo para {exerciseName}
      </CardTitle>

      {showForm ? (
        <View style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field label="Peso alvo (kg)" flex>
              <Input value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad" />
            </Field>
            <Field label="Data alvo (AAAA-MM-DD)" flex>
              <Input value={targetDate} onChangeText={setTargetDate} placeholder="2026-12-01" />
            </Field>
          </View>
          <Button
            title="Guardar objetivo"
            variant="strength"
            onPress={() => {
              const w = parseFloat(String(targetWeight).replace(',', '.'));
              if (isNaN(w) || w <= 0) return;
              onAdd({
                id: uid(),
                exerciseName,
                targetWeight: w,
                targetDate: targetDate || null,
                createdAt: new Date().toISOString(),
              });
              setTargetWeight('');
              setTargetDate('');
              setShowForm(false);
            }}
          />
        </View>
      ) : null}

      {!forThisExercise.length ? (
        <Note>Ainda sem objetivos definidos para este exercício.</Note>
      ) : (
        forThisExercise.map((g) => {
          const st = STATUS_LABEL[g.status];
          return (
            <View
              key={g.id}
              style={{
                paddingVertical: 9,
                borderTopWidth: 1,
                borderTopColor: theme.colors.bgSoft,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Body style={{ fontFamily: theme.font.bodyBold }}>{g.targetWeight} kg</Body>
                <Note color={st.color}>{st.label}</Note>
              </View>
              <Note>
                {g.targetDate ? `Prazo: ${g.targetDate}` : 'Sem prazo definido'}
                {g.achievedDate ? ` · Atingido a ${g.achievedDate}` : ''}
              </Note>
              <Pressable onPress={() => onRemove(g.id)}>
                <Note color={theme.colors.danger}>Remover</Note>
              </Pressable>
            </View>
          );
        })
      )}
    </Card>
  );
}
