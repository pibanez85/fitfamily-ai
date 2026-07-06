import { z } from "zod";
import type { GeneratedWorkout } from "@fitfamily-ai/shared";
import type { GenerateWorkoutInput } from "./types";

// Forma cruda que devuelve el modelo (ejercicios por id + series/reps/descanso).
// El servidor la valida contra el catalogo y la enriquece con nombres.
export const GeneratedWorkoutRawSchema = z.object({
  summary: z.string(),
  days: z.array(
    z.object({
      name: z.string(),
      exercises: z.array(
        z.object({
          exerciseId: z.string(),
          targetSets: z.number().int(),
          targetReps: z.string(),
          restSeconds: z.number().int(),
          notes: z.string(),
        }),
      ),
    }),
  ),
});

export type GeneratedWorkoutRaw = z.infer<typeof GeneratedWorkoutRawSchema>;

// Convierte la salida cruda del modelo en la rutina final: descarta ejercicios
// que no esten en el catalogo (por id o por nombre), y agrega el nombre real.
export function enrichGeneratedWorkout(
  raw: GeneratedWorkoutRaw,
  input: GenerateWorkoutInput,
): GeneratedWorkout {
  const byId = new Map(input.catalog.map((item) => [item.id, item]));
  const byName = new Map(input.catalog.map((item) => [item.name.trim().toLowerCase(), item]));

  const workoutDays = raw.days.map((day, dayIndex) => {
    const workoutDayExercises = day.exercises
      .map((exercise) => {
        const item = byId.get(exercise.exerciseId) ?? byName.get(exercise.exerciseId.trim().toLowerCase());
        return item ? { exercise, item } : null;
      })
      .filter((value): value is NonNullable<typeof value> => value !== null)
      .map(({ exercise, item }, orderIndex) => ({
        exerciseId: item.id,
        orderIndex,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps || null,
        restSeconds: exercise.restSeconds,
        targetWeight: null,
        notes: exercise.notes || null,
        exercises: { id: item.id, name: item.name },
      }));

    return { name: day.name || `Dia ${dayIndex + 1}`, dayIndex, workoutDayExercises };
  });

  return { summary: raw.summary, workoutDays };
}

const dayNames = ["Dia A", "Dia B", "Dia C", "Dia D", "Dia E", "Dia F"];

// Rutina determinista sin IA (para el MockProvider): reparte el catalogo en los
// dias pedidos con series/reps por objetivo.
export function buildMockWorkout(input: GenerateWorkoutInput): GeneratedWorkout {
  const goal = input.goal.toLowerCase();
  const targetReps = /fuerza/.test(goal) ? "4-6" : /resist/.test(goal) ? "12-15" : "8-12";
  const restSeconds = /fuerza/.test(goal) ? 150 : /resist/.test(goal) ? 45 : 90;
  const perDay = input.frequency >= 5 ? 4 : 5;

  const workoutDays = Array.from({ length: input.frequency }, (_, dayIndex) => {
    const slice = input.catalog.filter((_, index) => index % input.frequency === dayIndex).slice(0, perDay);
    const chosen = slice.length ? slice : input.catalog.slice(dayIndex * perDay, dayIndex * perDay + perDay);
    return {
      name: dayNames[dayIndex] ?? `Dia ${dayIndex + 1}`,
      dayIndex,
      workoutDayExercises: chosen.map((item, orderIndex) => ({
        exerciseId: item.id,
        orderIndex,
        targetSets: 3,
        targetReps,
        restSeconds,
        targetWeight: null,
        notes: null,
        exercises: { id: item.id, name: item.name },
      })),
    };
  });

  return {
    summary:
      "Rutina base generada sin IA (modo mock). Reparte los ejercicios del catalogo por dias; revisa y ajusta segun tu objetivo.",
    workoutDays,
  };
}
