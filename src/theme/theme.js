/**
 * Tema central da app.
 *
 * Equivalente às variáveis CSS da versão web. Todos os ecrãs consomem estas
 * cores/fontes através do useTheme() — não deve haver cores ou fontes
 * escritas à mão nos componentes, para o tema/modo escuro funcionarem em
 * todo o lado sem casos especiais.
 */

import { SPACE, RADIUS, TYPE, MOTION, buildElevation } from './tokens';

// Valores antigos, mantidos porque os ecrãs existentes ainda os usam via
// theme.radius / theme.spacing.*. Código novo deve usar theme.radii e
// theme.space (ver theme/tokens.js).
const base = {
  radius: 16,
  radiusSm: 10,
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
    // Paleta assinatura do Iron Log: lima elétrico sobre carvão profundo.
    // Lê-se como performance/tecnologia em vez de "app de ginásio genérica".
    // Em modo claro o lima puro não tem contraste suficiente sobre branco,
    // por isso desce para um verde-oliva escuro que mantém a mesma família.
    key: 'iron',
    label: 'Iron (lima elétrico)',
    light: { strength: '#4A7A00', cardio: '#00806A', gold: '#A86B00', info: '#4A55C7' },
    dark: { strength: '#CDFF47', cardio: '#00E5A0', gold: '#FFC848', info: '#8B9BFF' },
  },
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

/*
 * Cada modo define quatro níveis de superfície. A profundidade da interface
 * vem sobretudo desta escada de tons (mais do que das sombras, que quase
 * não se veem em fundo escuro):
 *
 *   bg              → fundo do ecrã, o plano mais recuado
 *   surface         → cartões normais
 *   surfaceElevated → cartões em destaque, modais
 *   surfaceHigh     → o elemento mais saliente do ecrã (hero, barra flutuante)
 *
 * Os nomes antigos (bgSoft, ink) mantêm-se como aliases para não partir os
 * ecrãs que ainda os usam.
 */
const neutralLight = {
  bg: '#F2F4F0',
  bgSoft: '#E8ECE5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHigh: '#FFFFFF',
  border: 'rgba(20, 30, 24, 0.10)',
  borderStrong: 'rgba(20, 30, 24, 0.18)',
  hairline: 'rgba(20, 30, 24, 0.07)',
  ink: '#141A16',
  textPrimary: '#141A16',
  textSecondary: '#4B564E',
  textMuted: '#7A857D',
  muted: '#7A857D',
  good: '#2E9E4F',
  warning: '#B77400',
  danger: '#C23B3B',
  scrim: 'rgba(18, 24, 20, 0.32)',
};

const neutralDark = {
  bg: '#0E1113',
  bgSoft: '#171B1E',
  surface: '#171B1E',
  surfaceElevated: '#1F2428',
  surfaceHigh: '#272D31',
  border: 'rgba(255, 255, 255, 0.09)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  hairline: 'rgba(255, 255, 255, 0.06)',
  ink: '#F1F4F2',
  textPrimary: '#F1F4F2',
  textSecondary: '#A8B2AC',
  textMuted: '#78827C',
  muted: '#78827C',
  good: '#4ADE80',
  warning: '#F0B94E',
  danger: '#E36A6A',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

// Modo "Preto" — pensado para ecrãs OLED (poupa bateria, contraste máximo).
// Usa os mesmos acentos do modo escuro; só o fundo desce a preto puro, e as
// superfícies sobem em degraus muito curtos para não "acender" o ecrã.
const neutralBlack = {
  bg: '#000000',
  bgSoft: '#0B0C0D',
  surface: '#0B0C0D',
  surfaceElevated: '#141618',
  surfaceHigh: '#1C1F21',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  hairline: 'rgba(255, 255, 255, 0.06)',
  ink: '#F4F6F5',
  textPrimary: '#F4F6F5',
  textSecondary: '#A2ACA6',
  textMuted: '#727B76',
  muted: '#727B76',
  good: '#4ADE80',
  warning: '#F0B94E',
  danger: '#E36A6A',
  scrim: 'rgba(0, 0, 0, 0.65)',
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
  const colors = {
    ...neutral,
    ...accents,
    // Nomes semânticos para os acentos. `strength`/`cardio` continuam a
    // existir (são usados por todo o lado e têm significado de domínio),
    // mas quando o que se quer é "a cor da marca" usa-se accent/accent2.
    accent: accents.strength,
    accent2: accents.cardio,
  };

  const isDark = safeMode !== 'light';

  return {
    ...base,
    mode: safeMode,
    isDark,
    font: getFontSet(fontKey),
    colors,

    // Tokens do design system (ver theme/tokens.js)
    space: SPACE,
    radii: RADIUS,
    type: TYPE,
    motion: MOTION,
    elevation: buildElevation(safeMode),

    /*
     * Gradientes prontos a passar ao <LinearGradient colors={...}>.
     * São deliberadamente subtis: servem para dar vida a superfícies e
     * barras de progresso, não para pintar o ecrã.
     */
    gradients: {
      // Ação principal e barras de progresso: do acento para o secundário.
      accent: [accents.strength, accents.cardio],
      // Superfície em destaque: um brilho quase impercetível no topo do
      // cartão, que sugere luz a vir de cima.
      //
      // Termina em transparência TOTAL de propósito. Se acabasse numa cor
      // ainda visível, o ponto onde o gradiente é cortado criava uma
      // aresta de cor súbita a meio do cartão.
      surfaceSheen: isDark
        ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.015)', 'rgba(255,255,255,0)']
        : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.25)', 'rgba(255,255,255,0)'],
      // Véu escuro sobre imagens/heros, para o texto se manter legível.
      scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)'],
    },
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

function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/**
 * Mistura duas cores hex (t entre 0 e 1), interpolando em HSL em vez de RGB
 * — misturar diretamente em RGB entre um verde e um vermelho passa por um
 * castanho/oliva lamacento no meio, que não se lê nem como verde nem como
 * vermelho. Em HSL, o meio passa por amarelo/laranja, como um semáforo.
 */
export function interpolateColor(colorA, colorB, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const a = rgbToHsl(parseHex(colorA));
  const b = rgbToHsl(parseHex(colorB));
  const h = a.h + (b.h - a.h) * clamped;
  const s = a.s + (b.s - a.s) * clamped;
  const l = a.l + (b.l - a.l) * clamped;
  const { r, g, b: bl } = hslToRgb(h, s, l);
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
