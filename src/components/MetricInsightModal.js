/**
 * Modal de insights + definição de meta para uma métrica de perfil.
 * Equivalente ao openMetricInsight() da versão web.
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Body, Button, Field, Input, Note } from './ui';
import { useTheme } from '../context/ThemeContext';

export default function MetricInsightModal({ visible, onClose, metric, context, onSaveGoal }) {
  const theme = useTheme();
  if (!metric) return null;

  const content = {
    bodyfat: {
      title: 'Gordura Corporal',
      paragraphs: [
        'Esta é uma estimativa (método da Marinha dos EUA) baseada nas medidas que introduziste — não substitui uma avaliação profissional (ex: bioimpedância ou DEXA), mas serve bem para acompanhar tendências ao longo do tempo.',
        'A percentagem de gordura tende a descer de forma sustentável com treino de força regular, alguma atividade cardiovascular, e um défice calórico moderado e consistente. Métodos extremos ou mudanças muito rápidas costumam ser difíceis de manter — fala com um profissional de saúde antes de perseguires um objetivo agressivo.',
      ],
      goalKey: 'bodyFat',
      goalLabel: 'Gordura alvo (%)',
      currentValue: context.bf,
      unit: '%',
    },
    bmr: {
      title: 'Metabolismo Basal (BMR)',
      paragraphs: [
        'O BMR é uma estimativa das calorias que o teu corpo gasta em repouso completo, só para manter as funções vitais — não inclui a energia que gastas a mexer-te ao longo do dia.',
        'Depende sobretudo da tua massa muscular, idade, altura e peso. Não é algo que se "melhore" diretamente, mas manter ou aumentar massa muscular através de treino de força tende a sustentar (ou aumentar ligeiramente) este valor ao longo do tempo.',
        'Costuma ser usado como ponto de partida para estimar as tuas necessidades calóricas totais, juntando depois o teu nível de atividade física.',
      ],
      goalKey: null, // BMR não é uma meta que se defina diretamente
    },
    weight: {
      title: 'Peso Corporal',
      paragraphs: [
        'O teu peso pode variar de dia para dia por razões normais (hidratação, alimentação, sono) — o que importa é a tendência ao longo de várias semanas, não um valor isolado.',
        'Uma referência geralmente considerada sustentável é uma variação de cerca de 0.25% a 1% do peso corporal por semana. Ritmos muito mais rápidos tendem a ser difíceis de manter — fala com um profissional de saúde para uma orientação personalizada.',
      ],
      goalKey: 'weight',
      goalLabel: 'Peso alvo (kg)',
      currentValue: context.weight,
      unit: 'kg',
    },
  }[metric];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.font.display,
                  fontSize: 20,
                  color: theme.colors.ink,
                  textTransform: 'uppercase',
                }}
              >
                {content.title}
              </Text>
              <Pressable onPress={onClose}>
                <Text style={{ fontSize: 18, color: theme.colors.muted }}>✕</Text>
              </Pressable>
            </View>

            {content.paragraphs.map((p, i) => (
              <Note key={i} style={{ marginBottom: 10 }}>
                {p}
              </Note>
            ))}

            {content.goalKey ? (
              <GoalForm
                goalKey={content.goalKey}
                label={content.goalLabel}
                unit={content.unit}
                currentValue={content.currentValue}
                initialGoal={context.metricGoals?.[content.goalKey]}
                onSave={(goal) => onSaveGoal(content.goalKey, goal)}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function GoalForm({ goalKey, label, unit, currentValue, initialGoal, onSave }) {
  const theme = useTheme();
  const [target, setTarget] = useState(
    initialGoal?.target != null ? String(initialGoal.target) : '',
  );
  const [targetDate, setTargetDate] = useState(initialGoal?.targetDate || '');

  const targetNum = parseFloat(String(target).replace(',', '.'));
  let progressNote = null;
  if (currentValue != null && !isNaN(targetNum)) {
    const diff = Math.round((currentValue - targetNum) * 10) / 10;
    if (diff === 0) {
      progressNote = 'Já estás na tua meta!';
    } else {
      let dateNote = '';
      if (targetDate) {
        const daysLeft = Math.ceil(
          (new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24),
        );
        if (daysLeft > 0) {
          const weeklyRate = Math.abs(diff) / (daysLeft / 7);
          dateNote = ` Faltam ${daysLeft} dia(s) — uma média de ≈${Math.round(weeklyRate * 100) / 100} ${unit}/semana.`;
        } else {
          dateNote = ' A data alvo já passou.';
        }
      }
      progressNote = `Faltam ${Math.abs(diff)} ${unit} para a meta.${dateNote}`;
    }
  }

  return (
    <View style={{ marginTop: theme.spacing.sm }}>
      <Text
        style={{
          fontFamily: theme.font.bodyBold,
          fontSize: 11,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: theme.colors.muted,
          marginBottom: 10,
        }}
      >
        Definir meta (opcional)
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label={label} flex>
          <Input value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
        </Field>
        <Field label="Data alvo (AAAA-MM-DD)" flex>
          <Input value={targetDate} onChangeText={setTargetDate} placeholder="2026-12-01" />
        </Field>
      </View>
      {progressNote ? <Note style={{ marginBottom: 10 }}>{progressNote}</Note> : null}
      <Button
        title="Guardar meta"
        variant="strength"
        onPress={() =>
          onSave({
            target: isNaN(targetNum) ? null : targetNum,
            targetDate: targetDate || null,
          })
        }
      />
    </View>
  );
}
