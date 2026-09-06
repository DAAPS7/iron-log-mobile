/**
 * Biblioteca de exercícios de força.
 *
 * Já ordenada alfabeticamente — mantém assim ao adicionares novos, para os
 * seletores e a biblioteca aparecerem sempre por ordem sem trabalho extra.
 * `muscle` alimenta as estatísticas por grupo muscular.
 */

export const STRENGTH_EXERCISES = [
  { name: 'Bayesian Curl', muscle: 'Biceps' },
  { name: 'Bench Press', muscle: 'Chest' },
  { name: 'Cable Lat Pullover', muscle: 'Lats' },
  { name: 'Cable Lateral Raises', muscle: 'Shoulders' },
  { name: 'Cable Tricep Pushdown', muscle: 'Triceps' },
  { name: 'Calf Raises', muscle: 'Calves' },
  { name: 'Close Grip Lat Pulldown', muscle: 'Lats' },
  { name: 'Dips', muscle: 'Triceps' },
  { name: 'Dumbbell Incline Press', muscle: 'Chest' },
  { name: 'Dumbbell Preacher Curl', muscle: 'Biceps' },
  { name: 'Hammer Curl', muscle: 'Biceps' },
  { name: 'Hanging Crunches', muscle: 'Abs' },
  { name: 'Hip Adduction', muscle: 'Adductors' },
  { name: 'Hip Thrust', muscle: 'Glutes' },
  { name: 'Kneeling Lat Pulldown', muscle: 'Lats' },
  { name: 'Leg Extension', muscle: 'Quads' },
  { name: 'Lower Pec Cable Fly', muscle: 'Chest' },
  { name: 'Machine Chest Press', muscle: 'Chest' },
  { name: 'Mid Pec Cable Fly', muscle: 'Chest' },
  { name: 'Overhead Cable Tricep Extension', muscle: 'Triceps' },
  { name: 'Rear Delt Cable Fly', muscle: 'Rear Delts' },
  { name: 'Reverse Wrist Curl', muscle: 'Forearms' },
  { name: 'Seated Leg Curl', muscle: 'Hamstrings' },
  { name: 'Seated Low Row', muscle: 'Back' },
  { name: 'Seated Machine Wide Row', muscle: 'Back' },
  { name: 'Shoulder Press', muscle: 'Shoulders' },
  { name: 'Squat', muscle: 'Legs' },
  { name: 'Unilateral Tricep Pushdown', muscle: 'Triceps' },
  { name: 'Wide Grip EZ Bar Preacher Curl', muscle: 'Biceps' },
  { name: 'Wide Grip Lat Pulldown', muscle: 'Lats' },
  { name: 'Wrist Curl', muscle: 'Forearms' },
];

/** Grupos musculares distintos presentes na biblioteca (para filtros/cores). */
export const MUSCLE_GROUPS = [
  ...new Set(STRENGTH_EXERCISES.map((e) => e.muscle)),
].sort();
