/**
 * Navegação da app.
 *
 * Sem sessão → ecrã de autenticação.
 * Com sessão → tabs principais (a de Amigos vive no cabeçalho, tal como na
 * versão web, para não sobrecarregar a barra de baixo).
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TabBar from '../components/TabBar';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

import AuthScreen from '../screens/AuthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import ProgressScreen from '../screens/ProgressScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LogSessionScreen from '../screens/LogSessionScreen';
import WorkoutBuilderScreen from '../screens/WorkoutBuilderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      // A barra é totalmente personalizada (ver components/TabBar.js):
      // flutua sobre o conteúdo, com indicador animado e ícones do nosso
      // sistema em vez de emoji.
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // O conteúdo corre por baixo da barra flutuante; o espaço extra
        // no fundo é garantido pelo <Screen> (ver components/ui.js).
        tabBarStyle: { position: 'absolute' },
      }}
    >
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Treinos" component={WorkoutsScreen} />
      <Tab.Screen name="Nutrição" component={NutritionScreen} />
      <Tab.Screen name="Progresso" component={ProgressScreen} />
      <Tab.Screen name="Histórico" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isSignedIn } = useStore();
  const theme = useTheme();

  const navTheme = {
    ...(theme.mode !== 'light' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode !== 'light' ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.ink,
      border: theme.colors.border,
      primary: theme.colors.strength,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.bg },
          headerTitleStyle: {
            fontFamily: theme.font.display,
            color: theme.colors.ink,
          },
          headerTintColor: theme.colors.ink,
          contentStyle: { backgroundColor: theme.colors.bg },
        }}
      >
        {!isSignedIn ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            {/* Ecrãs empilhados sobre as tabs */}
            <Stack.Screen
              name="LogSession"
              component={LogSessionScreen}
              options={{ title: 'Registar Treino' }}
            />
            <Stack.Screen
              name="WorkoutBuilder"
              component={WorkoutBuilderScreen}
              options={{ title: 'Treino' }}
            />
            <Stack.Screen
              name="Friends"
              component={FriendsScreen}
              options={{ title: 'Amigos' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Definições' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
