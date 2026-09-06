import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

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
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { caloriesFromMacros } from '../lib/biometrics';
import { uid } from '../lib/defaults';
import * as api from '../api/client';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionScreen() {
  const theme = useTheme();
  const { data, updateData } = useStore();
  const [date, setDate] = useState(todayISO());

  const entries = useMemo(
    () => (data?.calorieEntries || []).filter((e) => e.date === date),
    [data?.calorieEntries, date],
  );

  if (!data) return null;

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const goal = data.calorieGoal;
  const macroGoals = data.macroGoals || {};

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

      <GoalsCard
        goal={goal}
        macroGoals={macroGoals}
        onSave={(cal, macros) =>
          updateData((prev) => ({ ...prev, calorieGoal: cal, macroGoals: macros }))
        }
      />

      <FoodSearchCard onAdd={addEntry} />

      <QuickAddCard onAdd={addEntry} />

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
function FoodSearchCard({ onAdd }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(null);
  const [grams, setGrams] = useState('100');

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
        .map((p) => ({
          name: p.product_name,
          brand: Array.isArray(p.brands) ? p.brands[0] || '' : (p.brands || '').split(',')[0],
          calories: Math.round(p.nutriments['energy-kcal_100g'] || 0),
          protein: Math.round((p.nutriments.proteins_100g || 0) * 10) / 10,
          carbs: Math.round((p.nutriments.carbohydrates_100g || 0) * 10) / 10,
          fat: Math.round((p.nutriments.fat_100g || 0) * 10) / 10,
        }))
        .slice(0, 10);
      setResults(parsed);
      if (!parsed.length) setStatus('Sem resultados. Tenta outro termo.');
    } catch (e) {
      setStatus('Não foi possível pesquisar agora. Podes adicionar manualmente.');
    } finally {
      setLoading(false);
    }
  }

  const factor = (parseFloat(grams) || 0) / 100;

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
          onPress={() => setPicked(r)}
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
          <Note style={{ marginBottom: 10 }}>
            ≈ {Math.round(picked.calories * factor)} kcal · P:
            {Math.round(picked.protein * factor * 10) / 10}g H:
            {Math.round(picked.carbs * factor * 10) / 10}g G:
            {Math.round(picked.fat * factor * 10) / 10}g
          </Note>
          <Button
            title="+ Adicionar ao dia"
            variant="strength"
            onPress={() => {
              onAdd({
                name: picked.name,
                calories: Math.round(picked.calories * factor),
                protein: Math.round(picked.protein * factor * 10) / 10,
                carbs: Math.round(picked.carbs * factor * 10) / 10,
                fat: Math.round(picked.fat * factor * 10) / 10,
              });
              setPicked(null);
              setResults([]);
              setQuery('');
            }}
          />
        </View>
      ) : null}
    </Card>
  );
}

/** Registo manual rápido, sem pesquisa. */
function QuickAddCard({ onAdd }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

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
      <Button
        title="+ Adicionar"
        variant="strength"
        onPress={() => {
          const cal = num(calories);
          if (!name.trim() || cal == null) return;
          onAdd({
            name: name.trim(),
            calories: Math.round(cal),
            protein: num(protein),
            carbs: num(carbs),
            fat: num(fat),
          });
          setName('');
          setCalories('');
          setProtein('');
          setCarbs('');
          setFat('');
        }}
      />
    </Card>
  );
}
