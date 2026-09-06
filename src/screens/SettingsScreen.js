import React from 'react';
import { Alert } from 'react-native';

import {
  Button,
  Card,
  CardTitle,
  Field,
  Note,
  Screen,
  SegmentedControl,
} from '../components/ui';
import { useStore } from '../context/StoreContext';

export default function SettingsScreen() {
  const { settings, updateSettings, signOut, username, syncState } = useStore();

  return (
    <Screen>
      <Card>
        <CardTitle>Aparência</CardTitle>
        <Field label="Tema">
          <SegmentedControl
            value={settings.theme}
            onChange={(theme) => updateSettings((prev) => ({ ...prev, theme }))}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' },
            ]}
          />
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
          onPress={() =>
            Alert.alert('Terminar sessão', 'Queres mesmo sair?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: signOut },
            ])
          }
        />
      </Card>
    </Screen>
  );
}
