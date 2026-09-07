/**
 * Gráfico de peso corporal: linha diária fina + média semanal em destaque.
 * Equivalente ao drawWeightWeeklyChart() da versão web.
 */

import React from 'react';
import { Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';

const HEIGHT = 180;
const PAD = { left: 42, right: 12, top: 16, bottom: 24 };

function formatShortDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Segunda-feira da semana a que a data pertence. */
function getMonday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

/** Agrupa pontos diários em médias semanais (uma por semana, na segunda). */
function buildWeeklyAverages(dailyPoints) {
  const byWeek = new Map();
  dailyPoints.forEach((p) => {
    const monday = getMonday(p.date);
    if (!byWeek.has(monday)) byWeek.set(monday, []);
    byWeek.get(monday).push(p.value);
  });
  return [...byWeek.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([monday, values]) => ({
      date: monday,
      value: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10,
    }));
}

function smoothPath(points, xFor, yFor) {
  let d = `M ${xFor(0)} ${yFor(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    const px = xFor(i - 1);
    const py = yFor(points[i - 1].value);
    const x = xFor(i);
    const y = yFor(points[i].value);
    d += ` Q ${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`;
    if (i === points.length - 1) d += ` L ${x} ${y}`;
  }
  return d;
}

export default function WeightChart({ points, width }) {
  const theme = useTheme();

  if (!points || points.length < 2) {
    return (
      <View style={{ height: HEIGHT, justifyContent: 'center' }}>
        <Svg width={width} height={HEIGHT}>
          <SvgText x={PAD.left} y={HEIGHT / 2} fill={theme.colors.muted}
            fontFamily={theme.font.body} fontSize="12">
            Regista pelo menos 2 pesagens para veres o gráfico.
          </SvgText>
        </Svg>
      </View>
    );
  }

  const weekly = buildWeeklyAverages(points);
  const allValues = points.map((p) => p.value);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;

  // Ambas as séries partilham o mesmo eixo X, indexado pela data real (não
  // pelo índice do array), para a média semanal ficar bem posicionada mesmo
  // com semanas sem pesagens todos os dias.
  const t0 = new Date(points[0].date).getTime();
  const t1 = new Date(points[points.length - 1].date).getTime();
  const span = t1 - t0 || 1;
  const xForDate = (dateStr) => PAD.left + ((new Date(dateStr).getTime() - t0) / span) * plotW;
  const yFor = (v) => PAD.top + plotH - ((v - min) / range) * plotH;

  const dailyXFor = (i) => xForDate(points[i].date);
  const weeklyXFor = (i) => xForDate(weekly[i].date);

  const dailyPath = smoothPath(points, dailyXFor, yFor);
  const weeklyPath =
    weekly.length >= 2 ? smoothPath(weekly, weeklyXFor, yFor) : null;
  const weeklyArea = weeklyPath
    ? `${weeklyPath} L ${weeklyXFor(weekly.length - 1)} ${PAD.top + plotH} L ${weeklyXFor(0)} ${PAD.top + plotH} Z`
    : null;

  return (
    <View>
      <Svg width={width} height={HEIGHT}>
        <Defs>
          <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.colors.cardio} stopOpacity="0.22" />
            <Stop offset="1" stopColor={theme.colors.cardio} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <Path
            key={f}
            d={`M ${PAD.left} ${PAD.top + plotH * f} L ${PAD.left + plotW} ${PAD.top + plotH * f}`}
            stroke={theme.colors.muted}
            strokeOpacity={0.12}
            strokeWidth={1}
          />
        ))}

        {/* Linha diária, fina e semi-transparente */}
        <Path
          d={dailyPath}
          stroke={theme.colors.strength}
          strokeOpacity={0.4}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={dailyXFor(i)} cy={yFor(p.value)} r={2} fill={theme.colors.strength} opacity={0.5} />
        ))}

        {/* Média semanal, grossa e em destaque, com preenchimento */}
        {weeklyArea ? <Path d={weeklyArea} fill="url(#weightFill)" /> : null}
        {weeklyPath ? (
          <Path
            d={weeklyPath}
            stroke={theme.colors.cardio}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        {weekly.map((p, i) => (
          <Circle key={i} cx={weeklyXFor(i)} cy={yFor(p.value)} r={4} fill={theme.colors.cardio} />
        ))}

        <SvgText x={PAD.left - 6} y={PAD.top + 8} fill={theme.colors.muted}
            fontFamily={theme.font.body} fontSize="10" textAnchor="end">
          {formatNumber(max)}
        </SvgText>
        <SvgText x={PAD.left - 6} y={PAD.top + plotH} fill={theme.colors.muted}
            fontFamily={theme.font.body} fontSize="10" textAnchor="end">
          {formatNumber(min)}
        </SvgText>
        <SvgText x={PAD.left} y={HEIGHT - 6} fill={theme.colors.muted}
            fontFamily={theme.font.body} fontSize="10">
          {formatShortDate(points[0].date)}
        </SvgText>
        <SvgText
          x={PAD.left + plotW}
          y={HEIGHT - 6}
          fill={theme.colors.muted}
            fontFamily={theme.font.body}
          fontSize="10"
          textAnchor="end"
        >
          {formatShortDate(points[points.length - 1].date)}
        </SvgText>
      </Svg>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
        <Legend color={theme.colors.strength} label="Diário" opacity={0.6} />
        <Legend color={theme.colors.cardio} label="Média semanal" />
      </View>
    </View>
  );
}

function Legend({ color, label, opacity = 1 }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: color, opacity }} />
      <Text style={{ color: theme.colors.muted, fontSize: 10, fontFamily: theme.font.body }}>
        {label}
      </Text>
    </View>
  );
}
