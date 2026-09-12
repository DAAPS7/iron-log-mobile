/**
 * Espelha a fusão feita no servidor (src/utils.js do Worker). Usada quando
 * uma resposta de gravação chega depois de já teres feito mais alterações
 * localmente entretanto (ex: a registar séries rapidamente) — evita que a
 * resposta do servidor "recue no tempo" e apague essas alterações mais
 * recentes.
 */

const MERGE_ARRAYS_BY_ID = [
  'loggedWorkouts',
  'workouts',
  'calorieEntries',
  'waterEntries',
  'customFoods',
  'mealPlans',
  'exerciseGoals',
];
const MERGE_ARRAYS_BY_DATE = ['weightHistory', 'creatineLog'];
const MERGE_BEST_WEIGHT_OBJECTS = ['exercisePRs', 'prNotifyCache'];
const MERGE_SHALLOW_OBJECTS = ['metricGoals', 'macroGoals', 'weeklySchedule'];
const DELETABLE_FIELDS = [...MERGE_ARRAYS_BY_ID, ...MERGE_ARRAYS_BY_DATE];

function mergeShallowObject(oldObj, newObj) {
  return { ...(oldObj || {}), ...(newObj || {}) };
}

// Une duas listas de marcas de eliminação (nunca se "desfaz" uma marca por
// fusão — uma vez apagado nalgum lado, fica apagado).
function mergeDeletedIds(oldDeleted, newDeleted) {
  const merged = {};
  DELETABLE_FIELDS.forEach((field) => {
    const combined = new Set([...(oldDeleted?.[field] || []), ...(newDeleted?.[field] || [])]);
    merged[field] = [...combined];
  });
  return merged;
}

/**
 * Une duas listas por chave (id, ou data no caso do peso). Itens marcados
 * como apagados (em `tombstones`) ficam de fora do resultado, mesmo que
 * ainda existam num dos dois lados — sem isto, apagar algo num dispositivo
 * era sempre desfeito na próxima gravação, porque a fusão trazia de volta
 * qualquer item que existisse em qualquer um dos lados.
 */
function mergeArrayByKey(oldArr, newArr, keyField, tombstones) {
  const map = new Map();
  (oldArr || []).forEach((item) => {
    if (item && item[keyField] != null) map.set(item[keyField], item);
  });
  (newArr || []).forEach((item) => {
    if (item && item[keyField] != null) map.set(item[keyField], item);
  });
  (tombstones || []).forEach((key) => map.delete(key));
  return [...map.values()];
}

function isBetterPR(a, b) {
  if (!a) return false;
  if (!b) return true;
  if (a.weight > b.weight) return true;
  if (a.weight === b.weight && (a.reps || 0) > (b.reps || 0)) return true;
  return false;
}
function mergeBestWeightObject(oldObj, newObj) {
  const merged = { ...(oldObj || {}) };
  for (const [key, val] of Object.entries(newObj || {})) {
    merged[key] = isBetterPR(val, merged[key]) ? val : merged[key];
  }
  return merged;
}

/**
 * Funde `oldData` (ex: a resposta do servidor) com `newData` (ex: o estado
 * local mais recente, que pode já ter avançado). Os campos escalares vêm
 * sempre de `newData` (o lado considerado "mais recente"); as listas com id
 * e o histórico de peso são unidos por chave, respeitando marcas de
 * eliminação.
 */
export function mergeUserData(oldData, newData) {
  if (!oldData) return newData;
  if (!newData) return oldData;

  const mergedDeletedIds = mergeDeletedIds(oldData.deletedIds, newData.deletedIds);

  const merged = { ...newData };
  MERGE_ARRAYS_BY_ID.forEach((key) => {
    merged[key] = mergeArrayByKey(oldData[key], newData[key], 'id', mergedDeletedIds[key]);
  });
  MERGE_ARRAYS_BY_DATE.forEach((key) => {
    merged[key] = mergeArrayByKey(oldData[key], newData[key], 'date', mergedDeletedIds[key]);
  });
  MERGE_BEST_WEIGHT_OBJECTS.forEach((key) => {
    merged[key] = mergeBestWeightObject(oldData[key], newData[key]);
  });
  MERGE_SHALLOW_OBJECTS.forEach((key) => {
    merged[key] = mergeShallowObject(oldData[key], newData[key]);
  });
  merged.deletedIds = mergedDeletedIds;
  return merged;
}
