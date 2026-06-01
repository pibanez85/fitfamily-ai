import type { DataService } from "./dataService";

export type ChatContextSnapshot = {
  profile: {
    displayName?: string | null;
    goal?: string | null;
    activityLevel?: string | null;
  } | null;
  workoutsLast30Days: number;
  mealsLast30Days: Array<{
    meal_type?: string | null;
    name?: string | null;
    calories?: number | string | null;
    protein_g?: number | string | null;
    eaten_at?: string | null;
  }>;
  latestMetric?: {
    weight_kg?: number | string | null;
    measured_at?: string | null;
  } | null;
  preferences?: {
    dietary?: unknown;
    training?: unknown;
  };
};

export function formatChatContext(snapshot: ChatContextSnapshot): string {
  const profile = snapshot.profile;
  const mealSummary =
    snapshot.mealsLast30Days.length === 0
      ? "Sin comidas registradas."
      : snapshot.mealsLast30Days
          .slice(0, 12)
          .map((meal) => {
            const calories = meal.calories ? `${meal.calories} kcal` : "kcal sin dato";
            const protein = meal.protein_g ? `${meal.protein_g} g proteina` : "proteina sin dato";
            return `- ${meal.eaten_at ?? "sin fecha"} ${meal.meal_type ?? "comida"} ${meal.name ?? "sin nombre"}: ${calories}, ${protein}`;
          })
          .join("\n");

  const latestWeight = snapshot.latestMetric?.weight_kg
    ? `${snapshot.latestMetric.weight_kg} kg el ${snapshot.latestMetric.measured_at ?? "sin fecha"}`
    : "Sin peso registrado.";

  return `
Perfil:
- Nombre: ${profile?.displayName ?? "sin dato"}
- Objetivo: ${profile?.goal ?? "sin dato"}
- Actividad: ${profile?.activityLevel ?? "sin dato"}

Entrenamiento:
- Entrenamientos registrados ultimos 30 dias: ${snapshot.workoutsLast30Days}

Nutricion:
${mealSummary}

Metricas:
- Ultimo peso: ${latestWeight}

Preferencias:
- Dietarias: ${JSON.stringify(snapshot.preferences?.dietary ?? null)}
- Entrenamiento: ${JSON.stringify(snapshot.preferences?.training ?? null)}
`.trim();
}

export class ChatContextService {
  constructor(private readonly data: DataService) {}

  async build(profileId: string): Promise<string> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [profile, workoutLogs, meals, metrics] = await Promise.all([
      this.data.client
        .from("profiles")
        .select("display_name, goal, activity_level, dietary_preferences, training_preferences")
        .eq("id", profileId)
        .single(),
      this.data.client
        .from("workout_logs")
        .select("id")
        .eq("profile_id", profileId)
        .gte("started_at", thirtyDaysAgo),
      this.data.client
        .from("meals")
        .select("meal_type, name, calories, protein_g, eaten_at")
        .eq("profile_id", profileId)
        .gte("eaten_at", thirtyDaysAgo)
        .order("eaten_at", { ascending: false })
        .limit(30),
      this.data.client
        .from("body_metrics")
        .select("weight_kg, measured_at")
        .eq("profile_id", profileId)
        .order("measured_at", { ascending: false })
        .limit(1),
    ]);

    if (profile.error) throw profile.error;
    if (workoutLogs.error) throw workoutLogs.error;
    if (meals.error) throw meals.error;
    if (metrics.error) throw metrics.error;

    return formatChatContext({
      profile: {
        displayName: profile.data.display_name,
        goal: profile.data.goal,
        activityLevel: profile.data.activity_level,
      },
      workoutsLast30Days: workoutLogs.data?.length ?? 0,
      mealsLast30Days: meals.data ?? [],
      latestMetric: metrics.data?.[0] ?? null,
      preferences: {
        dietary: profile.data.dietary_preferences,
        training: profile.data.training_preferences,
      },
    });
  }
}
