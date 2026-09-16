import { z } from "zod";
import type { GeneratedWorkout } from "@fitfamily-ai/shared";
import { AppError } from "../../utils/AppError";
import type { GenerateWorkoutInput } from "./types";

export const GeneratedWorkoutRawSchema = z.object({
  summary: z.string().trim().min(1),
  days: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        exercises: z
          .array(
            z.object({
              exerciseId: z.string().min(1),
              targetSets: z.number().int().min(1).max(10),
              targetReps: z.string().trim().min(1),
              restSeconds: z.number().int().min(0).max(600),
              notes: z.string(),
            }),
          )
          .min(1)
          .max(12),
      }),
    )
    .max(6),
});

export type GeneratedWorkoutRaw = z.infer<typeof GeneratedWorkoutRawSchema>;

function normalizeEquipment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/^mancuernas$/, "mancuerna")
    .replace(/^bandas$/, "banda");
}

// Restrictions apply before generation and when validating the answer.
export function prepareWorkoutInput(input: GenerateWorkoutInput): GenerateWorkoutInput {
  const ids = new Set(input.catalog.map((item) => item.id));
  if (ids.size !== input.catalog.length) {
    throw new AppError(
      400,
      "WORKOUT_DUPLICATE_CATALOG",
      "El catálogo tiene identificadores repetidos.",
    );
  }
  const excluded = new Set(input.excludedExerciseIds ?? []);
  if ([...excluded].some((id) => !ids.has(id))) {
    throw new AppError(
      400,
      "WORKOUT_UNKNOWN_EXCLUSION",
      "Un ejercicio excluido ya no existe en el catálogo. Vuelve a seleccionarlo.",
    );
  }
  const equipment = input.allowedEquipment?.map(normalizeEquipment);
  const catalog = input.catalog.filter((item) => {
    if (excluded.has(item.id)) return false;
    if (!equipment) return true;
    // "o" means alternative setups; "y" and "+" mean requirements.
    return (item.equipment ?? "")
      .split(/\s+o\s+|\//i)
      .some((alternative) =>
        alternative
          .split(/\s+y\s+|\+/i)
          .every((required) => equipment.includes(normalizeEquipment(required))),
      );
  });
  if (catalog.length === 0) {
    throw new AppError(
      422,
      "WORKOUT_NO_MATCHING_EXERCISES",
      "No hay ejercicios compatibles con el equipo y las exclusiones. Ajusta esas opciones para continuar.",
    );
  }
  return { ...input, catalog, excludedExerciseIds: [] };
}

// Reject the whole output instead of silently losing exercises or days.
export function enrichGeneratedWorkout(
  raw: GeneratedWorkoutRaw,
  input: GenerateWorkoutInput,
): GeneratedWorkout {
  const validation = GeneratedWorkoutRawSchema.safeParse(raw);
  if (!validation.success) {
    throw new AppError(
      502,
      "AI_INVALID_WORKOUT",
      "La IA devolvió una rutina incompleta o valores inválidos. Tu borrador se conserva; intenta nuevamente.",
    );
  }
  if (validation.data.days.length === 0) {
    throw new AppError(422, "AI_WORKOUT_CONSTRAINT_CONFLICT", validation.data.summary);
  }
  if (raw.days.length !== input.frequency) {
    throw new AppError(
      502,
      "AI_WORKOUT_DAY_COUNT",
      `La IA no respetó los ${input.frequency} días solicitados. Intenta nuevamente.`,
    );
  }
  const allowed = prepareWorkoutInput(input);
  const byId = new Map(allowed.catalog.map((item) => [item.id, item]));
  const workoutDays = validation.data.days.map((day, dayIndex) => {
    const used = new Set<string>();
    const workoutDayExercises = day.exercises.map((exercise, orderIndex) => {
      const item = byId.get(exercise.exerciseId);
      if (!item) {
        throw new AppError(
          502,
          "AI_WORKOUT_FORBIDDEN_EXERCISE",
          "La IA incluyó un ejercicio desconocido o incompatible con tus restricciones. Intenta nuevamente.",
        );
      }
      if (used.has(item.id)) {
        throw new AppError(
          502,
          "AI_WORKOUT_DUPLICATE_EXERCISE",
          "La IA repitió un ejercicio dentro del mismo día. Intenta nuevamente.",
        );
      }
      used.add(item.id);
      return {
        exerciseId: item.id,
        orderIndex,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        targetWeight: null,
        notes: exercise.notes.trim() || null,
        exercises: { id: item.id, name: item.name },
      };
    });
    return { name: input.dayNames?.[dayIndex] ?? day.name, dayIndex, workoutDayExercises };
  });
  return { summary: validation.data.summary, workoutDays };
}

export function buildMockWorkout(input: GenerateWorkoutInput): GeneratedWorkout {
  if (input.instructions?.trim()) {
    throw new AppError(
      503,
      "AI_PERSONALIZATION_UNAVAILABLE",
      "La IA está en modo de prueba y no puede interpretar tus instrucciones personales. Puedes crear la rutina manualmente o usar la plantilla básica de forma explícita.",
    );
  }
  const prepared = prepareWorkoutInput(input);
  const goal = input.goal.toLowerCase();
  const targetReps = /fuerza/.test(goal) ? "4-6" : /resist/.test(goal) ? "12-15" : "8-12";
  const restSeconds = /fuerza/.test(goal) ? 150 : /resist/.test(goal) ? 45 : 90;
  const perDay = Math.min(input.frequency >= 5 ? 4 : 5, prepared.catalog.length);
  return enrichGeneratedWorkout(
    {
      summary:
        "Plantilla de demostración sin IA. Respeta el equipo y las exclusiones seleccionados; no interpreta instrucciones personales ni garantiza la duración de cada sesión.",
      days: Array.from({ length: input.frequency }, (_, dayIndex) => ({
        name: input.dayNames?.[dayIndex] ?? `Día ${dayIndex + 1}`,
        exercises: Array.from({ length: perDay }, (_, index) => ({
          exerciseId: prepared.catalog[(dayIndex * perDay + index) % prepared.catalog.length]!.id,
          targetSets: 3,
          targetReps,
          restSeconds,
          notes: "",
        })),
      })),
    },
    input,
  );
}
