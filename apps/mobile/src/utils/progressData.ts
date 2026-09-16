import type { BodyMetric, Meal } from "@fitfamily-ai/shared";
import { buildExerciseProgress, logVolume, type WorkoutLogDetail } from "./workoutAnalytics";
import { addLocalDays, localDateKey, parseLocalDate } from "./localDate";

type Period = "7d" | "30d" | "90d";
const PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90 };
const WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

export type VolumeBar = { label: string; value: number };
export type NutritionDay = { day: string; calories: number; protein: number; workout: boolean };
export type WeightPoint = { label: string; weight: number; fat: number | null };
export type PersonalRecord = { exercise: string; kg: number; date: string; deltaKg: number };

export type ProgressData = {
  sessions: number;
  sessionsPrev: number;
  avgCalories: number | null;
  avgProtein: number | null;
  latestWeight: number | null;
  latestFat: number | null;
  weightDelta: number | null;
  volumeBars: VolumeBar[];
  volumeTrendPct: number | null;
  nutritionWeek: NutritionDay[];
  cross: { workoutCal: number; restCal: number; workoutProt: number; restProt: number } | null;
  weightPoints: WeightPoint[];
  personalRecords: PersonalRecord[];
  hasAnyData: boolean;
};

function dayKey(value: string): string {
  return new Date(value).toDateString();
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

export function buildProgressData(
  logs: WorkoutLogDetail[],
  meals: Meal[],
  metrics: BodyMetric[],
  period: Period,
  today = localDateKey(),
): ProgressData {
  const periodDays = PERIOD_DAYS[period];
  const cutoff = addLocalDays(today, 1 - periodDays);
  const prevCutoff = addLocalDays(cutoff, -periodDays);

  const periodLogs = logs
    .filter((log) => localDateKey(log.startedAt) >= cutoff && localDateKey(log.startedAt) <= today)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const prevLogs = logs.filter((log) => {
    const time = localDateKey(log.startedAt);
    return time >= prevCutoff && time < cutoff;
  });

  // Volumen de las últimas sesiones del periodo.
  const volumeBars: VolumeBar[] = periodLogs.slice(-7).map((log) => ({
    label: WEEKDAY_LETTERS[new Date(log.startedAt).getDay()]!,
    value: logVolume(log),
  }));

  // Tendencia de volumen: primera mitad vs segunda mitad del periodo.
  let volumeTrendPct: number | null = null;
  const volumes = periodLogs.map((log) => logVolume(log)).filter((value) => value > 0);
  if (volumes.length >= 4) {
    const half = Math.floor(volumes.length / 2);
    const firstAvg = volumes.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const secondAvg = volumes.slice(half).reduce((a, b) => a + b, 0) / (volumes.length - half);
    if (firstAvg > 0) volumeTrendPct = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  }

  // Comidas del periodo agrupadas por día.
  const mealsByDay = new Map<string, { calories: number; protein: number }>();
  for (const meal of meals) {
    if (localDateKey(meal.eatenAt) < cutoff || localDateKey(meal.eatenAt) > today) continue;
    const key = dayKey(meal.eatenAt);
    const entry = mealsByDay.get(key) ?? { calories: 0, protein: 0 };
    entry.calories += meal.calories ?? 0;
    entry.protein += meal.proteinG ?? 0;
    mealsByDay.set(key, entry);
  }
  const dailyTotals = [...mealsByDay.values()];
  const avgCalories = dailyTotals.length
    ? Math.round(dailyTotals.reduce((sum, entry) => sum + entry.calories, 0) / dailyTotals.length)
    : null;
  const avgProtein = dailyTotals.length
    ? Math.round(dailyTotals.reduce((sum, entry) => sum + entry.protein, 0) / dailyTotals.length)
    : null;

  // Semana calendario (para el gráfico de nutrición).
  const workoutDayKeys = new Set(logs.map((log) => dayKey(log.startedAt)));
  const allMealsByDay = new Map<string, { calories: number; protein: number }>();
  for (const meal of meals) {
    const key = dayKey(meal.eatenAt);
    const entry = allMealsByDay.get(key) ?? { calories: 0, protein: 0 };
    entry.calories += meal.calories ?? 0;
    entry.protein += meal.proteinG ?? 0;
    allMealsByDay.set(key, entry);
  }
  const nutritionWeek: NutritionDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = parseLocalDate(addLocalDays(today, index - 6));
    const key = date.toDateString();
    const entry = allMealsByDay.get(key);
    return {
      day: WEEKDAY_LETTERS[date.getDay()]!,
      calories: Math.round(entry?.calories ?? 0),
      protein: Math.round(entry?.protein ?? 0),
      workout: workoutDayKeys.has(key),
    };
  });

  // Correlación entreno vs descanso (solo días con comidas registradas).
  const workoutDayTotals: Array<{ calories: number; protein: number }> = [];
  const restDayTotals: Array<{ calories: number; protein: number }> = [];
  for (const [key, entry] of mealsByDay) {
    (workoutDayKeys.has(key) ? workoutDayTotals : restDayTotals).push(entry);
  }
  const avgOf = (
    items: Array<{ calories: number; protein: number }>,
    field: "calories" | "protein",
  ) => Math.round(items.reduce((sum, item) => sum + item[field], 0) / items.length);
  const cross =
    workoutDayTotals.length > 0 && restDayTotals.length > 0
      ? {
          workoutCal: avgOf(workoutDayTotals, "calories"),
          restCal: avgOf(restDayTotals, "calories"),
          workoutProt: avgOf(workoutDayTotals, "protein"),
          restProt: avgOf(restDayTotals, "protein"),
        }
      : null;

  // Peso corporal: registros del periodo (o los últimos 6 si hay pocos).
  const sortedMetrics = metrics
    .filter((metric) => metric.weightKg != null && localDateKey(metric.measuredAt) <= today)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  const periodMetrics = sortedMetrics.filter((metric) => localDateKey(metric.measuredAt) >= cutoff);
  const weightMetrics = periodMetrics.length >= 2 ? periodMetrics : sortedMetrics.slice(-6);
  const weightPoints: WeightPoint[] = weightMetrics.map((metric) => ({
    label: shortDate(metric.measuredAt),
    weight: metric.weightKg!,
    fat: metric.bodyFatPercentage ?? null,
  }));
  const latestMetric = sortedMetrics[sortedMetrics.length - 1] ?? null;
  const latestWeight = latestMetric?.weightKg ?? null;
  const latestFat = latestMetric?.bodyFatPercentage ?? null;
  const weightDelta =
    periodMetrics.length >= 2
      ? Math.round((periodMetrics.at(-1)!.weightKg! - periodMetrics[0]!.weightKg!) * 10) / 10
      : null;

  // Récords personales desde las series registradas.
  const personalRecords: PersonalRecord[] = buildExerciseProgress(periodLogs)
    .filter((summary) => summary.bestWeight > 0)
    .sort((a, b) => b.bestWeight - a.bestWeight)
    .slice(0, 4)
    .map((summary) => {
      const bestEntry = [...summary.trend]
        .reverse()
        .find((entry) => entry.weight === summary.bestWeight);
      return {
        exercise: summary.exerciseName,
        kg: summary.bestWeight,
        date: bestEntry?.label ?? "",
        deltaKg: Math.round(summary.weightDelta * 10) / 10,
      };
    });

  return {
    sessions: periodLogs.length,
    sessionsPrev: prevLogs.length,
    avgCalories,
    avgProtein,
    latestWeight,
    latestFat,
    weightDelta,
    volumeBars,
    volumeTrendPct,
    nutritionWeek,
    cross,
    weightPoints,
    personalRecords,
    hasAnyData: logs.length > 0 || meals.length > 0 || metrics.length > 0,
  };
}
