/**
 * Cálculos de nutrição — alimentos, refeições e planos alimentares.
 *
 * Alimentos (pesquisados, personalizados, ou dentro de um plano) guardam
 * sempre valores por 100g. As entradas do diário guardam valores absolutos
 * (já calculados para a quantidade registada nesse dia).
 */

export const MICRO_FIELDS = [
  { key: 'fiber', label: 'Fibra', unit: 'g' },
  { key: 'sugar', label: 'Açúcar', unit: 'g' },
  { key: 'saturatedFat', label: 'Gordura Saturada', unit: 'g' },
  { key: 'sodium', label: 'Sódio', unit: 'g' },
  { key: 'cholesterol', label: 'Colesterol', unit: 'mg' },
  { key: 'potassium', label: 'Potássio', unit: 'mg' },
  { key: 'calcium', label: 'Cálcio', unit: 'mg' },
  { key: 'iron', label: 'Ferro', unit: 'mg' },
];

// Nem sempre é fácil pesar um alimento — às vezes é mais natural dizer
// "1 unidade" ou "2 fatias" do que "60g". O valor de "gramsPerUnit" é só um
// ponto de partida (o utilizador pode sempre ajustá-lo antes de adicionar).
export const QUANTITY_UNITS = [
  { key: 'g', label: 'gramas', gramsPerUnit: 1 },
  { key: 'unidade', label: 'unidade(s)', gramsPerUnit: 100 },
  { key: 'fatia', label: 'fatia(s)', gramsPerUnit: 30 },
  { key: 'colher_sopa', label: 'colher(es) de sopa', gramsPerUnit: 15 },
  { key: 'chavena', label: 'chávena(s)', gramsPerUnit: 240 },
];

export function getQuantityUnit(key) {
  return QUANTITY_UNITS.find((u) => u.key === key) || QUANTITY_UNITS[0];
}

/** Converte uma quantidade numa unidade (ex: 2 "unidade") para gramas. */
export function quantityToGrams(amount, unitKey, gramsPerUnit) {
  const perUnit = gramsPerUnit != null ? gramsPerUnit : getQuantityUnit(unitKey).gramsPerUnit;
  return (amount || 0) * perUnit;
}

const MACRO_KEYS = ['protein', 'carbs', 'fat'];
const ALL_NUTRIENT_KEYS = [...MACRO_KEYS, ...MICRO_FIELDS.map((m) => m.key)];

function round1(n) {
  return Math.round((n || 0) * 10) / 10;
}

/**
 * Alguns planos alimentares mais antigos guardam os valores por 100g dentro
 * de um objeto aninhado (`food.per100.calories`) em vez de diretamente no
 * próprio alimento (`food.calories`). Isto lê de forma defensiva os dois
 * formatos, para planos antigos não aparecerem com os macros a zero.
 */
function getPer100(food) {
  return food.per100 || food;
}

/** Valores de um alimento (guardado por 100g) para uma quantidade em gramas. */
export function computeFoodTotals(rawFood, grams) {
  const food = getPer100(rawFood);
  const factor = (grams || 0) / 100;
  const out = { calories: Math.round((food.calories || 0) * factor) };
  ALL_NUTRIENT_KEYS.forEach((key) => {
    out[key] = round1((food[key] || 0) * factor);
  });
  return out;
}

/** Soma os totais de todos os alimentos de uma refeição (plano alimentar). */
export function computeMealTotals(meal) {
  const acc = { calories: 0 };
  ALL_NUTRIENT_KEYS.forEach((key) => (acc[key] = 0));
  meal.foods.forEach((f) => {
    const t = computeFoodTotals(f, f.quantity);
    acc.calories += t.calories;
    ALL_NUTRIENT_KEYS.forEach((key) => (acc[key] += t[key]));
  });
  acc.calories = Math.round(acc.calories);
  ALL_NUTRIENT_KEYS.forEach((key) => (acc[key] = round1(acc[key])));
  return acc;
}

/** Soma os totais de todas as entradas do diário num dia. */
export function computeDayTotals(entries) {
  const acc = { calories: 0 };
  ALL_NUTRIENT_KEYS.forEach((key) => (acc[key] = 0));
  entries.forEach((e) => {
    acc.calories += e.calories || 0;
    ALL_NUTRIENT_KEYS.forEach((key) => (acc[key] += e[key] || 0));
  });
  acc.calories = Math.round(acc.calories);
  ALL_NUTRIENT_KEYS.forEach((key) => (acc[key] = round1(acc[key])));
  return acc;
}

/**
 * Lê os campos relevantes de um resultado da Open Food Facts (por 100g),
 * incluindo os micronutrientes que tivermos disponíveis.
 */
export function parseOffProduct(p) {
  const n = p.nutriments || {};
  // A Open Food Facts guarda estes quatro sempre em gramas, mas em
  // quantidades tão pequenas que faz mais sentido ler em miligramas.
  const mg = (grams) => (grams != null ? round1(grams * 1000) : 0);
  return {
    name: p.product_name,
    brand: Array.isArray(p.brands) ? p.brands[0] || '' : (p.brands || '').split(',')[0],
    calories: Math.round(n['energy-kcal_100g'] || 0),
    protein: round1(n.proteins_100g),
    carbs: round1(n.carbohydrates_100g),
    fat: round1(n.fat_100g),
    fiber: round1(n.fiber_100g),
    sugar: round1(n.sugars_100g),
    saturatedFat: round1(n['saturated-fat_100g']),
    sodium: round1(n.sodium_100g),
    cholesterol: mg(n.cholesterol_100g),
    potassium: mg(n.potassium_100g),
    calcium: mg(n.calcium_100g),
    iron: mg(n.iron_100g),
  };
}
