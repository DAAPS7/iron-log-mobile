/**
 * Sistema de ícones do Iron Log.
 *
 * Todos os ícones vivem na mesma grelha de 24x24, com o mesmo traço e as
 * mesmas terminações arredondadas — é isso que os faz parecer da mesma
 * família. Substituem os emoji, que mudavam de aspeto entre plataformas e
 * nunca combinavam com a tipografia.
 *
 * Uso: <Icon name="dumbbell" size={22} color={theme.colors.accent} />
 */

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '../context/ThemeContext';

const STROKE = 1.8;

// Cada entrada recebe as props de traço já preparadas e devolve o desenho.
const PATHS = {
  profile: (p) => (
    <>
      <Circle cx="12" cy="8" r="4" {...p} />
      <Path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" {...p} />
    </>
  ),
  dumbbell: (p) => (
    <>
      <Path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" {...p} />
    </>
  ),
  nutrition: (p) => (
    <>
      <Path d="M6 3v8a2 2 0 002 2 2 2 0 002-2V3M8 3v10M8 13v8" {...p} />
      <Path d="M17 3c-1.5 1.5-2 3.5-2 6s.5 3 2 3 2-.5 2-3-.5-4.5-2-6z" {...p} />
      <Path d="M17 12v9" {...p} />
    </>
  ),
  progress: (p) => (
    <>
      <Path d="M3 20h18" {...p} />
      <Path d="M4 16l5-5 4 3 6.5-7" {...p} />
      <Path d="M15 7h4.5v4.5" {...p} />
    </>
  ),
  history: (p) => (
    <>
      <Rect x="4" y="4" width="16" height="17" rx="2.5" {...p} />
      <Path d="M8 3v3M16 3v3M8 11h8M8 15.5h5" {...p} />
    </>
  ),
  friends: (p) => (
    <>
      <Circle cx="9" cy="8" r="3.4" {...p} />
      <Path d="M2.8 19.5c0-3 2.8-5 6.2-5s6.2 2 6.2 5" {...p} />
      <Path d="M16.5 5.2a3.4 3.4 0 010 6.4M18 14.8c2.2.6 3.7 2.2 3.7 4.7" {...p} />
    </>
  ),
  settings: (p) => (
    <>
      <Circle cx="12" cy="12" r="3.2" {...p} />
      <Path d="M12 2.8v2.6M12 18.6v2.6M4.5 4.5l1.9 1.9M17.6 17.6l1.9 1.9M2.8 12h2.6M18.6 12h2.6M4.5 19.5l1.9-1.9M17.6 6.4l1.9-1.9" {...p} />
    </>
  ),
  plus: (p) => <Path d="M12 5v14M5 12h14" {...p} />,
  check: (p) => <Path d="M4.5 12.5l5 5 10-11" {...p} />,
  close: (p) => <Path d="M6 6l12 12M18 6L6 18" {...p} />,
  chevronRight: (p) => <Path d="M9 5l7 7-7 7" {...p} />,
  chevronDown: (p) => <Path d="M5 9l7 7 7-7" {...p} />,
  chevronUp: (p) => <Path d="M19 15l-7-7-7 7" {...p} />,
  chevronLeft: (p) => <Path d="M15 5l-7 7 7 7" {...p} />,
  clock: (p) => (
    <>
      <Circle cx="12" cy="12" r="8.6" {...p} />
      <Path d="M12 7v5.3l3.3 2" {...p} />
    </>
  ),
  flame: (p) => (
    <Path
      d="M12 22c3.9 0 6.5-2.6 6.5-6 0-4.2-3.6-6-4.7-9.8-.2-.7-1.1-.9-1.5-.3C10.7 8.2 9.6 9.7 9.6 11c0 1-.6 1.6-1.2 1.6-.8 0-1.4-.7-1.4-1.8C6 12 5.5 13.6 5.5 16c0 3.4 2.6 6 6.5 6z"
      {...p}
    />
  ),
  trophy: (p) => (
    <>
      <Path d="M7.5 4h9v5a4.5 4.5 0 01-9 0V4z" {...p} />
      <Path d="M7.5 5.5H5A2 2 0 005 9.5h2.5M16.5 5.5H19a2 2 0 010 4h-2.5" {...p} />
      <Path d="M12 13.5V17M9 20.5h6" {...p} />
    </>
  ),
  droplet: (p) => (
    <Path d="M12 3.5s5.5 5.6 5.5 9.4A5.5 5.5 0 0112 18.4a5.5 5.5 0 01-5.5-5.5C6.5 9.1 12 3.5 12 3.5z" {...p} />
  ),
  target: (p) => (
    <>
      <Circle cx="12" cy="12" r="8.5" {...p} />
      <Circle cx="12" cy="12" r="4.5" {...p} />
      <Circle cx="12" cy="12" r="1" {...p} />
    </>
  ),
  trash: (p) => (
    <>
      <Path d="M4.5 6.5h15M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7" {...p} />
      <Path d="M6.5 6.5l.9 12.2c.05.8.7 1.3 1.5 1.3h6.2c.8 0 1.45-.5 1.5-1.3l.9-12.2" {...p} />
      <Path d="M10.5 10.5v6M13.5 10.5v6" {...p} />
    </>
  ),
  edit: (p) => (
    <>
      <Path d="M4 20h4.2L19 9.2a2.1 2.1 0 00-3-3L5 17v3z" {...p} />
      <Path d="M14.5 6.8l2.7 2.7" {...p} />
    </>
  ),
  search: (p) => (
    <>
      <Circle cx="11" cy="11" r="6.6" {...p} />
      <Path d="M16 16l4.5 4.5" {...p} />
    </>
  ),
  calendar: (p) => (
    <>
      <Rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...p} />
      <Path d="M3.5 9.8h17M8.5 3v4M15.5 3v4" {...p} />
    </>
  ),
  book: (p) => (
    <>
      <Path d="M4.5 4.5h9.5a3 3 0 013 3v13H7.5a3 3 0 01-3-3v-13z" {...p} />
      <Path d="M17 7.5h2.5v13H8" {...p} />
    </>
  ),
  bed: (p) => (
    <>
      <Path d="M3 19v-9M3 14h18v5" {...p} />
      <Path d="M21 14v-2.5a2.5 2.5 0 00-2.5-2.5H10v5" {...p} />
      <Circle cx="6.6" cy="11.5" r="1.9" {...p} />
    </>
  ),
  spark: (p) => (
    <Path d="M12 3l2 6.2 6.2 2-6.2 2-2 6.2-2-6.2-6.2-2 6.2-2L12 3z" {...p} />
  ),
};

export const ICON_NAMES = Object.keys(PATHS);

export default function Icon({ name, size = 22, color, filled = false, strokeWidth }) {
  const theme = useTheme();
  const draw = PATHS[name];
  if (!draw) return null;

  const c = color || theme.colors.textPrimary;
  const strokeProps = {
    stroke: c,
    strokeWidth: strokeWidth ?? STROKE,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: filled ? c : 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {draw(strokeProps)}
    </Svg>
  );
}
