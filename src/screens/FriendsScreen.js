import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Input,
  Note,
  Screen,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../api/client';

export default function FriendsScreen() {
  const theme = useTheme();
  const { token, data, updateData } = useStore();

  const [social, setSocial] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSocial(await api.loadSocial(token));
    } catch (e) {
      // sem rede — mantém o que já estava
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function act(payload) {
    setBusy(true);
    try {
      await api.friendsAction(token, payload);
      await refresh();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    if (query.trim().length < 2) return;
    try {
      const res = await api.searchFriends(token, query.trim());
      setResults(res.results || []);
    } catch (e) {
      Alert.alert('Erro', e.message);
    }
  }

  if (!social) {
    return (
      <Screen>
        <Note>A carregar…</Note>
      </Screen>
    );
  }

  const knownUsers = new Set([
    ...social.friends.map((f) => f.username),
    ...social.outgoing,
  ]);

  return (
    <Screen>
      <Card>
        <CardTitle>Adicionar amigo</CardTitle>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Nome de utilizador"
            autoCapitalize="none"
            style={{ flex: 1 }}
          />
          <Button title="Procurar" variant="ghost" onPress={search} />
        </View>

        {results.map((r) => (
          <View
            key={r.username}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 9,
              borderTopWidth: 1,
              borderTopColor: theme.colors.bgSoft,
            }}
          >
            <Body>{r.displayName}</Body>
            {knownUsers.has(r.username) ? (
              <Note>já adicionado</Note>
            ) : (
              <Button
                title="+ Adicionar"
                variant="strength"
                style={{ paddingVertical: 7, paddingHorizontal: 14 }}
                onPress={() => act({ action: 'request', targetUsername: r.username })}
              />
            )}
          </View>
        ))}
      </Card>

      {social.incoming.length ? (
        <Card accent={theme.colors.info}>
          <CardTitle>Pedidos de amizade</CardTitle>
          {social.incoming.map((r) => (
            <View
              key={r.username}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 9,
              }}
            >
              <Body style={{ flex: 1 }}>{r.displayName}</Body>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Aceitar"
                  variant="strength"
                  style={{ paddingVertical: 7, paddingHorizontal: 14 }}
                  onPress={() =>
                    act({ action: 'respond', fromUsername: r.username, accept: true })
                  }
                />
                <Button
                  title="Recusar"
                  variant="danger"
                  style={{ paddingVertical: 7, paddingHorizontal: 14 }}
                  onPress={() =>
                    act({ action: 'respond', fromUsername: r.username, accept: false })
                  }
                />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {social.notifications.length ? (
        <Card>
          <CardTitle
            right={
              <Pressable onPress={() => act({ action: 'clear-notifications' })}>
                <Note color={theme.colors.ink}>Limpar todas</Note>
              </Pressable>
            }
          >
            Notificações
          </CardTitle>
          {social.notifications.slice(0, 20).map((n) => (
            <View
              key={n.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 10,
                paddingVertical: 9,
                borderTopWidth: 1,
                borderTopColor: theme.colors.bgSoft,
              }}
            >
              <Note style={{ flex: 1 }}>{n.message}</Note>
              <Pressable onPress={() => act({ action: 'dismiss-notification', id: n.id })}>
                <Note>✕</Note>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      {social.sharedWorkoutsInbox.length ? (
        <Card accent={theme.colors.gold}>
          <CardTitle>Treinos partilhados contigo</CardTitle>
          {social.sharedWorkoutsInbox.map((s) => (
            <View key={s.id} style={{ paddingVertical: 9 }}>
              <Body style={{ fontFamily: theme.font.bodyBold }}>{s.workout.name}</Body>
              <Note>de {s.fromDisplayName}</Note>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button
                  title="Adicionar"
                  variant="strength"
                  style={{ paddingVertical: 7, paddingHorizontal: 14 }}
                  onPress={async () => {
                    updateData((prev) => ({
                      ...prev,
                      workouts: [
                        ...prev.workouts,
                        {
                          ...s.workout,
                          id: `${s.workout.id}-${Date.now().toString(36)}`,
                        },
                      ],
                    }));
                    await act({ action: 'dismiss-shared-workout', id: s.id });
                  }}
                />
                <Button
                  title="Dispensar"
                  variant="ghost"
                  style={{ paddingVertical: 7, paddingHorizontal: 14 }}
                  onPress={() => act({ action: 'dismiss-shared-workout', id: s.id })}
                />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <CardTitle>Os teus amigos</CardTitle>
        {!social.friends.length ? (
          <Note>Ainda sem amigos. Procura alguém pelo nome de utilizador.</Note>
        ) : (
          social.friends.map((f) => (
            <View
              key={f.username}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 9,
                borderTopWidth: 1,
                borderTopColor: theme.colors.bgSoft,
              }}
            >
              <Body style={{ flex: 1 }}>{f.displayName}</Body>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Partilhar"
                  variant="ghost"
                  style={{ paddingVertical: 7, paddingHorizontal: 12 }}
                  onPress={() => {
                    if (!data.workouts.length) {
                      Alert.alert('Sem treinos', 'Cria um treino primeiro.');
                      return;
                    }
                    Alert.alert(
                      'Partilhar treino',
                      'Escolhe o treino a partilhar:',
                      [
                        ...data.workouts.slice(0, 5).map((w) => ({
                          text: w.name,
                          onPress: () =>
                            act({
                              action: 'share-workout',
                              friendUsername: f.username,
                              workout: w,
                            }),
                        })),
                        { text: 'Cancelar', style: 'cancel' },
                      ],
                    );
                  }}
                />
                <Button
                  title="Remover"
                  variant="danger"
                  style={{ paddingVertical: 7, paddingHorizontal: 12 }}
                  onPress={() => act({ action: 'remove', username: f.username })}
                />
              </View>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
