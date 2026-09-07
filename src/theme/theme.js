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
    key: 'classic',
    label: 'Laranja & Verde-água',
    light: { strength: '#E3572D', cardio: '#1D7874', gold: '#C98A1F', info: '#6D5BD0' },
    dark: { strength: '#FF7A4D', cardio: '#3FBAB3', gold: '#E8B84B', info: '#A596F5' },
  },
  {
    key: 'ocean',
    label: 'Azul & Violeta',
    light: { strength: '#2563EB', cardio: '#0EA5A5', gold: '#B45309', info: '#7C3AED' },
    dark: { strength: '#60A5FA', cardio: '#2DD4BF', gold: '#F0B94E', info: '#A78BFA' },
  },
  {
    key: 'sunset',
    label: 'Rosa & Dourado',
    light: { strength: '#DB2777', cardio: '#0D9488', gold: '#CA8A04', info: '#9333EA' },
    dark: { strength: '#F472B6', cardio: '#2DD4BF', gold: '#FACC15', info: '#C084FC' },
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

/**
 * @param {'light'|'dark'} mode
 * @param {string} fontKey  ver FONT_OPTIONS
 * @param {string} paletteKey  ver PALETTE_OPTIONS
 */
export function buildTheme(mode, fontKey, paletteKey) {
  const palette = getPalette(paletteKey);
  const neutral = mode === 'dark' ? neutralDark : neutralLight;
  const accents = mode === 'dark' ? palette.dark : palette.light;
  return {
    ...base,
    mode,
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
