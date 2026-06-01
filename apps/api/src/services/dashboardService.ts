import type { DashboardResponse } from "@fitfamily-ai/shared";
import { AppError } from "../utils/AppError";
import type { DataService } from "./dataService";

export class DashboardService {
  constructor(private readonly data: DataService) {}

  async build(profileId: string): Promise<DashboardResponse> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [workoutLogs, meals, metrics] = await Promise.all([
      this.data.client
        .from("workout_logs")
        .select("id, started_at")
        .eq("profile_id", profileId)
        .gte("started_at", sevenDaysAgo),
      this.data.client
        .from("meals")
        .select("id, calories, protein_g, eaten_at")
        .eq("profile_id", profileId)
        .gte("eaten_at", sevenDaysAgo),
      this.data.client
        .from("body_metrics")
        .select("weight_kg, measured_at")
        .eq("profile_id", profileId)
        .order("measured_at", { ascending: false })
        .limit(1),
    ]);

    for (const result of [workoutLogs, meals, metrics]) {
      if (result.error) {
        throw new AppError(500, "DASHBOARD_QUERY_FAILED", result.error.message);
      }
    }

    const mealRows = meals.data ?? [];
    const calories = mealRows
      .map((meal) => Number(meal.calories))
      .filter((value) => Number.isFinite(value));
    const proteins = mealRows
      .map((meal) => Number(meal.protein_g))
      .filter((value) => Number.isFinite(value));

    const logsForProgress = await this.data.client
      .from("workout_logs")
      .select("id")
      .eq("profile_id", profileId)
      .gte("started_at", thirtyDaysAgo);

    if (logsForProgress.error) {
      throw new AppError(500, "DASHBOARD_QUERY_FAILED", logsForProgress.error.message);
    }

    const logIds = (logsForProgress.data ?? []).map((log) => log.id);
    const progressByExercise = new Map<
      string,
      {
        exerciseId: string;
        exerciseName: string;
        latestWeight: number | null;
        latestReps: number | null;
        loggedAt: string;
      }
    >();

    if (logIds.length > 0) {
      const sets = await this.data.client
        .from("workout_log_sets")
        .select("exercise_id, reps, weight, created_at, exercises(name)")
        .in("workout_log_id", logIds)
        .order("created_at", { ascending: false })
        .limit(80);

      if (sets.error) {
        throw new AppError(500, "DASHBOARD_QUERY_FAILED", sets.error.message);
      }

      for (const set of sets.data ?? []) {
        if (!progressByExercise.has(set.exercise_id)) {
          const exercise = Array.isArray(set.exercises) ? set.exercises[0] : set.exercises;
          progressByExercise.set(set.exercise_id, {
            exerciseId: set.exercise_id,
            exerciseName: exercise?.name ?? "Ejercicio",
            latestWeight: set.weight === null ? null : Number(set.weight),
            latestReps: set.reps === null ? null : Number(set.reps),
            loggedAt: set.created_at,
          });
        }
      }
    }

    const alerts: string[] = [];
    if ((workoutLogs.data?.length ?? 0) === 0) {
      alerts.push("No hay entrenamientos registrados en los ultimos 7 dias.");
    }
    if (mealRows.length === 0) {
      alerts.push("No hay comidas registradas esta semana; el dashboard nutricional sera limitado.");
    }

    return {
      workoutsLast7Days: workoutLogs.data?.length ?? 0,
      mealsLast7Days: mealRows.length,
      averageCalories: average(calories),
      averageProteinG: average(proteins),
      latestWeightKg:
        metrics.data?.[0]?.weight_kg === null || metrics.data?.[0]?.weight_kg === undefined
          ? null
          : Number(metrics.data[0].weight_kg),
      recentExerciseProgress: [...progressByExercise.values()].slice(0, 8),
      alerts,
    };
  }
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}
