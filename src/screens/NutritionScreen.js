import React, { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import {
  BigStat,
  Body,
  Button,
  Card,
  CardTitle,
  Field,
  Input,
  Note,
  ProgressBar,
  Screen,
  ScreenTitle,
} from '../components/ui';
import MealPlanBuilderModal from '../components/MealPlanBuilderModal';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { caloriesFromMacros } from '../lib/biometrics';
import { uid } from '../lib/defaults';
import { computeDayTotals, computeFoodTotals, computeMealTotals, MICRO_FIELDS, parseOffProduct } from '../lib/nutrition';
import * as api from '../api/client';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionScreen() {
  const theme = useTheme();
  const { data, updateData } = useStore();
  const [date, setDate] = useState(todayISO());
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const entries = useMemo(
    () => (data?.calorieEntries || []).filter((e) => e.date === date),
    [data?.calorieEntries, date],
  );

  if (!data) return null;

  const totals = computeDayTotals(entries);
  const goal = data.calorieGoal;
  const macroGoals = data.macroGoals || {};
  const customFoods = data.customFoods || [];
  const mealPlans = data.mealPlans || [];

  function shiftDate(delta) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  }

  function addEntry(entry) {
    updateData((prev) => ({
      ...prev,
      calorieEntries: [...prev.calorieEntries, { ...entry, id: uid(), date }],
    }));
  }

  function removeEntry(id) {
    updateData((prev) => ({
      ...prev,
      calorieEntries: prev.calorieEntries.filter((e) => e.id !== id),
    }));
  }

  function saveCustomFood(food) {
    updateData((prev) => ({
      ...prev,
      customFoods: [...(prev.customFoods || []), { ...food, id: uid() }],
    }));
  }

  function removeCustomFood(id) {
    updateData((prev) => ({
      ...prev,
      customFoods: (prev.customFoods || []).filter((f) => f.id !== id),
    }));
  }

  function addMealToDay(meal) {
    const newEntries = meal.foods.map((f) => ({
      ...computeFoodTotals(f, f.quantity),
      name: f.name,
      id: uid(),
      date,
    }));
    updateData((prev) => ({
      ...prev,
      calorieEntries: [...prev.calorieEntries, ...newEntries],
    }));
  }

  function savePlan(plan) {
    updateData((prev) => {
      const exists = (prev.mealPlans || []).some((p) => p.id === plan.id);
      return {
        ...prev,
        mealPlans: exists
          ? prev.mealPlans.map((p) => (p.id === plan.id ? plan : p))
          : [...(prev.mealPlans || []), plan],
      };
    });
    setPlanModalOpen(false);
    setEditingPlan(null);
  }

  function removePlan(id) {
    Alert.alert('Apagar plano', 'Queres mesmo apagar este plano alimentar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () =>
          updateData((prev) => ({
            ...prev,
            mealPlans: (prev.mealPlans || []).filter((p) => p.id !== id),
          })),
      },
    ]);
  }

  const hasMicros = MICRO_FIELDS.some((m) => totals[m.key] > 0);

  return (
    <Screen>
      <ScreenTitle subtitle="Regista o que comes e acompanha as tuas metas.">
        Nutrição
      </ScreenTitle>

      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Button title="←" variant="ghost" onPress={() => shiftDate(-1)} style={{ paddingHorizontal: 16 }} />
          <Note>{new Date(`${date}T00:00:00`).toLocaleDateString('pt-PT')}</Note>
          <Button title="→" variant="ghost" onPress={() => shiftDate(1)} style={{ paddingHorizontal: 16 }} />
        </View>

        <BigStat
          value={totals.calories}
          unit={goal ? `kcal de ${goal}` : 'kcal'}
          color={theme.colors.gold}
        />
        {goal ? (
          <View style={{ marginTop: 10 }}>
            <ProgressBar value={totals.calories} goal={goal} color={theme.colors.gold} unit="" />
            <Note>
              {totals.calories <= goal
                ? `Faltam ${goal - totals.calories} kcal para a meta.`
                : `${totals.calories - goal} kcal acima da meta.`}
            </Note>
          </View>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Macros do dia</CardTitle>
        <ProgressBar label="Proteína" value={totals.protein} goal={macroGoals.protein} color={theme.colors.strength} />
        <ProgressBar label="Hidratos" value={totals.carbs} goal={macroGoals.carbs} color={theme.colors.cardio} />
        <ProgressBar label="Gordura" value={totals.fat} goal={macroGoals.fat} color={theme.colors.gold} />
      </Card>

      {hasMicros ? (
        <Card>
          <CardTitle>Micronutrientes do dia</CardTitle>
          {MICRO_FIELDS.map((m) => (
            <View
              key={m.key}
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
            >
              <Note>{m.label}</Note>
              <Note color={theme.colors.ink}>
                {totals[m.key]}
                {m.unit}
              </Note>
            </View>
          ))}
        </Card>
      ) : null}

      <GoalsCard
        goal={goal}
        macroGoals={macroGoals}
        onSave={(cal, macros) =>
          updateData((prev) => ({ ...prev, calorieGoal: cal, macroGoals: macros }))
        }
      />

      <FoodSearchCard onAdd={addEntry} onSaveCustomFood={saveCustomFood} />

      <CustomFoodsCard foods={customFoods} onAdd={addEntry} onSave={saveCustomFood} onRemove={removeCustomFood} />

      <QuickAddCard onAdd={addEntry} />

      <Card>
        <CardTitle
          right={
            <Button
              title="+ Criar plano"
              variant="ghost"
              onPress={() => {
                setEditingPlan(null);
                setPlanModalOpen(true);
              }}
              style={{ paddingVertical: 6, paddingHorizontal: 12 }}
            />
          }
        >
          Planos Alimentares
        </CardTitle>
        {!mealPlans.length ? (
          <Note>Ainda sem planos. Cria um para montares refeições completas de uma vez.</Note>
        ) : (
          mealPlans.map((plan) => (
            <View
              key={plan.id}
              style={{
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: theme.colors.bgSoft,
              }}
            >
              <Body style={{ fontFamily: theme.font.bodyBold }}>{plan.name}</Body>
              {plan.meals.map((meal) => {
                const t = computeMealTotals(meal);
                return (
                  <View
                    key={meal.id}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 6,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Note color={theme.colors.ink}>{meal.name}</Note>
                      <Note>
                        {t.calories} kcal · P:{t.protein}g H:{t.carbs}g G:{t.fat}g
                      </Note>
                    </View>
                    <Button
                      title="Ao dia"
                      variant="ghost"
                      onPress={() => addMealToDay(meal)}
                      style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                    />
                  </View>
                );
              })}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Button
                  title="Editar"
                  variant="ghost"
                  onPress={() => {
                    setEditingPlan(plan);
                    setPlanModalOpen(true);
                  }}
                  style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                />
                <Button
                  title="Apagar"
                  variant="danger"
                  onPress={() => removePlan(plan.id)}
                  style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardTitle>Registos de hoje</CardTitle>
        {!entries.length ? (
          <Note>Ainda sem registos neste dia.</Note>
        ) : (
          entries.map((e, i) => (
            <View
              key={e.id}
              style={{
                paddingVertical: 9,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: theme.colors.bgSoft,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Body style={{ flex: 1 }}>{e.name}</Body>
                <Note>{e.calories} kcal</Note>
              </View>
              {e.protein || e.carbs || e.fat ? (
                <Note>
                  P:{Math.round(e.protein || 0)}g H:{Math.round(e.carbs || 0)}g G:
                  {Math.round(e.fat || 0)}g
                </Note>
              ) : null}
              <Pressable onPress={() => removeEntry(e.id)}>
                <Note color={theme.colors.danger}>Apagar</Note>
              </Pressable>
            </View>
          ))
        )}
      </Card>

      <MealPlanBuilderModal
        visible={planModalOpen}
        plan={editingPlan}
        customFoods={customFoods}
        onClose={() => {
          setPlanModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={savePlan}
      />
    </Screen>
  );
}

/** Metas de calorias e macros, com o total calórico dos macros calculado. */
function GoalsCard({ goal, macroGoals, onSave }) {
  const [cal, setCal] = useState(goal != null ? String(goal) : '');
  const [protein, setProtein] = useState(macroGoals.protein != null ? String(macroGoals.protein) : '');
  const [carbs, setCarbs] = useState(macroGoals.carbs != null ? String(macroGoals.carbs) : '');
  const [fat, setFat] = useState(macroGoals.fat != null ? String(macroGoals.fat) : '');

  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) || n <= 0 ? null : Math.round(n);
  };

  const macroKcal = caloriesFromMacros({
    protein: num(protein) || 0,
    carbs: num(carbs) || 0,
    fat: num(fat) || 0,
  });
  const calGoal = num(cal);

  return (
    <Card>
      <CardTitle>Metas (opcionais)</CardTitle>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Calorias" flex>
          <Input value={cal} onChangeText={setCal} keyboardType="number-pad" placeholder="2200" />
        </Field>
        <Field label="Proteína (g)" flex>
          <Input value={protein} onChangeText={setProtein} keyboardType="number-pad" placeholder="150" />
        </Field>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Hidratos (g)" flex>
          <Input value={carbs} onChangeText={setCarbs} keyboardType="number-pad" placeholder="220" />
        </Field>
        <Field label="Gordura (g)" flex>
          <Input value={fat} onChangeText={setFat} keyboardType="number-pad" placeholder="70" />
        </Field>
      </View>

      {macroKcal > 0 ? (
        <Note style={{ marginBottom: 10 }}>
          Estes macros correspondem a ≈ {macroKcal} kcal.
          {calGoal
            ? Math.abs(macroKcal - calGoal) > 15
              ? macroKcal > calGoal
                ? ` Isso é ${macroKcal - calGoal} kcal acima da meta de calorias.`
                : ` Isso é ${calGoal - macroKcal} kcal abaixo da meta de calorias.`
              : ' Está alinhado com a tua meta de calorias.'
            : ''}
        </Note>
      ) : null}

      <Button
        title="Guardar metas"
        variant="ghost"
        onPress={() =>
          onSave(calGoal, {
            protein: num(protein),
            carbs: num(carbs),
            fat: num(fat),
          })
        }
      />
    </Card>
  );
}

/** Pesquisa na Open Food Facts (via proxy do nosso Worker). */
function FoodSearchCard({ onAdd, onSaveCustomFood }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(null);
  const [grams, setGrams] = useState('100');
  const [saved, setSaved] = useState(false);

  async function search() {
    if (query.trim().length < 2) return;
    setLoading(true);
    setStatus(null);
    setResults([]);
    try {
      const json = await api.searchFood(query.trim());
      const hits = Array.isArray(json.hits) ? json.hits : json.hits?.hits || [];
      const parsed = hits
        .map((h) => h._source || h)
        .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
        .map(parseOffProduct)
        .slice(0, 10);
      setResults(parsed);
      if (!parsed.length) setStatus('Sem resultados. Tenta outro termo.');
    } catch (e) {
      setStatus('Não foi possível pesquisar agora. Podes adicionar manualmente.');
    } finally {
      setLoading(false);
    }
  }

  const preview = picked ? computeFoodTotals(picked, parseFloat(grams) || 0) : null;

  return (
    <Card>
      <CardTitle>Pesquisar alimento</CardTitle>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Ex: iogurte natural"
          style={{ flex: 1 }}
        />
        <Button title="Ir" variant="ghost" onPress={search} loading={loading} />
      </View>

      {status ? <Note style={{ marginTop: 8 }}>{status}</Note> : null}

      {results.map((r, i) => (
        <Pressable
          key={i}
          onPress={() => {
            setPicked(r);
            setSaved(false);
          }}
          style={{
            paddingVertical: 9,
            borderTopWidth: 1,
            borderTopColor: theme.colors.bgSoft,
          }}
        >
          <Body>{r.name}</Body>
          <Note>
            {r.brand ? `${r.brand} · ` : ''}
            {r.calories} kcal · P:{r.protein}g H:{r.carbs}g G:{r.fat}g /100g
          </Note>
        </Pressable>
      ))}

      {picked ? (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 }}>
          <Body style={{ fontFamily: theme.font.bodyBold }}>{picked.name}</Body>
          <Field label="Quantidade (g)">
            <Input value={grams} onChangeText={setGrams} keyboardType="number-pad" />
          </Field>
          {preview ? (
            <Note style={{ marginBottom: 10 }}>
              ≈ {preview.calories} kcal · P:{preview.protein}g H:{preview.carbs}g G:{preview.fat}g
            </Note>
          ) : null}
          <Button
            title="+ Adicionar ao dia"
            variant="strength"
            onPress={() => {
              onAdd({ name: picked.name, ...preview });
              setPicked(null);
              setResults([]);
              setQuery('');
            }}
          />
          <Button
            title={saved ? '✓ Guardado nos teus alimentos' : 'Guardar como meu alimento'}
            variant="ghost"
            disabled={saved}
            onPress={() => {
              onSaveCustomFood(picked);
              setSaved(true);
            }}
            style={{ marginTop: 8 }}
          />
        </View>
      ) : null}
    </Card>
  );
}

/** Alimentos guardados pelo utilizador — pesquisados, ou que nunca apareceram na pesquisa. */
function CustomFoodsCard({ foods, onAdd, onSave, onRemove }) {
  const theme = useTheme();
  const [creating, setCreating] = useState(false);
  const [usingId, setUsingId] = useState(null);
  const [grams, setGrams] = useState('100');

  const inUse = foods.find((f) => f.id === usingId);
  const preview = inUse ? computeFoodTotals(inUse, parseFloat(grams) || 0) : null;

  return (
    <Card>
      <CardTitle
        right={
          <Button
            title={creating ? 'Cancelar' : '+ Criar alimento'}
            variant="ghost"
            onPress={() => setCreating((c) => !c)}
            style={{ paddingVertical: 6, paddingHorizontal: 12 }}
          />
        }
      >
        Meus Alimentos
      </CardTitle>

      {creating ? (
        <CustomFoodForm
          onSave={(food) => {
            onSave(food);
            setCreating(false);
          }}
        />
      ) : null}

      {!foods.length ? (
        <Note>
          Ainda não tens alimentos guardados. Usa "Guardar como meu alimento" numa
          pesquisa, ou cria um diretamente aqui — útil para alimentos que não
          aparecem na Open Food Facts.
        </Note>
      ) : (
        foods.map((f) => (
          <View
            key={f.id}
            style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: theme.colors.bgSoft }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Body>{f.name}</Body>
                <Note>
                  {f.calories} kcal · P:{f.protein}g H:{f.carbs}g G:{f.fat}g /100g
                </Note>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  title="Usar"
                  variant="ghost"
                  onPress={() => setUsingId(usingId === f.id ? null : f.id)}
                  style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                />
                <Button
                  title="✕"
                  variant="danger"
                  onPress={() => onRemove(f.id)}
                  style={{ paddingVertical: 6, paddingHorizontal: 12 }}
                />
              </View>
            </View>

            {usingId === f.id ? (
              <View style={{ marginTop: 8 }}>
                <Field label="Quantidade (g)">
                  <Input value={grams} onChangeText={setGrams} keyboardType="number-pad" />
                </Field>
                {preview ? (
                  <Note style={{ marginBottom: 8 }}>
                    ≈ {preview.calories} kcal · P:{preview.protein}g H:{preview.carbs}g G:
                    {preview.fat}g
                  </Note>
                ) : null}
                <Button
                  title="+ Adicionar ao dia"
                  variant="strength"
                  onPress={() => {
                    onAdd({ name: f.name, ...preview });
                    setUsingId(null);
                  }}
                />
              </View>
            ) : null}
          </View>
        ))
      )}
    </Card>
  );
}

/** Formulário de criação de um alimento personalizado (com micronutrientes opcionais). */
function CustomFoodForm({ onSave }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showMicros, setShowMicros] = useState(false);
  const [micros, setMicros] = useState({});

  const theme = useTheme();

  return (
    <View
      style={{
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.radiusSm,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Field label="Nome">
        <Input value={name} onChangeText={setName} placeholder="Ex: Bolo da avó" />
      </Field>
      <Field label="Marca (opcional)">
        <Input value={brand} onChangeText={setBrand} />
      </Field>
      <Note style={{ marginBottom: 8 }}>Valores por 100g:</Note>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field label="Calorias" flex>
          <Input value={calories} onChangeText={setCalories} keyboardType="number-pad" />
        </Field>
        <Field label="Proteína" flex>
          <Input value={protein} onChangeText={setProtein} keyboardType="decimal-pad" />
        </Field>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field label="Hidratos" flex>
          <Input value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" />
        </Field>
        <Field label="Gordura" flex>
          <Input value={fat} onChangeText={setFat} keyboardType="decimal-pad" />
        </Field>
      </View>

      <Pressable onPress={() => setShowMicros((s) => !s)} style={{ marginBottom: 8 }}>
        <Note color={theme.colors.ink}>
          {showMicros ? '▴' : '▾'} Micronutrientes (opcional)
        </Note>
      </Pressable>
      {showMicros
        ? MICRO_FIELDS.map((m) => (
            <Field key={m.key} label={`${m.label} (${m.unit})`}>
              <Input
                value={micros[m.key] || ''}
                onChangeText={(v) => setMicros((prev) => ({ ...prev, [m.key]: v }))}
                keyboardType="decimal-pad"
              />
            </Field>
          ))
        : null}

      <Button
        title="Guardar alimento"
        variant="strength"
        onPress={() => {
          const cal = parseFloat(calories);
          if (!name.trim() || isNaN(cal)) return;
          const food = {
            name: name.trim(),
            brand: brand.trim(),
            calories: cal,
            protein: parseFloat(protein) || 0,
            carbs: parseFloat(carbs) || 0,
            fat: parseFloat(fat) || 0,
          };
          MICRO_FIELDS.forEach((m) => {
            food[m.key] = parseFloat(micros[m.key]) || 0;
          });
          onSave(food);
        }}
      />
    </View>
  );
}

/** Registo manual rápido, sem pesquisa nem gravação para reutilização. */
function QuickAddCard({ onAdd }) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [showMicros, setShowMicros] = useState(false);
  const [micros, setMicros] = useState({});

  const num = (v) => {
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  };

  return (
    <Card>
      <CardTitle>Registo rápido</CardTitle>
      <Field label="Alimento / refeição">
        <Input value={name} onChangeText={setName} placeholder="Ex: Almoço" />
      </Field>
      <Field label="Calorias (kcal)">
        <Input value={calories} onChangeText={setCalories} keyboardType="number-pad" />
      </Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="Proteína" flex>
          <Input value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="opc." />
        </Field>
        <Field label="Hidratos" flex>
          <Input value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholder="opc." />
        </Field>
        <Field label="Gordura" flex>
          <Input value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="opc." />
        </Field>
      </View>

      <Pressable onPress={() => setShowMicros((s) => !s)} style={{ marginBottom: 8 }}>
        <Note color={theme.colors.ink}>
          {showMicros ? '▴' : '▾'} Micronutrientes (opcional)
        </Note>
      </Pressable>
      {showMicros
        ? MICRO_FIELDS.map((m) => (
            <Field key={m.key} label={`${m.label} (${m.unit})`}>
              <Input
                value={micros[m.key] || ''}
                onChangeText={(v) => setMicros((prev) => ({ ...prev, [m.key]: v }))}
                keyboardType="decimal-pad"
              />
            </Field>
          ))
        : null}

      <Button
        title="+ Adicionar"
        variant="strength"
        onPress={() => {
          const cal = num(calories);
          if (!name.trim() || cal == null) return;
          const entry = {
            name: name.trim(),
            calories: Math.round(cal),
            protein: num(protein),
            carbs: num(carbs),
            fat: num(fat),
          };
          MICRO_FIELDS.forEach((m) => {
            const v = num(micros[m.key]);
            if (v != null) entry[m.key] = v;
          });
          onAdd(entry);
          setName('');
          setCalories('');
          setProtein('');
          setCarbs('');
          setFat('');
          setMicros({});
        }}
      />
    </Card>
  );
}
