/**
 * Tokens do design system do Iron Log.
 *
 * Regra: nenhum ecrã deve escrever valores de espaçamento, raio, sombra,
 * duração de animação ou tamanho de letra "à mão". Tudo vem daqui, via
 * useTheme(). Se precisares de um valor novo, acrescenta-o aqui em vez de
 * o espalhar pelos componentes.
 */

/* ---------- Espaçamento ----------
 * Escala de 4pt. Os nomes são intencionalmente poucos — quando tudo cabe
 * em 7 degraus, o espaçamento fica consistente sem ninguém ter de pensar.
 */
export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

/* ---------- Raios ----------
 * Poucos valores, reutilizados. `pill` para elementos totalmente redondos.
 */
export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

/* ---------- Tipografia ----------
 * A escala define tamanho/entrelinha/espaçamento entre letras. A família
 * é injetada em runtime (o utilizador pode escolher a fonte), por isso
 * aqui só vivem as métricas.
 *
 * `numeric` é o tratamento especial para pesos, volumes e PRs — números
 * grandes, apertados e com presença, que é o que dá a sensação de app de
 * performance em vez de app de notas.
 */
export const TYPE = {
  hero: { fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  h1: { fontSize: 28, lineHeight: 33, letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  h3: { fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, letterSpacing: 0 },
  secondary: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 15, letterSpacing: 0.3 },
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 0.8 },
  button: { fontSize: 14, lineHeight: 18, letterSpacing: 0.4 },
  numericLg: { fontSize: 44, lineHeight: 46, letterSpacing: -1.8 },
  numericMd: { fontSize: 28, lineHeight: 30, letterSpacing: -1 },
  numericSm: { fontSize: 19, lineHeight: 22, letterSpacing: -0.4 },
};

/* ---------- Movimento ----------
 * Durações curtas e curvas naturais. A regra prática: se o utilizador
 * consegue reparar que "está a animar", está demasiado lento.
 *
 * As curvas são pares de Bezier prontos para usar com Easing.bezier(...).
 */
export const MOTION = {
  duration: {
    instant: 90, // feedback de toque
    fast: 160, // mudanças de estado
    base: 240, // entradas de conteúdo, barras de progresso
    slow: 380, // transições maiores, modais
    counter: 650, // contagem de números
  },
  // "standard": acelera e trava suavemente — para a maioria das coisas.
  // "decelerate": entra rápido e assenta — para conteúdo que aparece.
  // "spring": ligeiro exagero no fim — para confirmações e sucesso.
  easing: {
    standard: [0.4, 0.0, 0.2, 1],
    decelerate: [0.0, 0.0, 0.2, 1],
    accelerate: [0.4, 0.0, 1, 1],
    spring: [0.34, 1.4, 0.64, 1],
  },
  // Configuração de mola para reanimated (withSpring).
  springConfig: { damping: 18, stiffness: 220, mass: 0.7 },
  pressScale: 0.972, // escala ao carregar num cartão/botão
};

/* ---------- Elevação ----------
 * Quatro níveis, do fundo ao destaque. Cada nível combina uma sombra com
 * uma cor de superfície (definida por modo em theme.js) — é a combinação
 * das duas que cria a profundidade, não a sombra sozinha.
 */
export function buildElevation(mode) {
  // Em fundo escuro as sombras quase não se veem; a profundidade vem
  // sobretudo da diferença de tom entre superfícies e das bordas claras.
  const dark = mode !== 'light';
  const shadowColor = dark ? '#000000' : '#0F1613';
  const o = (light, darkVal) => (dark ? darkVal : light);

  return {
    none: {},
    low: {
      shadowColor,
      shadowOpacity: o(0.06, 0.3),
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    medium: {
      shadowColor,
      shadowOpacity: o(0.1, 0.42),
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    high: {
      shadowColor,
      shadowOpacity: o(0.16, 0.55),
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 16 },
      elevation: 14,
    },
  };
}

/* ---------- Alvos de toque ----------
 * Mínimo confortável para o dedo, usado em botões e ícones pequenos.
 */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH = 44;
