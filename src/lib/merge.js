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
const MERGE_ARRAYS_BY_DATE = ['weightHistory'];
const MERGE_BEST_WEIGHT_OBJECTS = ['exercisePRs', 'prNotifyCache'];

function mergeArrayByKey(oldArr, newArr, keyField) {
  const map = new Map();
  (oldArr || []).forEach((item) => {
    if (item && item[keyField] != null) map.set(item[keyField], item);
  });
  (newArr || []).forEach((item) => {
    if (item && item[keyField] != null) map.set(item[keyField], item);
  });
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
 * e o histórico de peso são unidos por chave.
 */
export function mergeUserData(oldData, newData) {
  if (!oldData) return newData;
  if (!newData) return oldData;

  const merged = { ...newData };
  MERGE_ARRAYS_BY_ID.forEach((key) => {
    merged[key] = mergeArrayByKey(oldData[key], newData[key], 'id');
  });
  MERGE_ARRAYS_BY_DATE.forEach((key) => {
    merged[key] = mergeArrayByKey(oldData[key], newData[key], 'date');
  });
  MERGE_BEST_WEIGHT_OBJECTS.forEach((key) => {
    merged[key] = mergeBestWeightObject(oldData[key], newData[key]);
  });
  return merged;
}
