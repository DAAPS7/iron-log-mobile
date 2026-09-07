/**
 * Objetivos de peso em exercícios (ex: "quero levantar 100kg no Bench Press
 * até 1 de dezembro"). Um objetivo nunca guarda o seu próprio estado de
 * "cumprido" — é sempre avaliado a partir do histórico real de treinos, tal
 * como o PR. Isto evita que fique desatualizado se apagares ou editares um
 * registo antigo.
 */

import { isWarmupSet, parseStrengthSet } from './sets';
import { todayLocal } from './date';

/**
 * Avalia um objetivo face ao histórico de treinos.
 * Devolve o objetivo com dois campos extra:
 *  - achievedDate: a primeira data em que foi atingido (ou null)
 *  - status: 'achieved' | 'missed' (prazo passado sem o cumprir) | 'pending'
 */
export function evaluateGoal(goal, loggedWorkouts) {
  const sorted = [...loggedWorkouts].sort((a, b) => new Date(a.date) - new Date(b.date));
  let achievedDate = null;

  for (const lw of sorted) {
    for (const ex of lw.exercises) {
      if (ex.type !== 'strength' || ex.name !== goal.exerciseName) continue;
      const hit = ex.sets.some((s) => {
        if (isWarmupSet(s)) return false;
        const parsed = parseStrengthSet(s);
        return parsed && parsed.weight >= goal.targetWeight;
      });
      if (hit) {
        achievedDate = lw.date;
        break;
      }
    }
    if (achievedDate) break;
  }

  let status;
  if (achievedDate) status = 'achieved';
  else if (goal.targetDate && goal.targetDate < todayLocal()) status = 'missed';
  else status = 'pending';

  return { ...goal, achievedDate, status };
}

export function evaluateAllGoals(goals, loggedWorkouts) {
  return goals.map((g) => evaluateGoal(g, loggedWorkouts));
}
