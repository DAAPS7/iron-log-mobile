import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Field,
  Input,
  Note,
  SegmentedControl,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

export default function AuthScreen() {
  const theme = useTheme();
  const { signIn, signUp } = useStore();

  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit() {
    setError(null);
    if (!username.trim() || !password) {
      setError('Preenche o utilizador e a palavra-passe.');
      return;
    }
    if (isRegister && password !== confirm) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setLoading(true);
    try {
      if (isRegister) await signUp(username.trim(), password);
      else await signIn(username.trim(), password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg,
        justifyContent: 'center',
        padding: theme.spacing.lg,
      }}
    >
      <Text
        style={{
          fontFamily: theme.font.display,
          fontSize: 34,
          color: theme.colors.ink,
          textAlign: 'center',
          textTransform: 'uppercase',
          marginBottom: theme.spacing.lg,
        }}
      >
        Iron Log
      </Text>

      <Card>
        <View style={{ marginBottom: theme.spacing.lg }}>
          <SegmentedControl
            value={mode}
            onChange={(v) => {
              setMode(v);
              setError(null);
            }}
            options={[
              { value: 'login', label: 'Entrar' },
              { value: 'register', label: 'Criar Conta' },
            ]}
          />
        </View>

        <Field label="Utilizador">
          <Input
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="o teu username"
          />
        </Field>

        <Field label="Palavra-passe">
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="••••••"
          />
        </Field>

        {isRegister ? (
          <Field label="Confirmar palavra-passe">
            <Input
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              placeholder="••••••"
            />
          </Field>
        ) : null}

        {error ? (
          <Body color={theme.colors.danger} style={{ marginBottom: 10 }}>
            {error}
          </Body>
        ) : null}

        <Button
          title={isRegister ? 'Criar conta' : 'Entrar'}
          variant="strength"
          onPress={handleSubmit}
          loading={loading}
        />

        <Note style={{ textAlign: 'center', marginTop: theme.spacing.md }}>
          A tua conta é a mesma do site — os dados sincronizam entre os dois.
        </Note>
      </Card>
    </KeyboardAvoidingView>
  );
}
