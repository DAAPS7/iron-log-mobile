/**
 * Criação/edição de um plano alimentar: nome + refeições, cada uma com os
 * seus alimentos (por pesquisa, dos teus alimentos guardados, ou manual).
 */

import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Body, Button, Field, Input, Note, SegmentedControl } from './ui';
import { useTheme } from '../context/ThemeContext';
import { uid } from '../lib/defaults';
import { computeMealTotals, parseOffProduct } from '../lib/nutrition';
import * as api from '../api/client';

function blankMeal() {
  return { id: uid(), name: '', foods: [] };
}

export default function MealPlanBuilderModal({ visible, onClose, plan, customFoods, onSave }) {
  const theme = useTheme();
  const [name, setName] = useState(plan?.name || '');
  const [meals, setMeals] = useState(plan?.meals?.length ? plan.meals : [blankMeal()]);
  const [addingToMeal, setAddingToMeal] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (visible) {
      setName(plan?.name || '');
      setMeals(plan?.meals?.length ? plan.meals : [blankMeal()]);
      setAddingToMeal(null);
      setError(null);
    }
  }, [visible, plan]);

  function moveMeal(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= meals.length) return;
    setMeals((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function addFoodToMeal(mealIndex, foodPer100, grams) {
    setMeals((prev) =>
      prev.map((m, i) =>
        i === mealIndex
          ? { ...m, foods: [...m.foods, { ...foodPer100, quantity: grams }] }
          : m,
      ),
    );
    setAddingToMeal(null);
  }

  function save() {
    if (!name.trim()) return setError('Dá um nome ao plano.');
    const cleanMeals = meals.filter((m) => m.name.trim() && m.foods.length);
    if (!cleanMeals.length) {
      return setError('Cada refeição precisa de nome e pelo menos um alimento.');
    }
    onSave({ id: plan?.id || uid(), name: name.trim(), meals: cleanMeals });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
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
                {plan ? 'Editar Plano' : 'Criar Plano'}
              </Text>
              <Pressable onPress={onClose}>
                <Text style={{ fontSize: 18, color: theme.colors.muted }}>✕</Text>
              </Pressable>
            </View>

            <Field label="Nome do plano">
              <Input value={name} onChangeText={setName} placeholder="Ex: Dia de treino" />
            </Field>

            {meals.map((meal, mi) => {
              const mealTotals = computeMealTotals(meal);
              return (
                <View
                  key={meal.id}
                  style={{
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radiusSm,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Note>Refeição {mi + 1}</Note>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <Pressable onPress={() => moveMeal(mi, -1)} disabled={mi === 0}>
                        <Text style={{ color: mi === 0 ? theme.colors.border : theme.colors.muted }}>↑</Text>
                      </Pressable>
                      <Pressable onPress={() => moveMeal(mi, 1)} disabled={mi === meals.length - 1}>
                        <Text
                          style={{
                            color: mi === meals.length - 1 ? theme.colors.border : theme.colors.muted,
                          }}
                        >
                          ↓
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setMeals((prev) => prev.filter((_, i) => i !== mi))}
                      >
                        <Text style={{ color: theme.colors.danger }}>✕</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Input
                    value={meal.name}
                    onChangeText={(v) =>
                      setMeals((prev) =>
                        prev.map((m, i) => (i === mi ? { ...m, name: v } : m)),
                      )
                    }
                    placeholder="Ex: Pequeno-almoço"
                    style={{ marginBottom: 8 }}
                  />

                  {meal.foods.length ? (
                    <Note style={{ marginBottom: 8 }}>
                      Total: {mealTotals.calories} kcal · P:{mealTotals.protein}g H:
                      {mealTotals.carbs}g G:{mealTotals.fat}g
                    </Note>
                  ) : null}

                  {meal.foods.map((f, fi) => (
                    <View
                      key={fi}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 6,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.bgSoft,
                      }}
                    >
                      <Body style={{ flex: 1 }}>
                        {f.name} ({f.quantity}g)
                      </Body>
                      <Pressable
                        onPress={() =>
                          setMeals((prev) =>
                            prev.map((m, i) =>
                              i === mi
                                ? { ...m, foods: m.foods.filter((_, x) => x !== fi) }
                                : m,
                            ),
                          )
                        }
                      >
                        <Text style={{ color: theme.colors.danger }}>✕</Text>
                      </Pressable>
                    </View>
                  ))}

                  {addingToMeal === mi ? (
                    <MealFoodAdder
                      customFoods={customFoods}
                      onPick={(food, grams) => addFoodToMeal(mi, food, grams)}
                      onCancel={() => setAddingToMeal(null)}
                    />
                  ) : (
                    <Button
                      title="+ Adicionar alimento"
                      variant="ghost"
                      onPress={() => setAddingToMeal(mi)}
                      style={{ marginTop: 8 }}
                    />
                  )}
                </View>
              );
            })}

            <Button
              title="+ Adicionar refeição"
              variant="ghost"
              onPress={() => setMeals((prev) => [...prev, blankMeal()])}
              style={{ marginBottom: 14 }}
            />

            {error ? <Body color={theme.colors.danger}>{error}</Body> : null}

            <Button title="Guardar plano" variant="strength" onPress={save} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Escolher um alimento (pesquisa / guardados / manual) para juntar a uma refeição. */
function MealFoodAdder({ customFoods, onPick, onCancel }) {
  const theme = useTheme();
  const [mode, setMode] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState('100');

  const [mName, setMName] = useState('');
  const [mCal, setMCal] = useState('');
  const [mProtein, setMProtein] = useState('');
  const [mCarbs, setMCarbs] = useState('');
  const [mFat, setMFat] = useState('');

  async function search() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setStatus(null);
    try {
      const json = await api.searchFood(query.trim());
      const hits = Array.isArray(json.hits) ? json.hits : json.hits?.hits || [];
      const parsed = hits
        .map((h) => h._source || h)
        .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
        .map(parseOffProduct)
        .slice(0, 8);
      setResults(parsed);
      if (!parsed.length) setStatus('Sem resultados.');
    } catch (e) {
      setStatus('Pesquisa falhou — tenta os teus alimentos ou manual.');
    } finally {
      setLoading(false);
    }
  }

  function confirmSelected() {
    const g = parseFloat(String(grams).replace(',', '.')) || 100;
    onPick(selected, g);
  }

  function confirmManual() {
    const cal = parseFloat(mCal);
    if (!mName.trim() || isNaN(cal)) return;
    onPick(
      {
        name: mName.trim(),
        calories: cal,
        protein: parseFloat(mProtein) || 0,
        carbs: parseFloat(mCarbs) || 0,
        fat: parseFloat(mFat) || 0,
      },
      100,
    );
  }

  return (
    <View
      style={{
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }}
    >
      <SegmentedControl
        value={mode}
        onChange={(v) => {
          setMode(v);
          setSelected(null);
        }}
        options={[
          { value: 'search', label: 'Pesquisar' },
          { value: 'custom', label: 'Guardados' },
          { value: 'manual', label: 'Manual' },
        ]}
      />

      {mode === 'search' ? (
        selected ? (
          <View style={{ marginTop: 10 }}>
            <Body style={{ fontFamily: theme.font.bodyBold }}>{selected.name}</Body>
            <Field label="Quantidade (g)">
              <Input value={grams} onChangeText={setGrams} keyboardType="number-pad" />
            </Field>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Adicionar" variant="strength" onPress={confirmSelected} style={{ flex: 1 }} />
              <Button title="Cancelar" variant="ghost" onPress={() => setSelected(null)} style={{ flex: 1 }} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Input value={query} onChangeText={setQuery} placeholder="Ex: arroz" style={{ flex: 1 }} />
              <Button title="Ir" variant="ghost" onPress={search} loading={loading} />
            </View>
            {status ? <Note style={{ marginTop: 6 }}>{status}</Note> : null}
            {results.map((r, i) => (
              <Pressable
                key={i}
                onPress={() => setSelected(r)}
                style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.bgSoft }}
              >
                <Body>{r.name}</Body>
                <Note>{r.calories} kcal /100g</Note>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {mode === 'custom' ? (
        selected ? (
          <View style={{ marginTop: 10 }}>
            <Body style={{ fontFamily: theme.font.bodyBold }}>{selected.name}</Body>
            <Field label="Quantidade (g)">
              <Input value={grams} onChangeText={setGrams} keyboardType="number-pad" />
            </Field>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Adicionar" variant="strength" onPress={confirmSelected} style={{ flex: 1 }} />
              <Button title="Cancelar" variant="ghost" onPress={() => setSelected(null)} style={{ flex: 1 }} />
            </View>
          </View>
        ) : !customFoods.length ? (
          <Note style={{ marginTop: 10 }}>
            Ainda não guardaste nenhum alimento personalizado.
          </Note>
        ) : (
          <View style={{ marginTop: 10 }}>
            {customFoods.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setSelected(f)}
                style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.bgSoft }}
              >
                <Body>{f.name}</Body>
                <Note>{f.calories} kcal /100g</Note>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {mode === 'manual' ? (
        <View style={{ marginTop: 10 }}>
          <Field label="Nome">
            <Input value={mName} onChangeText={setMName} />
          </Field>
          <Field label="Calorias (para a quantidade que vais usar)">
            <Input value={mCal} onChangeText={setMCal} keyboardType="number-pad" />
          </Field>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Field label="Proteína" flex>
              <Input value={mProtein} onChangeText={setMProtein} keyboardType="decimal-pad" />
            </Field>
            <Field label="Hidratos" flex>
              <Input value={mCarbs} onChangeText={setMCarbs} keyboardType="decimal-pad" />
            </Field>
            <Field label="Gordura" flex>
              <Input value={mFat} onChangeText={setMFat} keyboardType="decimal-pad" />
            </Field>
          </View>
          <Button title="Adicionar" variant="strength" onPress={confirmManual} />
        </View>
      ) : null}

      <Button title="Fechar" variant="ghost" onPress={onCancel} style={{ marginTop: 8 }} />
    </View>
  );
}
