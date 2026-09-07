/**
 * `Date.prototype.toISOString()` converte sempre para UTC antes de
 * formatar. Isso é o que se quer para timestamps, mas nunca para "que dia é
 * hoje" — num fuso horário à frente de UTC (ex: Lisboa no verão, UTC+1),
 * a meia-noite local já é o dia anterior em UTC, o que faz a data "perder"
 * ou "duplicar" um dia consoante a hora a que se usa a app.
 *
 * Usa sempre isto (nunca toISOString) para datas de calendário — registo de
 * treinos, peso, dia da semana, etc.
 */
export function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocal() {
  return formatLocalDate(new Date());
}
