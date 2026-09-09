/**
 * Forma dos dados do utilizador.
 *
 * Tem de acompanhar o defaultData() do backend (src/utils.js no Worker).
 * Ao carregar dados do servidor fazemos sempre merge com estes valores, para
 * que contas criadas antes de uma funcionalidade nova não rebentem.
 */

export function defaultData() {
  return {
    profile: null,
    weightHistory: [],
    workouts: [],
    loggedWorkouts: [],
    calorieEntries: [],
    waterEntries: [],
    exerciseGoals: [],
    calorieGoal: null,
    macroGoals: { protein: null, carbs: null, fat: null },
    exercisePRs: {},
    prNotifyCache: {},
    mealPlans: [],
    customFoods: [],
    metricGoals: {
      bodyFat: { target: null, targetDate: null },
      weight: { target: null, targetDate: null },
    },
    weeklySchedule: {
      mon: null,
      tue: null,
      wed: null,
      thu: null,
      fri: null,
      sat: null,
      sun: null,
    },
    lastWeeklyReviewWeek: null,
  };
}

export function defaultSettings() {
  return {
    theme: 'light',
    font: 'unbounded-jakarta',
    palette: 'classic',
    accentStrength: null,
    accentCardio: null,
    radius: 14,
  };
}

/**
 * Junta os dados vindos do servidor com a forma esperada pela app.
 *
 * Isto não pode ser uma fusão só de nível de topo: alguns campos são
 * objetos aninhados (ex: metricGoals tem bodyFat/weight lá dentro). Se os
 * dados guardados tiverem, por exemplo, só "metricGoals.bodyFat" (de uma
 * altura em que "weight" ainda não existia), uma fusão superficial
 * substituía o objeto metricGoals inteiro, apagando o valor por omissão de
 * "weight" — fazendo uma meta de peso já definida parecer que nunca
 * existiu.
 */
export function mergeData(incoming) {
  const merged = { ...defaultData(), ...(incoming || {}) };
  merged.metricGoals = { ...defaultData().metricGoals, ...(incoming?.metricGoals || {}) };
  merged.macroGoals = { ...defaultData().macroGoals, ...(incoming?.macroGoals || {}) };
  merged.weeklySchedule = { ...defaultData().weeklySchedule, ...(incoming?.weeklySchedule || {}) };
  return merged;
}

export function mergeSettings(incoming) {
  return { ...defaultSettings(), ...(incoming || {}) };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
