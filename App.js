/**
 * Ponto de entrada da app.
 *
 * A ordem dos providers importa: o tema depende das definições guardadas no
 * store, por isso o StoreProvider tem de estar por fora.
 */

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Unbounded_700Bold } from '@expo-google-fonts/unbounded';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import { WorkSans_500Medium, WorkSans_700Bold } from '@expo-google-fonts/work-sans';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { StoreProvider, useStore } from './src/context/StoreContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppShell() {
  const theme = useTheme();
  const { booting } = useStore();

  if (booting) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.bg,
        }}
      >
        <ActivityIndicator color={theme.colors.strength} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.mode !== 'light' ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Unbounded_700Bold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    JetBrainsMono_400Regular,
    Anton_400Regular,
    WorkSans_500Medium,
    WorkSans_700Bold,
    BebasNeue_400Regular,
    Inter_500Medium,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
