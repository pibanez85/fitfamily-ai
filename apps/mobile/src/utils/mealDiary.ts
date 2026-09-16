import type { CreateMealInput, MacroTotals, Meal, MealItemInput } from "@fitfamily-ai/shared";
import { localDateKey, localNoonIso } from "./localDate";

export type DiaryMeal = Meal & { mealItems?: MealItemInput[] };
export const mealTypes = ["breakfast", "lunch", "dinner", "snack", "other"] as const;
export const mealLabels: Record<Meal["mealType"], string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Colación",
  other: "Otros",
};

export function mealsOnDate(
  meals: DiaryMeal[],
  date: string,
  profileId: string | null,
): DiaryMeal[] {
  return meals.filter(
    (meal) => meal.profileId === profileId && localDateKey(meal.eatenAt) === date,
  );
}

export function sumMeals(meals: DiaryMeal[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (sum, meal) => ({
      calories: sum.calories + (meal.calories ?? 0),
      proteinG: sum.proteinG + (meal.proteinG ?? 0),
      carbsG: sum.carbsG + (meal.carbsG ?? 0),
      fatG: sum.fatG + (meal.fatG ?? 0),
      fiberG: sum.fiberG + (meal.fiberG ?? 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

export function copyMealToDate(meal: DiaryMeal, date: string): CreateMealInput {
  return {
    name: meal.name,
    mealType: meal.mealType,
    eatenAt: localNoonIso(date),
    calories: meal.calories,
    proteinG: meal.proteinG,
    carbsG: meal.carbsG,
    fatG: meal.fatG,
    fiberG: meal.fiberG,
    notes: meal.notes,
    items: (meal.mealItems ?? []).map((item) => ({
      name: item.name,
      estimatedPortion: item.estimatedPortion,
      calories: item.calories,
      proteinG: item.proteinG,
      carbsG: item.carbsG,
      fatG: item.fatG,
      fiberG: item.fiberG,
      confidence: item.confidence,
    })),
  };
}
