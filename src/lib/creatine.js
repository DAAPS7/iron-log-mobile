/**
 * Streak diária de toma de creatina.
 *
 * `creatineLog` é uma lista de {date} — um por dia em que foi marcada como
 * tomada. A streak conta dias consecutivos terminados hoje. Se ainda não
 * marcaste hoje, conta a partir de ontem para trás — assim a streak não
 * parece "quebrada" só porque ainda não chegaste a tomar hoje.
 */

import { formatLocalDate } from './date';

export function isTakenToday(creatineLog, today) {
  const t = today || formatLocalDate(new Date());
  return (creatineLog || []).some((e) => e.date === t);
}

export function computeCreatineStreak(creatineLog, now = new Date()) {
  const set = new Set((creatineLog || []).map((e) => e.date));
  const d = new Date(now);
  let cursor = formatLocalDate(d);

  if (!set.has(cursor)) {
    d.setDate(d.getDate() - 1);
    cursor = formatLocalDate(d);
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    d.setDate(d.getDate() - 1);
    cursor = formatLocalDate(d);
  }
  return streak;
}
