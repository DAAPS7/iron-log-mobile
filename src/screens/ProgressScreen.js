import React, { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import LineChart from '../components/LineChart';
import WeightChart from '../components/WeightChart';
import {
  Body,
  Card,
  CardTitle,
  EmptyState,
  Note,
  Screen,
  ScreenTitle,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
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
    return { points, higherIsBetter: false, unitNote: 'Eixo vertical: peso corporal (kg).' };
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
  const { data } = useStore();
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

  const chartWidth = width - theme.spacing.md * 2 - theme.spacing.lg * 2;
  const visible = showAll ? series.points : series.points.slice(-3);

  return (
    <Screen>
      <ScreenTitle subtitle="Evolução do peso corporal e dos teus exercícios.">
        Progresso
      </ScreenTitle>

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
