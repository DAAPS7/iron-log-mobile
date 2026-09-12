/**
 * Detalhe de micronutrientes do dia.
 *
 * Antes era um cartão próprio sempre visível; passou a viver aqui, aberto a
 * partir do toque no resumo diário — a informação continua a existir, só
 * deixa de competir por espaço no ecrã principal com o que é olhado a toda
 * a hora (calorias e macros).
 */

import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Note } from './ui';
import { useTheme } from '../context/ThemeContext';
import { MICRO_FIELDS } from '../lib/nutrition';

export default function MicronutrientModal({ visible, onClose, totals }) {
  const theme = useTheme();
  const hasAny = MICRO_FIELDS.some((m) => totals[m.key] > 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.scrim, justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderTopLeftRadius: theme.radii.xl,
            borderTopRightRadius: theme.radii.xl,
            maxHeight: '75%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.space.lg,
              paddingBottom: theme.space.sm,
            }}
          >
            <Text
              style={{
                fontFamily: theme.font.display,
                ...theme.type.h3,
                color: theme.colors.textPrimary,
              }}
            >
              Micronutrientes do dia
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={{ fontSize: 18, color: theme.colors.textMuted }}>✕</Text>
            </Pressable>
          </View>

          {!hasAny ? (
            <Note style={{ padding: theme.space.lg, paddingTop: 0 }}>
              Ainda sem dados para hoje — alimentos pesquisados na Open Food
              Facts trazem estes valores automaticamente quando disponíveis.
            </Note>
          ) : (
            <ScrollView contentContainerStyle={{ padding: theme.space.lg, paddingTop: 0 }}>
              {MICRO_FIELDS.map((m, i) => (
                <View
                  key={m.key}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 11,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: theme.colors.hairline,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: theme.font.body,
                      ...theme.type.body,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {m.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.font.bodyBold,
                      ...theme.type.body,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {totals[m.key]}
                    {m.unit}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
