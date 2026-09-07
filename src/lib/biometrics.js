/**
 * Cálculos de biometria.
 *
 * Funções puras, sem dependências de UI — portadas diretamente da versão web
 * para que os resultados sejam exatamente os mesmos nas duas plataformas.
 */

/** Idade em anos completos a partir de uma data ISO (YYYY-MM-DD). */
export function computeAge(birthdateStr) {
  const b = new Date(birthdateStr);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const beforeBirthday =
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate());
  if (beforeBirthday) age--;
  return age;
}

/**
 * Estimativa de gordura corporal (método da Marinha dos EUA).
 *
 * Para homens usa pescoço + cintura; para mulheres inclui também a anca.
 * Devolve null se faltarem medidas (são opcionais na app).
 *
 * @param {boolean} gender true = masculino
 */
export function computeBodyFat(gender, heightM, waist, neck, hip) {
  if (gender) {
    if (waist == null || neck == null) return null;
  } else if (waist == null || neck == null || hip == null) {
    return null;
  }

  const heightCm = heightM * 100;
  let bf;
  if (gender) {
    bf =
      495 /
        (1.0324 -
          0.19077 * Math.log10(waist - neck) +
          0.15456 * Math.log10(heightCm)) -
      450;
  } else {
    bf =
      495 /
        (1.29579 -
          0.35004 * Math.log10(waist + hip - neck) +
          0.221 * Math.log10(heightCm)) -
      450;
  }

  if (!isFinite(bf)) return null;
  return Math.round(bf * 100) / 100;
}

export function classifyBodyFat(bf, gender) {
  if (bf == null) return '';
  if (gender) {
    if (bf <= 7) return 'Definido';
    if (bf <= 13) return 'Atleta';
    if (bf <= 17) return 'Fitness';
    if (bf <= 25) return 'Médio';
    return 'Elevado';
  }
  if (bf <= 13) return 'Definido';
  if (bf <= 20) return 'Atleta';
  if (bf <= 24) return 'Fitness';
  if (bf <= 32) return 'Médio';
  return 'Elevado';
}

/** Metabolismo basal (Harris-Benedict revista). */
export function computeBMR(gender, weightKg, heightM, age) {
  const heightCm = heightM * 100;
  if (gender) {
    return Math.round(88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age);
  }
  return Math.round(447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age);
}

/** Calorias correspondentes a um conjunto de macros (4/4/9 kcal por grama). */
export function caloriesFromMacros({ protein, carbs, fat }) {
  return Math.round((protein || 0) * 4 + (carbs || 0) * 4 + (fat || 0) * 9);
}

/**
 * Água recomendada por dia, em mililitros — estimativa geral de ~35ml por
 * kg de peso corporal (referência comum, não uma recomendação médica
 * personalizada). Sem peso registado, usa um valor de referência genérico.
 */
export function recommendedWaterMl(weightKg) {
  if (!weightKg) return 2000;
  return Math.round((weightKg * 35) / 50) * 50; // arredonda aos 50ml
}
