export type WorkoutSetDraft = {
  reps: string;
  weight: string;
  rpe: string;
  restSeconds: string;
  notes: string;
  done: boolean;
};
export type SessionExercise = {
  exerciseId: string;
  exerciseName: string;
  exerciseNote: string;
  sets: WorkoutSetDraft[];
};
export type RestClock = { deadline: number | null; pausedSeconds: number; label: string | null };

export const emptyRestClock: RestClock = { deadline: null, pausedSeconds: 0, label: null };
export function remainingRestSeconds(clock: RestClock, now = Date.now()): number {
  return clock.deadline === null
    ? Math.max(0, clock.pausedSeconds)
    : Math.max(0, Math.ceil((clock.deadline - now) / 1000));
}
export function workoutDraftKey(profileId: string, workoutId: string, dayId: string): string {
  return `fitfamily:workout-draft:v1:${profileId}:${workoutId}:${dayId}`;
}
function numeric(value: string): number | null {
  const text = value.trim().replace(",", ".");
  const result = text && /^\d+(\.\d+)?$/.test(text) ? Number(text) : null;
  return result !== null && Number.isFinite(result) ? result : null;
}
export function validateCompletedSet(set: WorkoutSetDraft): string | null {
  const reps = numeric(set.reps);
  if (reps === null || !Number.isInteger(reps) || reps < 1)
    return "Ingresa las repeticiones realizadas (un entero mayor que cero).";
  if (set.weight.trim() && numeric(set.weight) === null)
    return "El peso debe ser un número positivo o cero; puedes usar coma decimal.";
  const rpe = numeric(set.rpe);
  if (set.rpe.trim() && (rpe === null || rpe > 10)) return "El RPE debe estar entre 0 y 10.";
  const rest = numeric(set.restSeconds);
  if (set.restSeconds.trim() && (rest === null || !Number.isInteger(rest)))
    return "El descanso debe ser un número entero de segundos.";
  return null;
}
export function completedSessionSets(exercises: SessionExercise[]) {
  return exercises.flatMap((exercise) =>
    exercise.sets.flatMap((set, index) => {
      if (!set.done) return [];
      const invalid = validateCompletedSet(set);
      if (invalid) throw new Error(`${exercise.exerciseName}, serie ${index + 1}: ${invalid}`);
      if (!exercise.exerciseId)
        throw new Error(`${exercise.exerciseName}: falta el identificador del ejercicio.`);
      const notes = [set.notes.trim(), exercise.exerciseNote.trim()].filter(Boolean).join("\n");
      if (notes.length > 1000)
        throw new Error(`${exercise.exerciseName}: acorta las notas a 1000 caracteres.`);
      return [
        {
          exerciseId: exercise.exerciseId,
          setIndex: index + 1,
          reps: numeric(set.reps)!,
          weight: numeric(set.weight),
          rpe: numeric(set.rpe),
          restSeconds: numeric(set.restSeconds),
          notes: notes || null,
        },
      ];
    }),
  );
}
export function parseSessionEffort(value: string): number | null {
  if (!value.trim()) return null;
  const number = numeric(value);
  if (number === null || !Number.isInteger(number) || number < 1 || number > 10)
    throw new Error("El esfuerzo general debe ser un entero entre 1 y 10.");
  return number;
}
export function validStoredSet(value: unknown): value is WorkoutSetDraft {
  if (!value || typeof value !== "object") return false;
  const set = value as Record<string, unknown>;
  return (
    ["reps", "weight", "rpe", "restSeconds", "notes"].every(
      (field) => typeof set[field] === "string",
    ) && typeof set.done === "boolean"
  );
}
