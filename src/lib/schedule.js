/**
 * Plano semanal de treinos.
 *
 * Funções puras — a decisão de mostrar o lembrete ou os parabéns fica nos
 * ecrãs, para estas serem testáveis sem UI.
 */

export const WEEKDAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const WEEKDAY_LABELS = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo',
};

const DAY_OFFSET = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

/** Chave do dia da semana para uma data (Date.getDay(): 0 = domingo). */
export function weekdayKeyFor(date) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

/** Segunda-feira da semana a que a data pertence, em ISO (YYYY-MM-DD). */
export function getMonday(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

/**
 * Verifica se todos os treinos planeados para a semana que começou em
 * `mondayStr` foram de facto registados nos dias certos.
 */
export function wasWeekCompleted(schedule, loggedWorkouts, mondayStr) {
  const scheduledDays = WEEKDAY_ORDER.filter((day) => schedule?.[day]);
  if (!scheduledDays.length) return false;

  return scheduledDays.every((day) => {
    const d = new Date(`${mondayStr}T00:00:00`);
    d.setDate(d.getDate() + DAY_OFFSET[day]);
    const dateStr = d.toISOString().slice(0, 10);
    return loggedWorkouts.some(
      (lw) => lw.date === dateStr && lw.workoutId === schedule[day],
    );
  });
}

/**
 * Decide se há uma revisão semanal por mostrar.
 * Devolve { shouldCongratulate, currentMonday } — o ecrã guarda depois o
 * currentMonday em data.lastWeeklyReviewWeek para não repetir.
 */
export function evaluateWeeklyReview(data, today = new Date()) {
  const currentMonday = getMonday(today.toISOString().slice(0, 10));
  if (data.lastWeeklyReviewWeek === currentMonday) {
    return { shouldCongratulate: false, currentMonday };
  }

  // Nunca felicita na primeiríssima avaliação: a semana anterior pode ter
  // decorrido sem o plano sequer existir.
  if (data.lastWeeklyReviewWeek == null) {
    return { shouldCongratulate: false, currentMonday };
  }

  const prev = new Date(`${currentMonday}T00:00:00`);
  prev.setDate(prev.getDate() - 7);
  const prevMonday = prev.toISOString().slice(0, 10);

  return {
    shouldCongratulate: wasWeekCompleted(
      data.weeklySchedule,
      data.loggedWorkouts,
      prevMonday,
    ),
    currentMonday,
  };
}
