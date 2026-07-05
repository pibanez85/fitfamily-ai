import type { Profile } from "@fitfamily-ai/shared";

// Metas diarias de calorías y macros estimadas desde el perfil (sexo, edad,
// estatura, objetivo, nivel de actividad) y el peso más reciente registrado.
// Formula base: Mifflin-St Jeor. Es una referencia educativa para partir,
// no una prescripcion medica.

export type NutritionGoals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  // true si se calculo con datos del perfil; false si usamos valores genericos.
  personalized: boolean;
  explanation: string;
};

const FALLBACK_GOALS: NutritionGoals = {
  calories: 2000,
  proteinG: 120,
  carbsG: 230,
  fatG: 65,
  personalized: false,
  explanation: "Meta generica. Completa tu perfil (sexo, estatura, objetivo) y registra tu peso para personalizarla.",
};

type GoalDirection = "deficit" | "surplus" | "maintain";

function goalDirection(goal: string | null | undefined): GoalDirection {
  const text = (goal ?? "").toLowerCase();
  if (/(perder|bajar|grasa|deficit|adelgazar)/.test(text)) return "deficit";
  if (/(ganar|masa|volumen|subir|fuerza)/.test(text)) return "surplus";
  return "maintain";
}

function activityFactor(activityLevel: string | null | undefined): number {
  const text = (activityLevel ?? "").toLowerCase();
  if (/(5|6|7|diario|intenso)/.test(text)) return 1.65;
  if (/(3-4|4)/.test(text)) return 1.55;
  if (/3/.test(text)) return 1.5;
  if (/(1|2|sedentario|poco)/.test(text)) return 1.4;
  return 1.5;
}

function ageFromBirthdate(birthdate: string | null | undefined): number {
  if (!birthdate) return 30;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return 30;
  const diff = Date.now() - birth.getTime();
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 14 && age <= 90 ? age : 30;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function computeNutritionGoals(
  profile: Profile | null | undefined,
  latestWeightKg: number | null | undefined,
): NutritionGoals {
  if (!profile) return FALLBACK_GOALS;

  const isMale = (profile.sex ?? "").toLowerCase().startsWith("m");
  const weight = latestWeightKg ?? (isMale ? 75 : 62);
  const height = profile.heightCm ?? (isMale ? 172 : 160);
  const age = ageFromBirthdate(profile.birthdate);
  const direction = goalDirection(profile.goal);

  // BMR Mifflin-St Jeor + factor de actividad.
  const bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);
  const maintenance = bmr * activityFactor(profile.activityLevel);

  const adjusted =
    direction === "deficit" ? maintenance * 0.85 : direction === "surplus" ? maintenance * 1.08 : maintenance;
  const calories = roundTo(Math.max(adjusted, 1300), 50);

  // Proteína por kg segun objetivo (rangos tipicos para entrenamiento de fuerza).
  const proteinPerKg = direction === "deficit" ? 2 : direction === "surplus" ? 1.8 : 1.7;
  const proteinG = roundTo(Math.min(weight * proteinPerKg, 220), 5);

  // Grasas ~27% de las calorías; el resto va a carbohidratos.
  const fatG = roundTo((calories * 0.27) / 9, 5);
  const carbsG = roundTo(Math.max((calories - proteinG * 4 - fatG * 9) / 4, 80), 5);

  const goalLabel =
    direction === "deficit" ? "bajar grasa" : direction === "surplus" ? "ganar musculo/fuerza" : "mantener";
  const weightNote = latestWeightKg ? `tu peso de ${latestWeightKg} kg` : "un peso estimado (registra el tuyo en Métricas)";

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    personalized: true,
    explanation: `Meta estimada para ${goalLabel}, usando ${weightNote}, tu estatura y nivel de actividad.`,
  };
}
