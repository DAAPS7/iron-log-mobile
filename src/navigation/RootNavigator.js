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
import { Text } from 'react-native';

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

const TAB_ICONS = {
  Perfil: '👤',
  Treinos: '🏋️',
  Nutrição: '🍽️',
  Progresso: '📈',
  Histórico: '📋',
};

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.strength,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: theme.font.bodyBold,
          fontSize: 10,
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
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
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme).colors,
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
