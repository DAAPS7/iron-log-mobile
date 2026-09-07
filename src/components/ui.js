/**
 * Primitivos de UI partilhados por toda a app.
 *
 * Todos leem o tema via useTheme(), por isso respeitam automaticamente o
 * modo claro/escuro. Os ecrãs devem compor-se a partir daqui em vez de
 * escreverem estilos e cores à mão.
 */

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';

/* ---------- Estrutura de ecrã ---------- */

const MAX_CONTENT_WIDTH = 640;

export function Screen({ children, scroll = true, contentStyle }) {
  const theme = useTheme();
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      edges={['top']}
    >
      <Container
        style={{ flex: 1 }}
        contentContainerStyle={
          scroll
            ? [
                {
                  padding: theme.spacing.md,
                  paddingBottom: theme.spacing.xl * 2,
                  width: '100%',
                  maxWidth: MAX_CONTENT_WIDTH,
                  alignSelf: 'center',
                },
                contentStyle,
              ]
            : { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }
        }
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

export function ScreenTitle({ children, subtitle }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={{
          fontFamily: theme.font.display,
          fontSize: 28,
          color: theme.colors.ink,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {children}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: theme.font.body,
            fontSize: 13,
            color: theme.colors.muted,
            marginTop: 4,
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* ---------- Cartões ---------- */

export function Card({ children, accent, onPress, style }) {
  const theme = useTheme();
  const base = {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...(accent
      ? { borderLeftWidth: 3, borderLeftColor: accent }
      : null),
  };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { opacity: 0.75 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function CardTitle({ children, right }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: theme.spacing.sm,
      }}
    >
      <Text
        style={{
          fontFamily: theme.font.bodyBold,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: theme.colors.muted,
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
        {
          fontFamily: theme.font.body,
          fontSize: 14,
          color: color || theme.colors.ink,
          lineHeight: 20,
        },
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
          fontSize: 12,
          color: color || theme.colors.muted,
          lineHeight: 17,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Número grande de destaque (ex: peso atual, BMR). */
export function BigStat({ value, unit, color }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
      <Text
        style={{
          fontFamily: theme.font.display,
          fontSize: 32,
          color: color || theme.colors.ink,
        }}
      >
        {value}
      </Text>
      {unit ? (
        <Text
          style={{
            fontFamily: theme.font.body,
            fontSize: 12,
            color: theme.colors.muted,
          }}
        >
          {unit}
        </Text>
      ) : null}
    </View>
  );
}

/* ---------- Botões ---------- */

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.colors.ink, fg: theme.colors.bg, border: 'transparent' },
    strength: { bg: theme.colors.strength, fg: '#fff', border: 'transparent' },
    cardio: { bg: theme.colors.cardio, fg: '#fff', border: 'transparent' },
    ghost: { bg: 'transparent', fg: theme.colors.ink, border: theme.colors.border },
    danger: { bg: 'transparent', fg: theme.colors.danger, border: theme.colors.border },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1.5,
          borderRadius: 999,
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: theme.font.bodyBold,
            fontSize: 13,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: palette.fg,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/* ---------- Formulários ---------- */

export function Field({ label, hint, children, flex }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.md, ...(flex ? { flex: 1 } : null) }}>
      {label ? (
        <Text
          style={{
            fontFamily: theme.font.bodyBold,
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: theme.colors.muted,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}
      {children}
      {hint ? <Note style={{ marginTop: 4 }}>{hint}</Note> : null}
    </View>
  );
}

export function Input(props) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.colors.muted}
      {...props}
      style={[
        {
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          borderRadius: theme.radiusSm,
          paddingHorizontal: 12,
          paddingVertical: 11,
          fontFamily: theme.font.body,
          fontSize: 16, // 16 evita zoom automático em alguns teclados
          color: theme.colors.ink,
          backgroundColor: theme.colors.surface,
        },
        props.style,
      ]}
    />
  );
}

/** Grupo de opções em linha (equivalente ao .seg da versão web). */
export function SegmentedControl({ options, value, onChange }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              backgroundColor: active ? theme.colors.ink : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: theme.font.bodyBold,
                fontSize: 12,
                textTransform: 'uppercase',
                color: active ? theme.colors.bg : theme.colors.muted,
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

/* ---------- Estados vazios ---------- */

export function EmptyState({ title, message, action }) {
  const theme = useTheme();
  return (
    <View
      style={{
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: theme.colors.border,
        borderRadius: theme.radius,
        padding: theme.spacing.xl,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: theme.font.display,
          fontSize: 18,
          color: theme.colors.ink,
          textTransform: 'uppercase',
          marginBottom: 6,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Note style={{ textAlign: 'center', marginBottom: action ? 14 : 0 }}>
        {message}
      </Note>
      {action}
    </View>
  );
}

/* ---------- Barra de progresso ---------- */

export function ProgressBar({ value, goal, color, label, unit = 'g' }) {
  const theme = useTheme();
  const pct = goal ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      {label ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <Note>{label}</Note>
          <Note>
            {Math.round(value)}
            {unit}
            {goal ? ` / ${goal}${unit}` : ''}
          </Note>
        </View>
      ) : null}
      <View
        style={{
          height: 14,
          borderRadius: 999,
          backgroundColor: theme.colors.bgSoft,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            backgroundColor: color || theme.colors.strength,
          }}
        />
      </View>
    </View>
  );
}
