/**
 * Séries de treino: formatação, parsing e cálculo de recordes.
 *
 * As séries são guardadas como texto legível (ex: "5 × 100 kg (RIR 2)" ou
 * "20min 30s 5km"), o que mantém o histórico compreensível mesmo fora da
 * app. Estas funções são a única fonte de verdade para ler/escrever esse
 * formato — o resto da app nunca deve fazer parsing à mão.
 */

export const WEIGHT_UNITS = ['kg', 'lb', 'placas'];
export const DISTANCE_UNITS = ['km', 'mi', 'm'];

const WARMUP_PREFIX = 'Aquecimento: ';

export function isWarmupSet(setStr) {
  return setStr.startsWith(WARMUP_PREFIX);
}

/** Constrói a string de uma série de força. */
export function formatStrengthSet({ reps, weight, unit, notes, isWarmup }) {
  const prefix = isWarmup ? WARMUP_PREFIX : '';
  const notesPart = notes ? ` (${notes})` : '';
  return `${prefix}${reps} × ${weight} ${unit}${notesPart}`;
}

/** Constrói a string de uma série de cardio. */
export function formatCardioSet({
  minutes,
  seconds,
  distance,
  distanceUnit,
  notes,
  isWarmup,
}) {
  const prefix = isWarmup ? WARMUP_PREFIX : '';
  const timePart = `${minutes}min${seconds > 0 ? ` ${seconds}s` : ''}`;
  const distPart =
    distance > 0 ? ` ${distance}${distanceUnit || 'km'}` : '';
  const notesPart = notes ? ` (${notes})` : '';
  return `${prefix}${timePart}${distPart}${notesPart}`;
}

/**
 * Lê uma série de força.
 * Aceita o formato atual ("5 × 100 kg") e o antigo ("5x100kg").
 */
export function parseStrengthSet(setStr) {
  const m = setStr.match(/^(\d+)\s*[x×]\s*([\d.]+)\s*([a-zA-Zà-úÀ-Ú]*)/);
  if (!m) return null;
  return {
    reps: parseInt(m[1], 10),
    weight: parseFloat(m[2]),
    unit: m[3] || 'kg',
  };
}

/**
 * Lê uma série de cardio.
 * totalMinutes já inclui os segundos como fração, para os cálculos de ritmo.
 */
export function parseCardioSet(setStr) {
  const m = setStr.match(/^(\d+)min(?:\s+(\d+)s)?(?:\s+([\d.]+)(km|mi|m))?/);
  if (!m) return null;
  const minutes = parseInt(m[1], 10) || 0;
  const seconds = m[2] ? parseInt(m[2], 10) : 0;
  return {
    totalMinutes: minutes + seconds / 60,
    distance: m[3] ? parseFloat(m[3]) : null,
    unit: m[4] || null,
  };
}

/** Formata minutos decimais como "12:30 min" (ou "12 min" se não houver segundos). */
export function formatMinSec(totalMinutes) {
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  return secs > 0 ? `${mins}:${String(secs).padStart(2, '0')} min` : `${mins} min`;
}

/**
 * Um set é melhor que outro se levantar mais peso, ou o mesmo peso com mais
 * repetições. É esta a definição de "recorde" usada em toda a app.
 */
export function isBetterSet(a, b) {
  if (!a) return false;
  if (!b) return true;
  if (a.weight > b.weight) return true;
  if (a.weight === b.weight && (a.reps || 0) > (b.reps || 0)) return true;
  return false;
}

/**
 * Melhor série alguma vez registada para um exercício (ignora aquecimentos).
 *
 * É sempre recalculado a partir do histórico atual — se o registo que gerou
 * o PR for apagado, o valor desce automaticamente, sem ficar "preso".
 */
export function computeBestFromSessions(loggedWorkouts, type, name) {
  let best = null;
  loggedWorkouts.forEach((session) => {
    session.exercises.forEach((ex) => {
      if (ex.type !== type || ex.name !== name) return;
      ex.sets.forEach((setStr) => {
        if (isWarmupSet(setStr)) return;
        const parsed = parseStrengthSet(setStr);
        if (parsed && isBetterSet(parsed, best)) best = parsed;
      });
    });
  });
  return best;
}

/**
 * PR efetivo = o melhor entre o recorde manual (ex: anterior à app) e o
 * melhor set já registado nas sessões.
 */
export function getEffectivePR(loggedWorkouts, manualPRs, type, name) {
  if (type !== 'strength') return null;
  const manual = manualPRs[`${type}::${name}`] || null;
  const fromSessions = computeBestFromSessions(loggedWorkouts, type, name);
  return isBetterSet(fromSessions, manual) ? fromSessions : manual;
}

/**
 * Decide se uma série acabada de registar bate o recorde do exercício.
 *
 * O que conta como "recorde a bater" é o melhor entre:
 *  - o PR já existente (histórico gravado + recorde manual), e
 *  - as séries já feitas nesta mesma sessão, que ainda não foram gravadas.
 *
 * Sem a segunda parte, um treino com séries progressivamente mais pesadas
 * dispararia a celebração várias vezes seguidas no mesmo exercício.
 *
 * Aquecimentos nunca contam. Devolve null quando não há recorde novo.
 */
export function detectNewPR(newSetStr, priorSessionSets, baselinePR) {
  if (isWarmupSet(newSetStr)) return null;
  const parsed = parseStrengthSet(newSetStr);
  if (!parsed) return null;

  let best = baselinePR || null;
  (priorSessionSets || []).forEach((s) => {
    if (isWarmupSet(s)) return;
    const p = parseStrengthSet(s);
    if (p && isBetterSet(p, best)) best = p;
  });

  if (!isBetterSet(parsed, best)) return null;
  return { ...parsed, previous: best };
}
