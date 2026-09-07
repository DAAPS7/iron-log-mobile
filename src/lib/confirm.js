/**
 * Alert.alert() do React Native não tem efeito nenhum no browser (versão
 * web via react-native-web) — o diálogo simplesmente não aparece, e
 * qualquer ação que dependa da confirmação nunca chega a correr.
 *
 * Estas duas funções tratam disso: usam window.confirm/alert no browser, e
 * o Alert nativo em iOS/Android.
 */

import { Alert, Platform } from 'react-native';

/** Pede confirmação. Devolve uma Promise<boolean> — true se confirmado. */
export function confirmAsync(title, message, confirmLabel = 'Confirmar') {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Mostra uma mensagem informativa (sem opção de cancelar). */
export function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
