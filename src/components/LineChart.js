/**
 * Gráfico de linha simples em SVG.
 *
 * Substitui o <canvas> da versão web. Desenha uma linha suavizada com
 * preenchimento em gradiente, eixos com o valor mínimo/máximo e as datas
 * dos extremos — o suficiente para ler uma tendência num telemóvel.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';

const HEIGHT = 170;
const PAD = { left: 42, right: 12, top: 16, bottom: 24 };

function formatShortDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function LineChart({ points, width, color, fill = true }) {
  const theme = useTheme();
  const lineColor = color || theme.colors.strength;

  if (!points || points.length < 2) {
    return (
      <View style={{ height: HEIGHT, justifyContent: 'center' }}>
        <Svg width={width} height={HEIGHT}>
          <SvgText
            x={PAD.left}
            y={HEIGHT / 2}
            fill={theme.colors.muted}
            fontSize="12"
          >
            Regista pelo menos 2 valores para veres o gráfico.
          </SvgText>
        </Svg>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const stepX = plotW / (points.length - 1);

  const xFor = (i) => PAD.left + i * stepX;
  const yFor = (v) => PAD.top + plotH - ((v - min) / range) * plotH;

  // Curva suavizada: liga cada ponto ao seguinte por um quadrático que passa
  // pelo ponto médio, o que evita os "bicos" de uma polilinha simples.
  let d = `M ${xFor(0)} ${yFor(points[0].value)}`;
  for (let i = 1; i < points.length; i++) {
    const px = xFor(i - 1);
    const py = yFor(points[i - 1].value);
    const x = xFor(i);
    const y = yFor(points[i].value);
    d += ` Q ${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`;
    if (i === points.length - 1) d += ` L ${x} ${y}`;
  }

  const areaPath = `${d} L ${xFor(points.length - 1)} ${PAD.top + plotH} L ${xFor(0)} ${PAD.top + plotH} Z`;

  return (
    <Svg width={width} height={HEIGHT}>
      <Defs>
        <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Linhas de grelha */}
      {[0.25, 0.5, 0.75].map((f) => (
        <Path
          key={f}
          d={`M ${PAD.left} ${PAD.top + plotH * f} L ${PAD.left + plotW} ${PAD.top + plotH * f}`}
          stroke={theme.colors.muted}
          strokeOpacity={0.12}
          strokeWidth={1}
        />
      ))}

      {fill ? <Path d={areaPath} fill="url(#chartFill)" /> : null}

      <Path d={d} stroke={lineColor} strokeWidth={3} fill="none" strokeLinecap="round" />

      {points.map((p, i) => (
        <Circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={3} fill={lineColor} />
      ))}

      {/* Eixo Y: extremos */}
      <SvgText x={PAD.left - 6} y={PAD.top + 8} fill={theme.colors.muted} fontSize="10" textAnchor="end">
        {formatNumber(max)}
      </SvgText>
      <SvgText x={PAD.left - 6} y={PAD.top + plotH} fill={theme.colors.muted} fontSize="10" textAnchor="end">
        {formatNumber(min)}
      </SvgText>

      {/* Eixo X: primeira e última data */}
      <SvgText x={PAD.left} y={HEIGHT - 6} fill={theme.colors.muted} fontSize="10">
        {formatShortDate(points[0].date)}
      </SvgText>
      <SvgText
        x={PAD.left + plotW}
        y={HEIGHT - 6}
        fill={theme.colors.muted}
        fontSize="10"
        textAnchor="end"
      >
        {formatShortDate(points[points.length - 1].date)}
      </SvgText>
    </Svg>
  );
}
