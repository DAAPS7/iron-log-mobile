/**
 * Primitivos de UI partilhados por toda a app.
 *
 * Todos leem o tema via useTheme(), por isso respeitam automaticamente o
 * modo claro/escuro/preto e a paleta escolhida. Os ecrãs devem compor-se a
 * partir daqui em vez de escreverem estilos e cores à mão.
 *
 * Princípios seguidos aqui:
 *  - profundidade por camadas de superfície (ver theme/tokens.js), não por
 *    sombras pesadas;
 *  - toda a interação tem resposta visual imediata (escala + opacidade);
 *  - animações curtas (160-240ms) com curvas naturais;
 *  - nenhum valor solto: espaçamento, raio, tipo e movimento vêm do tema.
 */

import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';

/* ---------- Ajudas de animação ----------
 * Usamos a Animated API do React Native (não reanimated) nestes primitivos
 * porque são animações simples de escala/opacidade e assim não pagamos o
 * custo de worklets em componentes que aparecem dezenas de vezes por ecrã.
 */

function useBezier(curve) {
  return Easing.bezier(curve[0], curve[1], curve[2], curve[3]);
}

/** Escala de resposta ao toque, partilhada por cartões e botões. */
function usePressScale(enabled, targetScale) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const ease = useBezier(theme.motion.easing.standard);

  const to = (v) =>
    Animated.timing(scale, {
      toValue: v,
      duration: theme.motion.duration.instant,
      easing: ease,
      useNativeDriver: true,
    }).start();

  return {
    scale,
    onPressIn: enabled ? () => to(targetScale ?? theme.motion.pressScale) : undefined,
    onPressOut: enabled ? () => to(1) : undefined,
  };
}

/** Faz o conteúdo entrar suavemente (fade + subida curta). */
export function FadeInView({ children, delay = 0, style }) {
  const theme = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const ease = useBezier(theme.motion.easing.decelerate);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: theme.motion.duration.base,
      delay,
      easing: ease,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ---------- Estrutura de ecrã ---------- */

export const MAX_CONTENT_WIDTH = 640;

export function Screen({ children, scroll = true, contentStyle }) {
  const theme = useTheme();
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <Container
        style={{ flex: 1 }}
        contentContainerStyle={
          scroll
            ? [
                {
                  padding: theme.space.lg,
                  // Espaço extra em baixo para o conteúdo nunca ficar
                  // escondido atrás da barra de navegação flutuante.
                  paddingBottom: theme.space.xxxl * 2.5,
                  width: '100%',
                  maxWidth: MAX_CONTENT_WIDTH,
                  alignSelf: 'center',
                },
                contentStyle,
              ]
            : { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

/** Cabeçalho principal de um ecrã. */
export function ScreenTitle({ children, subtitle, right }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.space.xl,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: theme.font.display,
            ...theme.type.h1,
            color: theme.colors.textPrimary,
          }}
        >
          {children}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontFamily: theme.font.body,
              ...theme.type.secondary,
              color: theme.colors.textMuted,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Separador de secção — mais leve que um título de ecrã. */
export function SectionHeader({ children, right, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.space.md,
          marginTop: theme.space.xs,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: theme.font.bodyBold,
          ...theme.type.label,
          textTransform: 'uppercase',
          color: theme.colors.textMuted,
        }}
      >
        {children}
      </Text>
      {right}
    </View>
  );
}

/* ---------- Superfícies ---------- */

/**
 * Cartão. Três níveis de destaque via `level`:
 *   'surface'  (por omissão) — conteúdo normal
 *   'elevated' — destaque, modais
 *   'high'     — o elemento mais saliente do ecrã
 *
 * `accent` pinta uma faixa fina no topo (identidade da secção) e `onPress`
 * ativa a resposta de toque.
 */
export function Card({ children, accent, onPress, style, level = 'surface', padded = true }) {
  const theme = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale(!!onPress);

  const bg = {
    surface: theme.colors.surface,
    elevated: theme.colors.surfaceElevated,
    high: theme.colors.surfaceHigh,
  }[level];

  const shadow = { surface: theme.elevation.low, elevated: theme.elevation.medium, high: theme.elevation.high }[
    level
  ];

  const Wrapper = onPress ? Pressable : View;

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: theme.space.lg }}>
      <Wrapper
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          {
            backgroundColor: bg,
            borderRadius: theme.radii.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden',
          },
          shadow,
          style,
        ]}
      >
        {/* Brilho subtil no topo: sugere luz vinda de cima e evita que a
            superfície pareça uma caixa lisa. */}
        <LinearGradient
          colors={theme.gradients.surfaceSheen}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 130 }}
          pointerEvents="none"
        />
        {accent ? (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: accent,
            }}
            pointerEvents="none"
          />
        ) : null}
        <View style={padded ? { padding: theme.space.lg } : null}>{children}</View>
      </Wrapper>
    </Animated.View>
  );
}

