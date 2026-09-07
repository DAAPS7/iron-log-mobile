/**
 * Tema central da app.
 *
 * Equivalente às variáveis CSS da versão web. Todos os ecrãs consomem estas
 * cores/fontes através do useTheme() — não deve haver cores ou fontes
 * escritas à mão nos componentes, para o tema/modo escuro funcionarem em
 * todo o lado sem casos especiais.
 */

const base = {
  radius: 14,
  radiusSm: 8,
  spacing: { xs: 4, sm: 8, md: 14, lg: 18, xl: 24 },
};

/* ---------- Fontes ---------- */

export const FONT_OPTIONS = [
  {
    key: 'unbounded-jakarta',
    label: 'Unbounded / Plus Jakarta Sans',
    display: 'Unbounded_700Bold',
    body: 'PlusJakartaSans_500Medium',
    bodyBold: 'PlusJakartaSans_700Bold',
  },
  {
    key: 'anton-work',
    label: 'Anton / Work Sans',
    display: 'Anton_400Regular',
    body: 'WorkSans_500Medium',
    bodyBold: 'WorkSans_700Bold',
  },
  {
    key: 'bebas-inter',
    label: 'Bebas Neue / Inter',
    display: 'BebasNeue_400Regular',
    body: 'Inter_500Medium',
    bodyBold: 'Inter_700Bold',
  },
  {
    key: 'grotesk',
    label: 'Space Grotesk',
    display: 'SpaceGrotesk_700Bold',
    body: 'SpaceGrotesk_500Medium',
    bodyBold: 'SpaceGrotesk_700Bold',
  },
];

export function getFontSet(key) {
  return FONT_OPTIONS.find((f) => f.key === key) || FONT_OPTIONS[0];
}

/* ---------- Paletas de cor ---------- */
/*
 * Cada paleta define os acentos (strength/cardio/gold/info) para claro e
 * escuro. bg/surface/ink/muted/good/danger ficam sempre neutros — só os
 * acentos mudam, para o texto continuar sempre legível em qualquer
 * combinação de paleta + tema.
 */

export const PALETTE_OPTIONS = [
  {
    key: 'inferno',
    label: 'Inferno (laranja & vermelho)',
    light: { strength: '#FF3D00', cardio: '#00C853', gold: '#FFAB00', info: '#D50000' },
    dark: { strength: '#FF6E40', cardio: '#00E676', gold: '#FFD740', info: '#FF1744' },
  },
  {
    key: 'toxic',
    label: 'Tóxica (verde & preto)',
    light: { strength: '#39FF14', cardio: '#00E5FF', gold: '#FFEA00', info: '#7C4DFF' },
    dark: { strength: '#76FF03', cardio: '#18FFFF', gold: '#FFFF00', info: '#B388FF' },
  },
  {
    key: 'blood',
    label: 'Combate (vermelho & azul-marinho)',
    light: { strength: '#D50000', cardio: '#00838F', gold: '#0D1B4C', info: '#AA00FF' },
    dark: { strength: '#FF1744', cardio: '#00E5FF', gold: '#5C6BC0', info: '#E040FB' },
  },
  {
    key: 'vivid',
    label: 'Vívida & Agressiva',
    light: { strength: '#E60000', cardio: '#00A63E', gold: '#0B1F4B', info: '#FF6A00' },
    dark: { strength: '#FF3B30', cardio: '#22D46B', gold: '#3B5BA5', info: '#FF8A3D' },
  },
];

export function getPalette(key) {
  return PALETTE_OPTIONS.find((p) => p.key === key) || PALETTE_OPTIONS[0];
}

const neutralLight = {
  bg: '#EEF1EC',
  bgSoft: '#E4E9E2',
  surface: '#FFFFFF',
  border: '#D7DED4',
  ink: '#1B211D',
  muted: '#5C665F',
  good: '#2E9E4F',
  danger: '#C23B3B',
};

const neutralDark = {
  bg: '#14171B',
  bgSoft: '#1D2126',
  surface: '#1A1E22',
  border: '#2B3035',
  ink: '#EDEFEF',
  muted: '#8B939C',
  good: '#4ADE80',
  danger: '#E36A6A',
};

// Modo "Preto" — pensado para ecrãs OLED (poupa bateria, contraste máximo).
// Usa os mesmos acentos do modo escuro, só o fundo é que passa a preto puro.
const neutralBlack = {
  bg: '#000000',
  bgSoft: '#0A0A0A',
  surface: '#0D0D0D',
  border: '#242424',
  ink: '#F2F2F2',
  muted: '#8B939C',
  good: '#4ADE80',
  danger: '#E36A6A',
};

const NEUTRALS_BY_MODE = {
  light: neutralLight,
  dark: neutralDark,
  black: neutralBlack,
};

/**
 * @param {'light'|'dark'|'black'} mode
 * @param {string} fontKey  ver FONT_OPTIONS
 * @param {string} paletteKey  ver PALETTE_OPTIONS
 */
export function buildTheme(mode, fontKey, paletteKey) {
  const safeMode = NEUTRALS_BY_MODE[mode] ? mode : 'light';
  const palette = getPalette(paletteKey);
  const neutral = NEUTRALS_BY_MODE[safeMode];
  // "Preto" reaproveita os acentos do modo escuro — só o fundo muda.
  const accents = safeMode === 'light' ? palette.light : palette.dark;
  return {
    ...base,
    mode: safeMode,
    font: getFontSet(fontKey),
    colors: { ...neutral, ...accents },
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
