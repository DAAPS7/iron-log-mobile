/**
 * Progresso de volume semanal por grupo muscular.
 *
 * Compara as séries de trabalho planeadas para esta semana (a partir do
 * plano semanal e dos treinos que ele aponta) com as séries realmente
 * registadas desde a última segunda-feira. Reinicia sozinho todas as
 * semanas — não guarda estado nenhum, é sempre recalculado a partir do
 * histórico real, tal como o PR e os objetivos.
 */

import { formatLocalDate } from './date';
import { isWarmupSet } from './sets';

/**
 * Alguns grupos musculares (definidos em lib/exercises.js) partilham a
 * mesma zona visual no corpo — ex: "Back" e "Lats" ficam ambos na zona das
 * costas, "Legs" (compostos como agachamento) conta para a mesma zona que
 * "Quads". Isto define essas zonas e o que cada uma soma.
 */
export const MUSCLE_REGIONS = {
  chest: { label: 'Peito', view: 'front', muscles: ['Chest'] },
  shoulders_front: { label: 'Ombros', view: 'front', muscles: ['Shoulders'] },
  biceps: { label: 'Bicípites', view: 'front', muscles: ['Biceps'] },
  forearms: { label: 'Antebraços', view: 'front', muscles: ['Forearms'] },
  abs: { label: 'Abdominais', view: 'front', muscles: ['Abs'] },
  quads: { label: 'Quadríceps', view: 'front', muscles: ['Quads', 'Legs'] },
  adductors: { label: 'Adutores', view: 'front', muscles: ['Adductors'] },
  back: { label: 'Costas', view: 'back', muscles: ['Back', 'Lats'] },
  rear_delts: { label: 'Deltóides Posteriores', view: 'back', muscles: ['Rear Delts'] },
  triceps: { label: 'Tricípites', view: 'back', muscles: ['Triceps'] },
  glutes: { label: 'Glúteos', view: 'back', muscles: ['Glutes'] },
  hamstrings: { label: 'Isquiotibiais', view: 'back', muscles: ['Hamstrings'] },
  calves: { label: 'Gémeos', view: 'back', muscles: ['Calves'] },
};

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return formatLocalDate(d);
}

/** Séries de trabalho planeadas por grupo muscular, a partir do plano semanal. */
export function computePlannedSetsPerMuscle(data) {
  const planned = {};
  const schedule = data.weeklySchedule || {};
  Object.values(schedule).forEach((workoutId) => {
    if (!workoutId) return;
    const workout = (data.workouts || []).find((w) => w.id === workoutId);
    if (!workout) return;
    workout.exercises.forEach((ex) => {
      if (ex.type !== 'strength' || !ex.muscle) return;
      planned[ex.muscle] = (planned[ex.muscle] || 0) + (ex.sets || 0);
    });
  });
  return planned;
}

/** Séries de trabalho já registadas esta semana (desde a última 2ª-feira), por músculo. */
export function computeCompletedSetsPerMuscle(loggedWorkouts, now = new Date()) {
  const monday = getMondayOfWeek(now);
  const completed = {};
  (loggedWorkouts || []).forEach((lw) => {
    if (lw.date < monday) return; // de uma semana anterior — não conta
    lw.exercises.forEach((ex) => {
      if (ex.type !== 'strength' || !ex.muscle) return;
      const workingSets = ex.sets.filter((s) => !isWarmupSet(s)).length;
      completed[ex.muscle] = (completed[ex.muscle] || 0) + workingSets;
    });
  });
  return completed;
}

/**
 * Progresso (0 a 1) por região visual do corpo, combinando os músculos que
 * partilham essa região. Sem nada planeado para uma região esta semana,
 * fica a 0 (neutra) — não há meta com que comparar.
 */
export function computeMuscleRegionProgress(data, now = new Date()) {
  const planned = computePlannedSetsPerMuscle(data);
  const completed = computeCompletedSetsPerMuscle(data.loggedWorkouts, now);

  const result = {};
  Object.entries(MUSCLE_REGIONS).forEach(([regionKey, region]) => {
    const plannedSets = region.muscles.reduce((sum, m) => sum + (planned[m] || 0), 0);
    const completedSets = region.muscles.reduce((sum, m) => sum + (completed[m] || 0), 0);
    result[regionKey] = {
      label: region.label,
      view: region.view,
      plannedSets,
      completedSets,
      progress: plannedSets > 0 ? Math.min(1, completedSets / plannedSets) : 0,
    };
  });
  return result;
}