export function CardTitle({ children, right, style }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.space.md,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: theme.font.bodyBold,
          ...theme.type.label,
          textTransform: 'uppercase',
          color: theme.colors.textMuted,
          flex: 1,
        }}
      >
        {children}
      </Text>
      {right}
    </View>
  );
}

/* ---------- Texto ---------- */

export function Body({ children, color, style }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        { fontFamily: theme.font.body, ...theme.type.body, color: color || theme.colors.textPrimary },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Note({ children, color, style }) {
  const theme = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: theme.font.body,
          ...theme.type.secondary,
          color: color || theme.colors.textMuted,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * Número com contagem animada. Usado em estatísticas — o valor "sobe" até
 * ao número final em vez de aparecer de repente, o que ajuda a perceber
 * que aquele valor mudou.
 */
export function AnimatedNumber({ value, decimals = 0, style, color }) {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState(0);
  const ease = useBezier(theme.motion.easing.decelerate);
  const target = Number(value) || 0;

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(v));
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: target,
      duration: theme.motion.duration.counter,
      easing: ease,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [target]);

  return (
    <Text style={[{ fontFamily: theme.font.display, color: color || theme.colors.textPrimary }, style]}>
      {display.toFixed(decimals)}
    </Text>
  );
}

/** Estatística grande, com o número em destaque e a unidade discreta. */
export function BigStat({ value, unit, color, animated = false }) {
  const theme = useTheme();
  const numeric = typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      {animated && numeric ? (
        <AnimatedNumber
          value={value}
          decimals={Number.isInteger(Number(value)) ? 0 : 1}
          color={color || theme.colors.textPrimary}
          style={theme.type.numericLg}
        />
      ) : (
        <Text
          style={{
            fontFamily: theme.font.display,
            ...theme.type.numericLg,
            color: color || theme.colors.textPrimary,
          }}
        >
          {value}
        </Text>
      )}
      {unit ? (
        <Text
          style={{
            fontFamily: theme.font.body,
            ...theme.type.secondary,
            color: theme.colors.textMuted,
            marginLeft: 6,
          }}
        >
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

/** Etiqueta pequena, para estados e categorias. */
export function Badge({ children, color, style }) {
  const theme = useTheme();
  const c = color || theme.colors.accent;
  return (
    <View
      style={[
        {
          paddingHorizontal: theme.space.md,
          paddingVertical: 5,
          borderRadius: theme.radii.pill,
          backgroundColor: withAlphaSafe(c, 0.14),
          borderWidth: 1,
          borderColor: withAlphaSafe(c, 0.28),
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: theme.font.bodyBold,
          ...theme.type.caption,
          textTransform: 'uppercase',
          color: c,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// Aceita hex ou rgb() — as cores de acento podem vir das duas formas.
function withAlphaSafe(color, alpha) {
  if (!color) return 'transparent';
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  if (color.startsWith('rgba')) return color;
  const h = color.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------- Botões ---------- */

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, icon }) {
  const theme = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale(!disabled && !loading, 0.955);

  // O gradiente é usado apenas como contorno, nunca como preenchimento —
  // botões inteiramente pintados a gradiente tornavam-se ruidosos quando
  // apareciam vários no mesmo ecrã.
  const gradientBorder = variant === 'primary' || variant === 'strength';

  const palette = {
    primary: { bg: theme.colors.accent, fg: theme.isDark ? '#0B0F0C' : '#FFFFFF', border: 'transparent' },
    strength: { bg: theme.colors.accent, fg: theme.isDark ? '#0B0F0C' : '#FFFFFF', border: 'transparent' },
    cardio: { bg: theme.colors.cardio, fg: theme.isDark ? '#08120F' : '#FFFFFF', border: 'transparent' },
    ghost: { bg: 'transparent', fg: theme.colors.textPrimary, border: theme.colors.borderStrong },
    danger: {
      bg: withAlphaSafe(theme.colors.danger, 0.12),
      fg: theme.colors.danger,
      border: withAlphaSafe(theme.colors.danger, 0.3),
    },
  }[variant] || { bg: 'transparent', fg: theme.colors.textPrimary, border: theme.colors.borderStrong };

  const content = loading ? (
    <ActivityIndicator color={palette.fg} size="small" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
      {icon ? <Text style={{ fontSize: 13 }}>{icon}</Text> : null}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: theme.font.bodyBold,
          ...theme.type.button,
          textTransform: 'uppercase',
          color: palette.fg,
        }}
      >
        {title}
      </Text>
    </View>
  );

  /*
   * O `style` recebido é dividido em dois:
   *  - propriedades de espaçamento interno (padding*, minHeight) vão para o
   *    corpo do botão, SUBSTITUINDO os valores por omissão;
   *  - tudo o resto (margens, flex, alinhamento) fica no invólucro.
   *
   * Sem esta separação, um ecrã que passasse `paddingVertical: 6` estava na
   * verdade a ACRESCENTAR 6px à volta de um botão que já tinha o seu
   * próprio padding — era o que fazia alguns botões parecerem inchados e
   * demasiado espaçados.
   */
  const flat = StyleSheet.flatten(style) || {};
  const INNER_KEYS = [
    'padding',
    'paddingVertical',
    'paddingHorizontal',
    'paddingTop',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'minHeight',
    'height',
  ];
  const innerOverrides = {};
  const wrapperStyle = {};
  Object.entries(flat).forEach(([k, v]) => {
    if (INNER_KEYS.includes(k)) innerOverrides[k] = v;
    else wrapperStyle[k] = v;
  });

  const inner = {
    minHeight: 38,
    paddingVertical: 9,
    paddingHorizontal: theme.space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    ...innerOverrides,
  };
  // Se o ecrã pediu um botão compacto (padding menor) e não impôs altura,
  // a altura mínima tem de descer também — senão o botão continuava alto e
  // o padding pedido não tinha efeito visível.
  if (innerOverrides.paddingVertical != null && innerOverrides.minHeight == null) {
    inner.minHeight = Math.max(30, innerOverrides.paddingVertical * 2 + 18);
  }

  const BORDER = 1.5;

  return (
    <Animated.View style={[{ transform: [{ scale }], flexShrink: 0 }, wrapperStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={{ opacity: disabled ? 0.4 : 1, borderRadius: theme.radii.pill, overflow: 'hidden' }}
      >
        {gradientBorder ? (
          // O contorno em gradiente é o próprio LinearGradient a servir de
          // fundo, com o corpo sólido por cima deixando uma margem fina.
          <LinearGradient
            colors={theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: BORDER, borderRadius: theme.radii.pill }}
          >
            <View
              style={[
                inner,
                { backgroundColor: palette.bg, borderRadius: theme.radii.pill },
              ]}
            >
              {content}
            </View>
          </LinearGradient>
        ) : (
          <View
            style={[
              inner,
              { backgroundColor: palette.bg, borderWidth: BORDER, borderColor: palette.border },
            ]}
          >
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ---------- Formulários ---------- */

export function Field({ label, hint, children, flex }) {
  const theme = useTheme();
  return (
    <View style={[{ marginBottom: theme.space.lg }, flex ? { flex: 1 } : null]}>
      {label ? (
        <Text
          style={{
            fontFamily: theme.font.bodyBold,
            ...theme.type.label,
            textTransform: 'uppercase',
            color: theme.colors.textMuted,
            marginBottom: 7,
          }}
        >
          {label}
        </Text>
      ) : null}
      {children}
      {hint ? <Note style={{ marginTop: 6 }}>{hint}</Note> : null}
    </View>
  );
}

export function Input(props) {
  const theme = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        {
          borderWidth: 1.5,
          // O foco é assinalado pela cor da borda — resposta imediata sem
          // deslocar nada no layout.
          borderColor: focused ? theme.colors.accent : theme.colors.border,
          borderRadius: theme.radii.md,
          paddingHorizontal: theme.space.md,
          paddingVertical: 11,
          fontFamily: theme.font.body,
          fontSize: 16, // 16 evita o zoom automático de alguns teclados
          color: theme.colors.textPrimary,
          backgroundColor: theme.isDark ? theme.colors.bg : theme.colors.surface,
          minWidth: 0,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : null),
        },
        props.style,
      ]}
    />
  );
}

/** Seletor segmentado com indicador que desliza entre as opções. */
export function SegmentedControl({ options, value, onChange }) {
  const theme = useTheme();
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const anim = useRef(new Animated.Value(index)).current;
  const [width, setWidth] = React.useState(0);
  const ease = useBezier(theme.motion.easing.standard);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: index,
      duration: theme.motion.duration.fast,
      easing: ease,
      useNativeDriver: true,
    }).start();
  }, [index]);

  // A largura útil desconta a margem interna dos dois lados. Sem isto o
  // indicador vai-se desalinhando de opção para opção (nota-se sobretudo
  // com 3+ opções, onde a última fica claramente fora do sítio).
  const PAD = 4;
  const segment = width ? (width - PAD * 2) / options.length : 0;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        borderRadius: theme.radii.pill,
        backgroundColor: theme.isDark ? theme.colors.bg : theme.colors.bgSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: PAD,
        overflow: 'hidden',
      }}
    >
      {segment > 0 ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: PAD,
            bottom: PAD,
            left: PAD,
            width: segment,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.accent,
            transform: [
              {
                translateX: anim.interpolate({
                  inputRange: options.map((_, i) => i),
                  outputRange: options.map((_, i) => i * segment),
                }),
              },
            ],
          }}
        />
      ) : null}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              minWidth: 0,
              paddingVertical: 8,
              paddingHorizontal: 4,
              alignItems: 'center',
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: theme.font.bodyBold,
                ...theme.type.caption,
                textTransform: 'uppercase',
                color: active
                  ? theme.isDark
                    ? '#0B0F0C'
                    : '#FFFFFF'
                  : theme.colors.textMuted,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Estados ---------- */

