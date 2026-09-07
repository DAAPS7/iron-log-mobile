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
];

const MACRO_KEYS = ['protein', 'carbs', 'fat'];
const ALL_NUTRIENT_KEYS = [...MACRO_KEYS, ...MICRO_FIELDS.map((m) => m.key)];

function round1(n) {
  return Math.round((n || 0) * 10) / 10;
}

/** Valores de um alimento (guardado por 100g) para uma quantidade em gramas. */
export function computeFoodTotals(food, grams) {
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
  };
}
