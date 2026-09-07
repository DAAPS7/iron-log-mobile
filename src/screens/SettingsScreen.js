import React from 'react';
import { Pressable, View } from 'react-native';

import {
  Body,
  Button,
  Card,
  CardTitle,
  Field,
  Note,
  Screen,
  SegmentedControl,
} from '../components/ui';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { FONT_OPTIONS, PALETTE_OPTIONS } from '../theme/theme';
import { confirmAsync } from '../lib/confirm';

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateSettings, signOut, username, syncState } = useStore();

  return (
    <Screen>
      <Card>
        <CardTitle>Aparência</CardTitle>
        <Field label="Tema">
          <SegmentedControl
            value={settings.theme}
            onChange={(v) => updateSettings((prev) => ({ ...prev, theme: v }))}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' },
              { value: 'black', label: 'Preto' },
            ]}
          />
        </Field>

        <Field label="Tipografia">
          {FONT_OPTIONS.map((f) => {
            const active = settings.font === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => updateSettings((prev) => ({ ...prev, font: f.key }))}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: theme.radiusSm,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.ink : theme.colors.border,
                  marginBottom: 8,
                }}
              >
                <Body style={{ fontFamily: f.display }}>{f.label}</Body>
                {active ? <Body>✓</Body> : null}
              </Pressable>
            );
          })}
        </Field>

        <Field label="Paleta de cor">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PALETTE_OPTIONS.map((p) => {
              const active = settings.palette === p.key;
              const swatch = theme.mode !== 'light' ? p.dark : p.light;
              return (
                <Pressable
                  key={p.key}
                  onPress={() =>
                    updateSettings((prev) => ({ ...prev, palette: p.key }))
                  }
                  style={{
                    flexBasis: '48%',
                    padding: 10,
                    borderRadius: theme.radiusSm,
                    borderWidth: 1.5,
                    borderColor: active ? theme.colors.ink : theme.colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                    {[swatch.strength, swatch.cardio, swatch.gold, swatch.info].map(
                      (c) => (
                        <View
                          key={c}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            backgroundColor: c,
                          }}
                        />
                      ),
                    )}
                  </View>
                  <Note color={theme.colors.ink}>{p.label}</Note>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Note>A preferência é guardada na conta e acompanha-te no site.</Note>
      </Card>

      <Card>
        <CardTitle>Sincronização</CardTitle>
        <Note>
          {syncState === 'saving'
            ? 'A guardar…'
            : syncState === 'offline'
              ? 'Sem ligação — guardado localmente. Sincroniza quando houver rede.'
              : 'Tudo sincronizado com o servidor.'}
        </Note>
      </Card>

      <Card>
        <CardTitle>Conta</CardTitle>
        <Note style={{ marginBottom: 12 }}>Sessão iniciada como {username}.</Note>
        <Button
          title="Terminar sessão"
          variant="danger"
          onPress={async () => {
            const ok = await confirmAsync('Terminar sessão', 'Queres mesmo sair?', 'Sair');
            if (ok) signOut();
          }}
        />
      </Card>
    </Screen>
  );
}