export function EmptyState({ title, message, action, icon = '✦' }) {
  const theme = useTheme();
  return (
    <FadeInView>
      <View
        style={{
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: theme.space.xxl,
          paddingHorizontal: theme.space.xl,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: theme.radii.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: withAlphaSafe(theme.colors.accent, 0.12),
            marginBottom: theme.space.lg,
          }}
        >
          <Text style={{ fontSize: 22, color: theme.colors.accent }}>{icon}</Text>
        </View>
        <Text
          style={{
            fontFamily: theme.font.display,
            ...theme.type.h3,
            color: theme.colors.textPrimary,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Note style={{ textAlign: 'center', marginBottom: action ? theme.space.lg : 0 }}>
          {message}
        </Note>
        {action}
      </View>
    </FadeInView>
  );
}

/** Bloco de carregamento com pulsação — evita saltos bruscos de layout. */
export function Skeleton({ height = 16, width = '100%', radius, style }) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          borderRadius: radius ?? theme.radii.sm,
          backgroundColor: theme.colors.bgSoft,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
        },
        style,
      ]}
    />
  );
}

/* ---------- Progresso ---------- */

/** Barra de progresso com preenchimento em gradiente e animação de entrada. */
export function ProgressBar({ value, goal, color, label, unit = 'g', height = 10 }) {
  const theme = useTheme();
  const pct = goal ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  const anim = useRef(new Animated.Value(0)).current;
  const ease = useBezier(theme.motion.easing.decelerate);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: theme.motion.duration.base,
      easing: ease,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const complete = pct >= 100;

  return (
    <View style={{ marginBottom: theme.space.md }}>
      {label ? (
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}
        >
          <Note color={theme.colors.textSecondary}>{label}</Note>
          <Note color={complete ? theme.colors.good : theme.colors.textMuted}>
            {Math.round(value)}
            {unit}
            {goal ? ` / ${goal}${unit}` : ''}
          </Note>
        </View>
      ) : null}
      <View
        style={{
          height,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.isDark ? theme.colors.bg : theme.colors.bgSoft,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.hairline,
        }}
      >
        <Animated.View style={{ width, height: '100%' }}>
          <LinearGradient
            colors={color ? [color, color] : theme.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: theme.radii.pill }}
          />
        </Animated.View>
      </View>
    </View>
  );
}
