/**
 * Barra de navegação inferior, flutuante.
 *
 * Em vez de uma barra colada ao fundo do ecrã, esta "pousa" sobre o
 * conteúdo com margem à volta e cantos redondos — o conteúdo continua a
 * correr por baixo, o que dá profundidade e faz a navegação parecer parte
 * da interface em vez de um rodapé.
 *
 * O indicador de tab ativa desliza entre posições (a animação explica para
 * onde o utilizador foi) e o ícone ativo cresce ligeiramente.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { MAX_CONTENT_WIDTH } from './ui';

// Margem de cada lado do indicador, dentro do seu segmento.
const INDICATOR_INSET = 6;

const TAB_ICONS = {
  Perfil: 'profile',
  Treinos: 'dumbbell',
  Nutrição: 'nutrition',
  Progresso: 'progress',
  Histórico: 'history',
};

function TabItem({ route, isFocused, onPress, label }) {
  const theme = useTheme();
  const anim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFocused ? 1 : 0,
      duration: theme.motion.duration.fast,
      easing: Easing.bezier(...theme.motion.easing.standard),
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        paddingHorizontal: 2,
        minHeight: 60,
      }}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          transform: [
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
          ],
        }}
      >
        <Icon
          name={TAB_ICONS[route.name] || 'spark'}
          size={23}
          color={isFocused ? theme.colors.accent : theme.colors.textMuted}
          strokeWidth={isFocused ? 2.1 : 1.7}
        />
        <Text
          numberOfLines={1}
          // Com 5 tabs, num ecrã de 360px cada uma tem ~66px. O tamanho e
          // o espaçamento são o máximo que deixa "Histórico" caber inteiro.
          adjustsFontSizeToFit
          minimumFontScale={0.85}
          style={{
            fontFamily: theme.font.bodyBold,
            fontSize: 9.5,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            marginTop: 5,
            textAlign: 'center',
            color: isFocused ? theme.colors.accent : theme.colors.textMuted,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function TabBar({ state, descriptors, navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const indicator = useRef(new Animated.Value(state.index)).current;
  const [barWidth, setBarWidth] = React.useState(0);

  useEffect(() => {
    Animated.timing(indicator, {
      toValue: state.index,
      duration: theme.motion.duration.base,
      easing: Easing.bezier(...theme.motion.easing.standard),
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const count = state.routes.length;
  const segment = barWidth ? barWidth / count : 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 10),
        paddingHorizontal: 14,
      }}
    >
      <View
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        style={[
          {
            flexDirection: 'row',
            width: '100%',
            maxWidth: MAX_CONTENT_WIDTH,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden',
            // O blur só existe em nativo; na web usamos uma superfície
            // sólida para garantir legibilidade em qualquer browser.
            backgroundColor:
              Platform.OS === 'web'
                ? theme.colors.surfaceElevated
                : theme.isDark
                  ? 'rgba(20,24,26,0.72)'
                  : 'rgba(255,255,255,0.78)',
          },
          theme.elevation.high,
        ]}
      >
        {Platform.OS !== 'web' ? (
          <BlurView
            intensity={theme.isDark ? 40 : 60}
            tint={theme.isDark ? 'dark' : 'light'}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
        ) : null}

        {/* Indicador da tab ativa: uma pastilha que desliza por trás do ícone. */}
        {segment > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
              width: segment - INDICATOR_INSET * 2,
              left: INDICATOR_INSET,
              borderRadius: theme.radii.lg,
              backgroundColor: theme.isDark
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(20,30,24,0.055)',
              transform: [
                {
                  translateX: indicator.interpolate({
                    inputRange: state.routes.map((_, i) => i),
                    outputRange: state.routes.map((_, i) => i * segment),
                  }),
                },
              ],
            }}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}
