import type { WorkoutLog } from "@fitfamily-ai/shared";

export type WorkoutLogSetDetail = {
  id?: string;
  exerciseId: string;
  setIndex: number;
  reps?: number | null;
  weight?: number | null;
  rpe?: number | null;
  restSeconds?: number | null;
  notes?: string | null;
  exercises?: {
    id?: string;
    name?: string | null;
    category?: string | null;
    equipment?: string | null;
    primaryMuscles?: string[] | null;
    secondaryMuscles?: string[] | null;
  } | null;
};

export type WorkoutLogDetail = WorkoutLog & {
  workoutLogSets?: WorkoutLogSetDetail[];
  workouts?: { name?: string | null } | null;
  workoutDays?: { name?: string | null } | null;
};

export type ExerciseProgressSummary = {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: string;
  sessions: number;
  sets: number;
  totalVolume: number;
  bestWeight: number;
  bestReps: number;
  bestSetVolume: number;
  averageRpe: number | null;
  latestWeight: number;
  previousWeight: number;
  weightDelta: number;
  trend: Array<{ label: string; value: number; weight: number }>;
};

export function getLogSets(log: WorkoutLogDetail): WorkoutLogSetDetail[] {
  return [...(log.workoutLogSets ?? [])].sort((a, b) => a.setIndex - b.setIndex);
}

export function getExerciseName(set: WorkoutLogSetDetail): string {
  return set.exercises?.name?.trim() || "Ejercicio";
}

export function getPrimaryMuscle(set: WorkoutLogSetDetail): string {
  return set.exercises?.primaryMuscles?.[0] ?? "General";
}

export function setVolume(set: WorkoutLogSetDetail): number {
  const reps = set.reps ?? 0;
  const weight = set.weight ?? 0;
  return reps > 0 && weight > 0 ? reps * weight : 0;
}

export function logVolume(log: WorkoutLogDetail): number {
  return getLogSets(log).reduce((sum, set) => sum + setVolume(set), 0);
}

export function logDurationMinutes(log: WorkoutLogDetail): number | null {
  if (!log.endedAt) return null;
  const start = new Date(log.startedAt).getTime();
  const end = new Date(log.endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60000);
}

export function allWorkoutSets(logs: WorkoutLogDetail[]) {
  return logs.flatMap((log) =>
    getLogSets(log).map((set) => ({
      log,
      set,
      volume: setVolume(set),
      exerciseName: getExerciseName(set),
      primaryMuscle: getPrimaryMuscle(set),
    })),
  );
}

export function formatKg(value: number): string {
  if (!value) return "-";
  return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`;
}

export function formatVolume(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k kg`;
  return `${Math.round(value)} kg`;
}

export function buildExerciseProgress(logs: WorkoutLogDetail[]): ExerciseProgressSummary[] {
  const groups = new Map<string, ReturnType<typeof allWorkoutSets>>();
  const entries = allWorkoutSets(logs).filter(({ set }) => set.reps || set.weight);

  for (const entry of entries) {
    const key = entry.set.exerciseId || entry.exerciseName;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([exerciseId, group]) => {
      const sorted = [...group].sort(
        (a, b) => new Date(a.log.startedAt).getTime() - new Date(b.log.startedAt).getTime(),
      );
      const sessionDates = new Set(sorted.map((entry) => entry.log.id));
      const weights = sorted.map((entry) => entry.set.weight ?? 0).filter((weight) => weight > 0);
      const reps = sorted.map((entry) => entry.set.reps ?? 0).filter((rep) => rep > 0);
      const rpes = sorted.map((entry) => entry.set.rpe ?? 0).filter((rpe) => rpe > 0);
      const trendByLog = new Map<string, { label: string; value: number; weight: number }>();

      for (const entry of sorted) {
        const current = trendByLog.get(entry.log.id);
        const label = new Date(entry.log.startedAt).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
        });
        trendByLog.set(entry.log.id, {
          label,
          value: (current?.value ?? 0) + entry.volume,
          weight: Math.max(current?.weight ?? 0, entry.set.weight ?? 0),
        });
      }

      const trend = [...trendByLog.values()].slice(-6);
      const latestWeight = trend.at(-1)?.weight ?? 0;
      const previousWeight = trend.length > 1 ? trend.at(-2)?.weight ?? 0 : 0;

      return {
        exerciseId,
        exerciseName: sorted[0]?.exerciseName ?? "Ejercicio",
        primaryMuscle: sorted[0]?.primaryMuscle ?? "General",
        sessions: sessionDates.size,
        sets: sorted.length,
        totalVolume: sorted.reduce((sum, entry) => sum + entry.volume, 0),
        bestWeight: Math.max(0, ...weights),
        bestReps: Math.max(0, ...reps),
        bestSetVolume: Math.max(0, ...sorted.map((entry) => entry.volume)),
        averageRpe: rpes.length
          ? Math.round((rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length) * 10) / 10
          : null,
        latestWeight,
        previousWeight,
        weightDelta: latestWeight - previousWeight,
        trend,
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume || a.exerciseName.localeCompare(b.exerciseName));
}
