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
    calorieGoal: null,
    macroGoals: { protein: null, carbs: null, fat: null },
    exercisePRs: {},
    prNotifyCache: {},
    mealPlans: [],
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

/** Junta os dados vindos do servidor com a forma esperada pela app. */
export function mergeData(incoming) {
  return { ...defaultData(), ...(incoming || {}) };
}

export function mergeSettings(incoming) {
  return { ...defaultSettings(), ...(incoming || {}) };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
