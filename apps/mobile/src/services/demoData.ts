import {
  FOOD_ANALYSIS_DISCLAIMER,
  EXERCISE_LIBRARY,
  GYM_MACHINE_DISCLAIMER,
  HEALTH_DISCLAIMER,
  enrichExerciseRecord,
  searchFoods,
  type FoodCatalogItem,
  type FoodSearchResponse,
  type AIChatResult,
  type BodyMetric,
  type CreateBodyMetricInput,
  type CreateMealInput,
  type CreateProfileInput,
  type CreateWorkoutInput,
  type CreateWorkoutLogInput,
  type UpdateWorkoutInput,
  type DashboardResponse,
  type FoodPhotoAnalysis,
  type GymMachineAnalysis,
  type Meal,
  type Profile,
  type UpdateProfileInput,
  type Workout,
  type WorkoutLog,
} from "@fitfamily-ai/shared";

// ---------------------------------------------------------------------------
// Datos simulados en memoria para el modo demo (sin Supabase ni API).
// Persisten mientras la app esta abierta.
// ---------------------------------------------------------------------------

let counter = 1;
function uid(): string {
  const n = (counter++).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${n}`;
}

const now = () => new Date().toISOString();
const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

type DemoWorkoutDetail = Workout & {
  workoutDays: Array<{
    id: string;
    name: string;
    dayIndex: number;
    workoutDayExercises: Array<{
      id: string;
      exerciseId?: string;
      targetSets: number | null;
      targetReps: string | null;
      restSeconds?: number | null;
      targetWeight?: number | null;
      exercises: { id?: string; name: string } | null;
    }>;
  }>;
};

const exercises = EXERCISE_LIBRARY.map((exercise) =>
  enrichExerciseRecord({
    id: uid(),
    name: exercise.name,
    category: "strength",
    primaryMuscles: exercise.muscleGroupIds,
    secondaryMuscles: [],
    equipment: exercise.equipment,
    instructions: exercise.rationale,
    safetyNotes: exercise.tier === "situacional" ? "Usar solo si se ajusta a tu cuerpo y tecnica." : null,
    createdAt: now(),
  }),
);

function createDemoDayExercise(name: string, targetSets: number, targetReps: string, restSeconds: number) {
  const exercise = exercises.find((entry) => entry.name === name) ?? exercises[0]!;
  return {
    id: uid(),
    exerciseId: exercise.id,
    targetSets,
    targetReps,
    restSeconds,
    targetWeight: null,
    exercises: { id: exercise.id, name: exercise.name },
  };
}

const PROFILE_PATO = uid();
const PROFILE_YAYI = uid();

const profiles: Profile[] = [
  {
    id: PROFILE_PATO,
    userId: "00000000-0000-4000-8000-000000000001",
    displayName: "Pato",
    birthdate: "1990-05-12",
    sex: "masculino",
    heightCm: 178,
    goal: "Ganar fuerza y mantener peso",
    activityLevel: "3-4 entrenamientos/semana",
    dietaryPreferences: null,
    trainingPreferences: null,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(2),
  },
  {
    id: PROFILE_YAYI,
    userId: "00000000-0000-4000-8000-000000000001",
    displayName: "Yayi",
    birthdate: "1992-09-03",
    sex: "femenino",
    heightCm: 164,
    goal: "Tonificar y mejorar resistencia",
    activityLevel: "3 entrenamientos/semana",
    dietaryPreferences: null,
    trainingPreferences: null,
    createdAt: daysAgo(38),
    updatedAt: daysAgo(5),
  },
];

function makeWorkout(profileId: string, name: string, goal: string): DemoWorkoutDetail {
  return {
    id: uid(),
    profileId,
    name,
    description: "Rutina de cuerpo completo, 3 dias por semana.",
    goal,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(3),
    workoutDays: [
      {
        id: uid(),
        name: "Dia A - Empuje",
        dayIndex: 0,
        workoutDayExercises: [
          createDemoDayExercise("Press de banca", 4, "6-8", 120),
          createDemoDayExercise("Press militar con barra", 3, "8-10", 90),
          createDemoDayExercise("Curl con barra", 3, "10-12", 75),
        ],
      },
      {
        id: uid(),
        name: "Dia B - Pierna",
        dayIndex: 1,
        workoutDayExercises: [
          createDemoDayExercise("Sentadilla", 4, "5", 150),
          createDemoDayExercise("Zancadas caminando", 3, "8", 90),
          createDemoDayExercise("Peso muerto rumano", 3, "8", 120),
        ],
      },
      {
        id: uid(),
        name: "Dia C - Tiron",
        dayIndex: 2,
        workoutDayExercises: [
          createDemoDayExercise("Remo con barra", 4, "6-8", 120),
          createDemoDayExercise("Dominadas asistidas", 3, "max", 120),
        ],
      },
    ],
  };
}

const workouts: Record<string, DemoWorkoutDetail[]> = {
  [PROFILE_PATO]: [makeWorkout(PROFILE_PATO, "Fuerza 3 dias", "Ganar fuerza")],
  [PROFILE_YAYI]: [makeWorkout(PROFILE_YAYI, "Full body tono", "Tonificar")],
};

const workoutLogs: Record<string, WorkoutLog[]> = {
  [PROFILE_PATO]: [
    {
      id: uid(),
      profileId: PROFILE_PATO,
      workoutId: null,
      workoutDayId: null,
      startedAt: daysAgo(1),
      endedAt: daysAgo(1),
      perceivedEffort: 8,
      notes: "Buen dia de empuje, subí 2.5kg en press.",
      createdAt: daysAgo(1),
    },
    {
      id: uid(),
      profileId: PROFILE_PATO,
      workoutId: null,
      workoutDayId: null,
      startedAt: daysAgo(3),
      endedAt: daysAgo(3),
      perceivedEffort: 7,
      notes: "Pierna pesada.",
      createdAt: daysAgo(3),
    },
  ],
  [PROFILE_YAYI]: [
    {
      id: uid(),
      profileId: PROFILE_YAYI,
      workoutId: null,
      workoutDayId: null,
      startedAt: daysAgo(2),
      endedAt: daysAgo(2),
      perceivedEffort: 6,
      notes: "Circuito completo.",
      createdAt: daysAgo(2),
    },
  ],
};

const meals: Record<string, Meal[]> = {
  [PROFILE_PATO]: [
    {
      id: uid(),
      profileId: PROFILE_PATO,
      mealType: "breakfast",
      eatenAt: daysAgo(0),
      name: "Avena con huevos",
      calories: 520,
      proteinG: 34,
      carbsG: 58,
      fatG: 16,
      fiberG: 7,
      notes: null,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    {
      id: uid(),
      profileId: PROFILE_PATO,
      mealType: "lunch",
      eatenAt: daysAgo(0),
      name: "Pollo, arroz y ensalada",
      calories: 680,
      proteinG: 52,
      carbsG: 65,
      fatG: 18,
      fiberG: 6,
      notes: null,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
  ],
  [PROFILE_YAYI]: [
    {
      id: uid(),
      profileId: PROFILE_YAYI,
      mealType: "breakfast",
      eatenAt: daysAgo(0),
      name: "Yogurt con fruta y granola",
      calories: 340,
      proteinG: 22,
      carbsG: 44,
      fatG: 8,
      fiberG: 5,
      notes: null,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
  ],
};

const bodyMetrics: Record<string, BodyMetric[]> = {
  [PROFILE_PATO]: [
    {
      id: uid(),
      profileId: PROFILE_PATO,
      measuredAt: daysAgo(1),
      weightKg: 78.4,
      bodyFatPercentage: 16,
      waistCm: 82,
      chestCm: 102,
      hipCm: null,
      armCm: 37,
      thighCm: null,
      notes: null,
      createdAt: daysAgo(1),
    },
    {
      id: uid(),
      profileId: PROFILE_PATO,
      measuredAt: daysAgo(14),
      weightKg: 79.1,
      bodyFatPercentage: 17,
      waistCm: 84,
      chestCm: 101,
      hipCm: null,
      armCm: 36.5,
      thighCm: null,
      notes: null,
      createdAt: daysAgo(14),
    },
  ],
  [PROFILE_YAYI]: [
    {
      id: uid(),
      profileId: PROFILE_YAYI,
      measuredAt: daysAgo(2),
      weightKg: 61.2,
      bodyFatPercentage: 24,
      waistCm: 70,
      chestCm: null,
      hipCm: 96,
      armCm: null,
      thighCm: 55,
      notes: null,
      createdAt: daysAgo(2),
    },
  ],
};

function listFor<T>(map: Record<string, T[]>, profileId: string): T[] {
  return map[profileId] ? [...map[profileId]] : [];
}

function buildDashboard(profileId: string): DashboardResponse {
  const profileMeals = meals[profileId] ?? [];
  const profileLogs = workoutLogs[profileId] ?? [];
  const profileMetrics = bodyMetrics[profileId] ?? [];

  const caloriesList = profileMeals
    .map((meal) => meal.calories)
    .filter((value): value is number => typeof value === "number");
  const proteinList = profileMeals
    .map((meal) => meal.proteinG)
    .filter((value): value is number => typeof value === "number");

  const avg = (values: number[]) =>
    values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

  const latestWeight = profileMetrics
    .slice()
    .sort((a, b) => (a.measuredAt < b.measuredAt ? 1 : -1))[0]?.weightKg ?? null;

  return {
    workoutsLast7Days: profileLogs.length,
    mealsLast7Days: profileMeals.length,
    averageCalories: avg(caloriesList),
    averageProteinG: avg(proteinList),
    latestWeightKg: latestWeight,
    recentExerciseProgress: [
      {
        exerciseId: exercises[1]!.id,
        exerciseName: "Press de banca",
        latestWeight: 72.5,
        latestReps: 8,
        loggedAt: daysAgo(1),
      },
      {
        exerciseId: exercises[0]!.id,
        exerciseName: "Sentadilla con barra",
        latestWeight: 100,
        latestReps: 5,
        loggedAt: daysAgo(3),
      },
    ],
    alerts:
      proteinList.length && (avg(proteinList) ?? 0) < 100
        ? ["Vas algo bajo en proteina hoy. Suma una fuente magra en la proxima comida."]
        : ["Buen ritmo esta semana. Manten la constancia."],
  };
}

// --- AI mock (mismo espiritu que el MockProvider del backend) ---------------

function foodAnalysis(): FoodPhotoAnalysis {
  return {
    analysisId: uid(),
    estimatedMealName: "Plato balanceado estimado",
    items: [
      {
        name: "Proteina magra",
        estimatedPortion: "1 porcion (150 g)",
        calories: 230,
        proteinG: 34,
        carbsG: 3,
        fatG: 9,
        fiberG: 1,
        confidence: 0.5,
      },
      {
        name: "Carbohidrato",
        estimatedPortion: "1 taza",
        calories: 200,
        proteinG: 5,
        carbsG: 43,
        fatG: 2,
        fiberG: 3,
        confidence: 0.5,
      },
      {
        name: "Vegetales",
        estimatedPortion: "1 taza",
        calories: 60,
        proteinG: 3,
        carbsG: 10,
        fatG: 1,
        fiberG: 4,
        confidence: 0.55,
      },
    ],
    totals: { calories: 490, proteinG: 42, carbsG: 56, fatG: 12, fiberG: 8 },
    confidence: 0.5,
    disclaimer: FOOD_ANALYSIS_DISCLAIMER,
  };
}

function machineAnalysis(): GymMachineAnalysis {
  return {
    analysisId: uid(),
    machineName: "Maquina de prensa de piernas (estimado)",
    possibleExercises: ["Prensa de piernas", "Prensa a una pierna"],
    primaryMuscles: ["cuadriceps", "gluteos"],
    secondaryMuscles: ["isquiotibiales", "pantorrillas"],
    instructions: [
      "Ajusta el respaldo para que las rodillas queden a ~90 grados.",
      "Apoya los pies al ancho de los hombros sobre la plataforma.",
      "Empuja con control sin bloquear las rodillas al extender.",
      "Baja lento hasta sentir tension sin perder el apoyo lumbar.",
    ],
    commonMistakes: [
      "Usar demasiado peso y perder el rango.",
      "Bloquear las rodillas en la extension.",
      "Despegar la zona lumbar del respaldo.",
    ],
    safetyRecommendations: [
      "Empieza con peso liviano para calibrar.",
      "Detente ante cualquier dolor articular agudo.",
    ],
    avoidIf: ["Lesion de rodilla o lumbar sin evaluacion profesional."],
    difficulty: "beginner",
    confidence: 0.55,
    disclaimer: GYM_MACHINE_DISCLAIMER,
  };
}

function chatReply(profileId: string, message: string): AIChatResult {
  const profile = profiles.find((p) => p.id === profileId);
  const name = profile?.displayName ?? "tu perfil";
  const dash = buildDashboard(profileId);
  return {
    threadId: uid(),
    message: {
      role: "assistant",
      content:
        `Hola ${name}. Estoy en modo demo (datos simulados, sin OpenAI). ` +
        `Con tu contexto reciente: ${dash.workoutsLast7Days} entrenos y ${dash.mealsLast7Days} comidas registradas. ` +
        `Mi sugerencia: manten la proteina alta y la constancia semanal.\n\n` +
        `Tu mensaje fue: "${message}".\n\n${HEALTH_DISCLAIMER}`,
    },
  };
}

// --- API demo (misma forma que services/api.ts) -----------------------------

export const demoApi = {
  profiles: {
    list: async (): Promise<Profile[]> => [...profiles],
    create: async (input: CreateProfileInput): Promise<Profile> => {
      const profile: Profile = {
        id: uid(),
        userId: "00000000-0000-4000-8000-000000000001",
        displayName: input.displayName,
        birthdate: input.birthdate ?? null,
        sex: input.sex ?? null,
        heightCm: input.heightCm ?? null,
        goal: input.goal ?? null,
        activityLevel: input.activityLevel ?? null,
        dietaryPreferences: input.dietaryPreferences ?? null,
        trainingPreferences: input.trainingPreferences ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      profiles.push(profile);
      workouts[profile.id] = [];
      workoutLogs[profile.id] = [];
      meals[profile.id] = [];
      bodyMetrics[profile.id] = [];
      return profile;
    },
    update: async (profileId: string, input: UpdateProfileInput): Promise<Profile> => {
      const index = profiles.findIndex((p) => p.id === profileId);
      if (index === -1) throw new Error("Perfil no encontrado.");
      const updated: Profile = { ...profiles[index]!, ...input, updatedAt: now() } as Profile;
      profiles[index] = updated;
      return updated;
    },
  },
  dashboard: async (profileId: string): Promise<DashboardResponse> => buildDashboard(profileId),
  workouts: {
    exercises: async () => exercises,
    exerciseDetail: async (exerciseId: string) => {
      const exercise = exercises.find((entry) => entry.id === exerciseId);
      if (!exercise) throw new Error("Ejercicio no encontrado.");
      return exercise;
    },
    list: async (profileId: string): Promise<Workout[]> => listFor(workouts, profileId),
    create: async (profileId: string, input: CreateWorkoutInput): Promise<Workout> => {
      const workout: DemoWorkoutDetail = {
        id: uid(),
        profileId,
        name: input.name,
        description: input.description ?? null,
        goal: input.goal ?? null,
        createdAt: now(),
        updatedAt: now(),
        workoutDays: (input.days ?? []).map((day) => ({
          id: uid(),
          name: day.name,
          dayIndex: day.dayIndex,
          workoutDayExercises: (day.exercises ?? []).map((entry) => ({
            id: uid(),
            exerciseId: entry.exerciseId,
            targetSets: entry.targetSets ?? null,
            targetReps: entry.targetReps ?? null,
            restSeconds: entry.restSeconds ?? null,
            targetWeight: entry.targetWeight ?? null,
            exercises: {
              id: entry.exerciseId,
              name: exercises.find((e) => e.id === entry.exerciseId)?.name ?? "Ejercicio",
            },
          })),
        })),
      };
      (workouts[profileId] ??= []).push(workout);
      return workout as Workout;
    },
    detail: async (workoutId: string): Promise<Workout> => {
      for (const list of Object.values(workouts)) {
        const found = list.find((w) => w.id === workoutId);
        if (found) return found as Workout;
      }
      throw new Error("Rutina no encontrada.");
    },
    update: async (workoutId: string, input: UpdateWorkoutInput): Promise<Workout> => {
      for (const list of Object.values(workouts)) {
        const index = list.findIndex((w) => w.id === workoutId);
        if (index >= 0) {
          const current = list[index]!;
          const updated = {
            ...current,
            name: input.name ?? current.name,
            description: input.description ?? current.description,
            goal: input.goal ?? current.goal,
            updatedAt: now(),
          };
          list[index] = updated;
          return updated as Workout;
        }
      }
      throw new Error("Rutina no encontrada.");
    },
    delete: async (workoutId: string): Promise<void> => {
      for (const [profileId, list] of Object.entries(workouts)) {
        const index = list.findIndex((w) => w.id === workoutId);
        if (index >= 0) {
          list.splice(index, 1);
          workoutLogs[profileId] = listFor(workoutLogs, profileId).map((log) =>
            log.workoutId === workoutId ? { ...log, workoutId: null, workoutDayId: null } : log,
          );
          return;
        }
      }
      throw new Error("Rutina no encontrada.");
    },
    logs: async (profileId: string): Promise<WorkoutLog[]> =>
      listFor(workoutLogs, profileId).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
    createLog: async (profileId: string, input: CreateWorkoutLogInput): Promise<WorkoutLog> => {
      const log: WorkoutLog = {
        id: uid(),
        profileId,
        workoutId: input.workoutId ?? null,
        workoutDayId: input.workoutDayId ?? null,
        startedAt: input.startedAt ?? now(),
        endedAt: input.endedAt ?? now(),
        perceivedEffort: input.perceivedEffort ?? null,
        notes: input.notes ?? null,
        createdAt: now(),
      };
      (workoutLogs[profileId] ??= []).push(log);
      return log;
    },
  },
  meals: {
    list: async (profileId: string): Promise<Meal[]> =>
      listFor(meals, profileId).sort((a, b) => (a.eatenAt < b.eatenAt ? 1 : -1)),
    create: async (profileId: string, input: CreateMealInput): Promise<Meal> => {
      const meal: Meal = {
        id: uid(),
        profileId,
        mealType: input.mealType,
        eatenAt: input.eatenAt ?? now(),
        name: input.name ?? null,
        calories: input.calories ?? null,
        proteinG: input.proteinG ?? null,
        carbsG: input.carbsG ?? null,
        fatG: input.fatG ?? null,
        fiberG: input.fiberG ?? null,
        notes: input.notes ?? null,
        createdAt: now(),
        updatedAt: now(),
      };
      (meals[profileId] ??= []).push(meal);
      return meal;
    },
  },
  foods: {
    search: async (query: string, includeExternal = false, limit = 18): Promise<FoodSearchResponse> => {
      const results = searchFoods(query, limit);
      return {
        query,
        results,
        sources: includeExternal ? ["local"] : ["local"],
        cached: false,
      };
    },
    barcode: async (barcode: string): Promise<FoodCatalogItem> => {
      const food = searchFoods(barcode, 1)[0];
      if (!food) throw new Error("No encontramos ese producto por codigo de barra.");
      return food;
    },
  },
  bodyMetrics: {
    list: async (profileId: string): Promise<BodyMetric[]> =>
      listFor(bodyMetrics, profileId).sort((a, b) => (a.measuredAt < b.measuredAt ? 1 : -1)),
    create: async (profileId: string, input: CreateBodyMetricInput): Promise<BodyMetric> => {
      const metric: BodyMetric = {
        id: uid(),
        profileId,
        measuredAt: input.measuredAt ?? now(),
        weightKg: input.weightKg ?? null,
        bodyFatPercentage: input.bodyFatPercentage ?? null,
        waistCm: input.waistCm ?? null,
        chestCm: input.chestCm ?? null,
        hipCm: input.hipCm ?? null,
        armCm: input.armCm ?? null,
        thighCm: input.thighCm ?? null,
        notes: input.notes ?? null,
        createdAt: now(),
      };
      (bodyMetrics[profileId] ??= []).push(metric);
      return metric;
    },
  },
  ai: {
    analyzeFood: async (): Promise<FoodPhotoAnalysis> => foodAnalysis(),
    analyzeMachine: async (): Promise<GymMachineAnalysis> => machineAnalysis(),
    chat: async (profileId: string, message: string): Promise<AIChatResult> =>
      chatReply(profileId, message),
  },
};
