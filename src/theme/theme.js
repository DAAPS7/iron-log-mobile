/**
 * Tema central da app.
 *
 * Equivalente às variáveis CSS da versão web. Todos os ecrãs consomem estas
 * cores através do useTheme() — não deve haver cores escritas à mão nos
 * componentes, para o modo escuro funcionar em todo o lado.
 */

const shared = {
  radius: 14,
  radiusSm: 8,
  spacing: { xs: 4, sm: 8, md: 14, lg: 18, xl: 24 },
  font: {
    display: 'Unbounded_700Bold',
    body: 'PlusJakartaSans_500Medium',
    bodyBold: 'PlusJakartaSans_700Bold',
    mono: 'JetBrainsMono_400Regular',
  },
};

export const lightColors = {
  bg: '#EEF1EC',
  bgSoft: '#E4E9E2',
  surface: '#FFFFFF',
  border: '#D7DED4',
  ink: '#1B211D',
  muted: '#5C665F',
  strength: '#E3572D',
  cardio: '#1D7874',
  gold: '#C98A1F',
  info: '#6D5BD0',
  good: '#2E9E4F',
  danger: '#C23B3B',
};

export const darkColors = {
  bg: '#14171B',
  bgSoft: '#1D2126',
  surface: '#1A1E22',
  border: '#2B3035',
  ink: '#EDEFEF',
  muted: '#8B939C',
  strength: '#FF7A4D',
  cardio: '#3FBAB3',
  gold: '#E8B84B',
  info: '#A596F5',
  good: '#4ADE80',
  danger: '#E36A6A',
};

export function buildTheme(mode) {
  return {
    ...shared,
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
  };
}

/* ---------- Helpers de cor ---------- */

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Mistura duas cores hex (t entre 0 e 1). */
export function interpolateColor(colorA, colorB, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseHex(colorA);
  const b = parseHex(colorB);
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Versão translúcida de uma cor hex. */
export function withAlpha(hex, alpha) {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Cor da gordura corporal numa escala contínua verde → vermelho.
 * Os limites seguem os patamares usados em classifyBodyFat.
 */
export function bodyFatColor(bf, gender, colors) {
  if (bf == null) return colors.muted;
  const low = gender ? 7 : 13;
  const high = gender ? 28 : 35;
  return interpolateColor(colors.good, colors.danger, (bf - low) / (high - low));
}
