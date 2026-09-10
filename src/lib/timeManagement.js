/**
 * Gestão de tempo de treino.
 *
 * Três coisas independentes, todas puras (sem UI):
 *  1. Quantas séries de aquecimento fazem sentido para um exercício, dado
 *     quantas séries de trabalho tem e se o grupo muscular já foi
 *     trabalhado antes nesta mesma sessão.
 *  2. Quanto tempo um treino deve demorar, com essas recomendações.
 *  3. Dicas (gerais + específicas do treino) para o tornar mais rápido sem
 *     perder qualidade.
 */

// Grupos musculares maiores costumam precisar de mais preparação (mais
// articulações/massa muscular envolvida) do que os menores.
export const LARGE_MUSCLE_GROUPS = new Set([
  'Back',
  'Chest',
  'Glutes',
  'Hamstrings',
  'Legs',
  'Lats',
  'Quads',
]);

/**
 * Séries de aquecimento recomendadas para um exercício de força.
 *
 * Regra: menos séries de trabalho planeadas → mais aquecimento (não há
 * "sobra" de volume para servir de rampa); 3+ séries de trabalho → menos
 * aquecimento chega. Grupos musculares maiores sobem um patamar. Se o
 * mesmo grupo muscular já foi trabalhado antes nesta sessão, desconta uma
 * série (já está "quente").
 */
export function recommendWarmupSets(exercise, alreadyWorkedMuscles = new Set()) {
  if (exercise.type !== 'strength') return null;

  const workingSets = exercise.sets || 3;
  const isLarge = exercise.muscle && LARGE_MUSCLE_GROUPS.has(exercise.muscle);

  let base = workingSets <= 2 ? (isLarge ? 3 : 2) : isLarge ? 2 : 1;

  if (exercise.muscle && alreadyWorkedMuscles.has(exercise.muscle)) {
    base = Math.max(0, base - 1);
  }
  return base;
}

const ACTIVE_SECONDS_PER_STRENGTH_SET = 40; // execução da série em si
const WARMUP_ACTIVE_SECONDS = 20; // séries de aquecimento são mais rápidas
const REST_BETWEEN_WORKING_SETS = 150; // 2:30, meio da faixa de 2-3min pedida
const REST_BETWEEN_WARMUP_SETS = 60;
const TRANSITION_BETWEEN_EXERCISES = 90; // trocar de equipamento/posição

/** Tempo estimado (segundos) para um único exercício, incluindo aquecimento. */
export function estimateExerciseSeconds(exercise, warmupSets = 0) {
  if (exercise.type === 'cardio') {
    const minutes = exercise.duration || 20;
    const sets = exercise.sets || 1;
    return sets * minutes * 60 + Math.max(0, sets - 1) * 60; // descanso curto entre séries de cardio
  }

  const workingSets = exercise.sets || 3;
  const workingTime =
    workingSets * ACTIVE_SECONDS_PER_STRENGTH_SET +
    Math.max(0, workingSets - 1) * REST_BETWEEN_WORKING_SETS;

  const warmupTime = warmupSets
    ? warmupSets * WARMUP_ACTIVE_SECONDS + Math.max(0, warmupSets - 1) * REST_BETWEEN_WARMUP_SETS
    : 0;

  return workingTime + warmupTime;
}

/**
 * Estimativa total de um treino, com a recomendação de aquecimento já
 * aplicada exercício a exercício (tendo em conta o que veio antes).
 */
export function estimateWorkoutTime(workout) {
  const alreadyWorked = new Set();
  let totalSeconds = 0;
  const breakdown = workout.exercises.map((ex, i) => {
    const warmupSets =
      ex.warmupSets != null ? ex.warmupSets : recommendWarmupSets(ex, alreadyWorked);
    const seconds = estimateExerciseSeconds(ex, warmupSets || 0);
    totalSeconds += seconds;
    if (i > 0) totalSeconds += TRANSITION_BETWEEN_EXERCISES;
    if (ex.muscle) alreadyWorked.add(ex.muscle);
    return { name: ex.name, warmupSets, seconds };
  });
  return { totalSeconds, breakdown };
}

export function formatDuration(totalSeconds) {
  const totalMinutes = Math.round(totalSeconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

/** Dicas gerais, sempre relevantes, para tornar qualquer treino mais rápido. */
export function getGeneralTimeTips() {
  return [
    'Descansa sempre 2-3 minutos entre séries de trabalho — é o intervalo assumido nas estimativas desta app.',
    'Prepara os pesos/equipamento do próximo exercício enquanto descansas do atual.',
    'Usa um cronómetro para o descanso — sem ele, é fácil descansar mais do que precisas sem dar por isso.',
    'Chega ao ginásio já com a roupa e os auscultadores prontos — perdas de tempo antes de começar também contam.',
  ];
}

/**
 * Dicas específicas deste treino em concreto, calculadas a partir da sua
 * estrutura (ordem dos exercícios, grupos musculares repetidos, etc.).
 */
export function getWorkoutSpecificTips(workout) {
  const tips = [];
  const muscleFirstSeen = new Map();
  const muscleOrder = [];

  workout.exercises.forEach((ex, i) => {
    if (!ex.muscle) return;
    if (!muscleFirstSeen.has(ex.muscle)) {
      muscleFirstSeen.set(ex.muscle, i);
      muscleOrder.push(ex.muscle);
    }
  });

  // Grupo muscular trabalhado, depois interrompido por outros, e retomado
  // mais tarde — juntar os dois blocos poupa uma "reaquecida" desnecessária.
  workout.exercises.forEach((ex, i) => {
    if (!ex.muscle) return;
    const firstIndex = muscleFirstSeen.get(ex.muscle);
    if (firstIndex != null && firstIndex < i - 1) {
      const alreadyFlagged = tips.some((t) => t.includes(ex.muscle));
      if (!alreadyFlagged) {
        tips.push(
          `"${ex.name}" trabalha ${ex.muscle}, que já tinhas feito antes noutro exercício não seguido. Se os juntares, poupas uma série de aquecimento extra.`,
        );
      }
    }
  });

  // Muitas séries de aquecimento recomendadas ao todo — vale a pena rever.
  const alreadyWorked = new Set();
  let totalWarmup = 0;
  workout.exercises.forEach((ex) => {
    const w = ex.warmupSets != null ? ex.warmupSets : recommendWarmupSets(ex, alreadyWorked);
    totalWarmup += w || 0;
    if (ex.muscle) alreadyWorked.add(ex.muscle);
  });
  if (totalWarmup >= 10) {
    tips.push(
      `Este treino tem ≈${totalWarmup} séries de aquecimento ao todo. Considera juntar exercícios do mesmo grupo muscular, ou partilhar o aquecimento entre exercícios parecidos.`,
    );
  }

  return tips;
}
