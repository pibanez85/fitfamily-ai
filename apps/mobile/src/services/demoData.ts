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
  type GenerateWorkoutRequest,
  type GeneratedWorkout,
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

// Fecha de hace `days` dias a una hora local concreta, para que las comidas y
// entrenos del historial demo caigan en horarios creibles.
const dayAt = (days: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// PRNG determinista: el historial demo se ve identico en cada arranque.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundToStep(value: number, step = 2.5) {
  return Math.round(value / step) * step;
}

type DemoWorkoutDetail = Workout & {
  workoutDays: Array<{
    id: string;
    name: string;
    dayIndex: number;
    workoutDayExercises: Array<{
      id: string;
      exerciseId?: string;
      orderIndex?: number;
      targetSets: number | null;
      targetReps: string | null;
      restSeconds?: number | null;
      targetWeight?: number | null;
      notes?: string | null;
      exercises: { id?: string; name: string } | null;
    }>;
  }>;
};

// Misma forma que devuelve la API real: log + sets con el ejercicio anidado.
type DemoWorkoutLogSet = {
  id: string;
  exerciseId: string;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  restSeconds: number | null;
  notes: string | null;
  exercises: (typeof exercises)[number] | null;
};

type DemoWorkoutLog = WorkoutLog & {
  workoutLogSets: DemoWorkoutLogSet[];
  workouts: { name: string | null } | null;
  workoutDays: { name: string | null } | null;
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
    orderIndex: 0,
    targetSets,
    targetReps,
    restSeconds,
    targetWeight: null,
    notes: null,
    exercises: { id: exercise.id, name: exercise.name },
  };
}

function buildDemoWorkoutDays(input: { days?: CreateWorkoutInput["days"] }) {
  return (input.days ?? []).map((day) => ({
    id: uid(),
    name: day.name,
    dayIndex: day.dayIndex,
    workoutDayExercises: (day.exercises ?? []).map((entry, index) => {
      const exercise = exercises.find((item) => item.id === entry.exerciseId);
      return {
        id: uid(),
        exerciseId: entry.exerciseId,
        orderIndex: entry.orderIndex ?? index,
        targetSets: entry.targetSets ?? null,
        targetReps: entry.targetReps ?? null,
        restSeconds: entry.restSeconds ?? null,
        targetWeight: entry.targetWeight ?? null,
        notes: entry.notes ?? null,
        exercises: {
          id: entry.exerciseId,
          name: exercise?.name ?? "Ejercicio",
        },
      };
    }),
  }));
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

// Pesos base (kg) por ejercicio para el historial demo. 0 = peso corporal.
const BASE_WEIGHTS: Record<string, number> = {
  "Press de banca": 55,
  "Press militar con barra": 32.5,
  "Curl con barra": 25,
  Sentadilla: 70,
  "Zancadas caminando": 16,
  "Peso muerto rumano": 60,
  "Remo con barra": 50,
  "Dominadas asistidas": 0,
};

function repsFromTarget(target: string | null, rand: () => number): number {
  if (!target) return 10;
  if (target === "max") return 6 + Math.floor(rand() * 4);
  const [lo, hi] = target.split("-").map((value) => parseInt(value, 10));
  if (!Number.isFinite(lo)) return 10;
  if (!Number.isFinite(hi)) return lo!;
  return lo! + Math.floor(rand() * (hi! - lo! + 1));
}

// Genera sesiones historicas con series reales y progresion de carga suave,
// ciclando los dias de la rutina (A, B, C, A, ...).
function seedWorkoutLogs(
  profileId: string,
  workout: DemoWorkoutDetail,
  sessionDays: number[],
  weightScale: number,
  seed: number,
): DemoWorkoutLog[] {
  const rand = mulberry32(seed);
  const oldestDay = sessionDays[0] ?? 0;

  return sessionDays.map((day, index) => {
    const dayTemplate = workout.workoutDays[index % workout.workoutDays.length]!;
    const weeksFromStart = (oldestDay - day) / 7;
    const startedAt = dayAt(day, 18, 10 + Math.floor(rand() * 35));
    const durationMin = 50 + Math.floor(rand() * 25);
    const endedAt = new Date(new Date(startedAt).getTime() + durationMin * 60000).toISOString();

    const workoutLogSets: DemoWorkoutLogSet[] = [];
    for (const entry of dayTemplate.workoutDayExercises) {
      const base = BASE_WEIGHTS[entry.exercises?.name ?? ""] ?? 20;
      const weight = base > 0 ? roundToStep(base * weightScale + weeksFromStart * 1.25) : null;
      const setCount = entry.targetSets ?? 3;
      for (let setIndex = 1; setIndex <= setCount; setIndex++) {
        workoutLogSets.push({
          id: uid(),
          exerciseId: entry.exerciseId!,
          setIndex,
          reps: repsFromTarget(entry.targetReps, rand),
          weight,
          rpe: 6 + Math.floor(rand() * 3),
          restSeconds: entry.restSeconds ?? 90,
          notes: null,
          exercises: exercises.find((exercise) => exercise.id === entry.exerciseId) ?? null,
        });
      }
    }

    return {
      id: uid(),
      profileId,
      workoutId: workout.id,
      workoutDayId: dayTemplate.id,
      startedAt,
      endedAt,
      perceivedEffort: 6 + Math.floor(rand() * 3),
      notes: null,
      createdAt: startedAt,
      workoutLogSets,
      workouts: { name: workout.name },
      workoutDays: { name: dayTemplate.name },
    };
  });
}

// ~3 sesiones/semana durante el ultimo mes para cada perfil.
const PATO_SESSION_DAYS = [29, 27, 25, 22, 20, 18, 15, 13, 11, 8, 6, 4, 1];
const YAYI_SESSION_DAYS = [28, 26, 23, 21, 19, 16, 14, 12, 9, 7, 5, 2];

const workoutLogs: Record<string, DemoWorkoutLog[]> = {
  [PROFILE_PATO]: seedWorkoutLogs(PROFILE_PATO, workouts[PROFILE_PATO]![0]!, PATO_SESSION_DAYS, 1, 11),
  [PROFILE_YAYI]: seedWorkoutLogs(PROFILE_YAYI, workouts[PROFILE_YAYI]![0]!, YAYI_SESSION_DAYS, 0.55, 23),
};

type MealTemplate = {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

const DEMO_BREAKFASTS: MealTemplate[] = [
  { name: "Avena con huevos", calories: 520, proteinG: 34, carbsG: 58, fatG: 16, fiberG: 7 },
  { name: "Pan marraqueta con palta y huevo", calories: 460, proteinG: 20, carbsG: 52, fatG: 19, fiberG: 6 },
  { name: "Yogurt con fruta y granola", calories: 380, proteinG: 24, carbsG: 48, fatG: 9, fiberG: 5 },
  { name: "Huevos revueltos con pan integral", calories: 430, proteinG: 27, carbsG: 38, fatG: 18, fiberG: 5 },
];

const DEMO_LUNCHES: MealTemplate[] = [
  { name: "Pollo, arroz y ensalada", calories: 680, proteinG: 52, carbsG: 65, fatG: 18, fiberG: 6 },
  { name: "Carne con pure y ensalada", calories: 720, proteinG: 48, carbsG: 60, fatG: 26, fiberG: 5 },
  { name: "Cazuela de vacuno", calories: 560, proteinG: 38, carbsG: 48, fatG: 20, fiberG: 7 },
  { name: "Salmon con arroz y verduras", calories: 640, proteinG: 44, carbsG: 55, fatG: 22, fiberG: 5 },
];

const DEMO_DINNERS: MealTemplate[] = [
  { name: "Tortilla de verduras con atun", calories: 430, proteinG: 34, carbsG: 24, fatG: 20, fiberG: 5 },
  { name: "Pechuga con fideos", calories: 520, proteinG: 42, carbsG: 52, fatG: 12, fiberG: 4 },
  { name: "Ensalada completa con huevo y quinoa", calories: 410, proteinG: 24, carbsG: 40, fatG: 16, fiberG: 8 },
  { name: "Sopa de pollo con arroz", calories: 380, proteinG: 30, carbsG: 42, fatG: 8, fiberG: 3 },
];

const DEMO_SNACKS: MealTemplate[] = [
  { name: "Batido de proteina con platano", calories: 260, proteinG: 28, carbsG: 30, fatG: 3, fiberG: 2 },
  { name: "Frutos secos y fruta", calories: 220, proteinG: 6, carbsG: 24, fatG: 12, fiberG: 4 },
  { name: "Yogurt proteico", calories: 150, proteinG: 18, carbsG: 12, fatG: 3, fiberG: 0 },
];

function buildDemoMeal(
  profileId: string,
  mealType: Meal["mealType"],
  template: MealTemplate,
  eatenAt: string,
  scale: number,
): Meal {
  const factor = (value: number) => Math.round(value * scale);
  return {
    id: uid(),
    profileId,
    mealType,
    eatenAt,
    name: template.name,
    calories: factor(template.calories),
    proteinG: factor(template.proteinG),
    carbsG: factor(template.carbsG),
    fatG: factor(template.fatG),
    fiberG: factor(template.fiberG),
    notes: null,
    createdAt: eatenAt,
    updatedAt: eatenAt,
  };
}

// Un mes de comidas con escenarios reales: dias completos, dias a medias y
// alguno sin registro. Los dias de entreno suman un snack extra.
function seedMeals(
  profileId: string,
  totalDays: number,
  scale: number,
  trainingDays: Set<number>,
  seed: number,
): Meal[] {
  const rand = mulberry32(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]!;
  const result: Meal[] = [];

  for (let day = totalDays; day >= 1; day--) {
    const scenario = rand();
    if (scenario < 0.06) continue; // dia sin registros

    result.push(buildDemoMeal(profileId, "breakfast", pick(DEMO_BREAKFASTS), dayAt(day, 8, 30), scale));
    result.push(buildDemoMeal(profileId, "lunch", pick(DEMO_LUNCHES), dayAt(day, 13, 30), scale));

    // ~14% de los dias queda incompleto (sin cena registrada).
    if (scenario >= 0.2) {
      result.push(buildDemoMeal(profileId, "dinner", pick(DEMO_DINNERS), dayAt(day, 20, 30), scale));
    }
    if (trainingDays.has(day) || rand() < 0.25) {
      result.push(buildDemoMeal(profileId, "snack", pick(DEMO_SNACKS), dayAt(day, 17, 0), scale));
    }
  }

  return result;
}

const meals: Record<string, Meal[]> = {
  [PROFILE_PATO]: [
    buildDemoMeal(PROFILE_PATO, "breakfast", DEMO_BREAKFASTS[0]!, dayAt(0, 8, 30), 1),
    buildDemoMeal(PROFILE_PATO, "lunch", DEMO_LUNCHES[0]!, dayAt(0, 13, 30), 1),
    ...seedMeals(PROFILE_PATO, 29, 1, new Set(PATO_SESSION_DAYS), 31),
  ],
  [PROFILE_YAYI]: [
    buildDemoMeal(PROFILE_YAYI, "breakfast", DEMO_BREAKFASTS[2]!, dayAt(0, 9, 0), 0.8),
    ...seedMeals(PROFILE_YAYI, 29, 0.75, new Set(YAYI_SESSION_DAYS), 47),
  ],
};

// Pesajes semanales del ultimo mes con tendencia a la baja suave.
function seedBodyMetrics(
  profileId: string,
  startWeight: number,
  endWeight: number,
  startFat: number,
  endFat: number,
  waistStart: number | null,
): BodyMetric[] {
  const measureDays = [29, 22, 15, 8, 1];
  const steps = measureDays.length - 1;

  return measureDays.map((day, index) => {
    const t = index / steps;
    const weight = Math.round((startWeight + (endWeight - startWeight) * t) * 10) / 10;
    const fat = Math.round((startFat + (endFat - startFat) * t) * 10) / 10;
    const measuredAt = dayAt(day, 7, 45);
    return {
      id: uid(),
      profileId,
      measuredAt,
      weightKg: weight,
      bodyFatPercentage: fat,
      waistCm: waistStart == null ? null : Math.round((waistStart - t * 1.5) * 10) / 10,
      chestCm: null,
      hipCm: null,
      armCm: null,
      thighCm: null,
      notes: null,
      createdAt: measuredAt,
    };
  });
}

const bodyMetrics: Record<string, BodyMetric[]> = {
  [PROFILE_PATO]: seedBodyMetrics(PROFILE_PATO, 79.9, 78.4, 17.2, 16.1, 84),
  [PROFILE_YAYI]: seedBodyMetrics(PROFILE_YAYI, 62.1, 61.2, 24.6, 24, 70.5),
};

function listFor<T>(map: Record<string, T[]>, profileId: string): T[] {
  return map[profileId] ? [...map[profileId]] : [];
}

function buildDashboard(profileId: string): DashboardResponse {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const profileMeals = (meals[profileId] ?? []).filter(
    (meal) => new Date(meal.eatenAt).getTime() >= sevenDaysAgo,
  );
  const profileLogs = (workoutLogs[profileId] ?? []).filter(
    (log) => new Date(log.startedAt).getTime() >= sevenDaysAgo,
  );
  const profileMetrics = bodyMetrics[profileId] ?? [];

  // Promedios DIARIOS de la semana (no por comida): agrupamos por dia local.
  const byDay = new Map<string, { calories: number; protein: number }>();
  for (const meal of profileMeals) {
    const key = new Date(meal.eatenAt).toDateString();
    const entry = byDay.get(key) ?? { calories: 0, protein: 0 };
    entry.calories += meal.calories ?? 0;
    entry.protein += meal.proteinG ?? 0;
    byDay.set(key, entry);
  }
  const dailyTotals = [...byDay.values()];
  const avg = (values: number[]) =>
    values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

  const latestWeight =
    profileMetrics.slice().sort((a, b) => (a.measuredAt < b.measuredAt ? 1 : -1))[0]?.weightKg ?? null;

  // Progreso reciente real: ultimo peso registrado por ejercicio en los logs.
  const seen = new Set<string>();
  const recentExerciseProgress: DashboardResponse["recentExerciseProgress"] = [];
  const sortedLogs = (workoutLogs[profileId] ?? [])
    .slice()
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  for (const log of sortedLogs) {
    for (const set of log.workoutLogSets) {
      if (!set.weight || !set.exercises || seen.has(set.exerciseId)) continue;
      seen.add(set.exerciseId);
      recentExerciseProgress.push({
        exerciseId: set.exerciseId,
        exerciseName: set.exercises.name,
        latestWeight: set.weight,
        latestReps: set.reps ?? 0,
        loggedAt: log.startedAt,
      });
      if (recentExerciseProgress.length >= 2) break;
    }
    if (recentExerciseProgress.length >= 2) break;
  }

  const todayKey = new Date().toDateString();
  const todayProtein = byDay.get(todayKey)?.protein ?? 0;

  return {
    workoutsLast7Days: profileLogs.length,
    mealsLast7Days: profileMeals.length,
    averageCalories: avg(dailyTotals.map((entry) => entry.calories)),
    averageProteinG: avg(dailyTotals.map((entry) => entry.protein)),
    latestWeightKg: latestWeight,
    recentExerciseProgress,
    alerts:
      todayProtein > 0 && todayProtein < 100
        ? ["Vas algo bajo en proteína hoy. Suma una fuente magra en la próxima comida."]
        : ["Buen ritmo esta semana. Mantén la constancia."],
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
        workoutDays: buildDemoWorkoutDays(input),
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
            workoutDays: input.days ? buildDemoWorkoutDays({ days: input.days }) : current.workoutDays,
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
      let workoutName: string | null = null;
      let workoutDayName: string | null = null;
      if (input.workoutId) {
        const workout = (workouts[profileId] ?? []).find((entry) => entry.id === input.workoutId);
        workoutName = workout?.name ?? null;
        workoutDayName = workout?.workoutDays.find((day) => day.id === input.workoutDayId)?.name ?? null;
      }

      const log: DemoWorkoutLog = {
        id: uid(),
        profileId,
        workoutId: input.workoutId ?? null,
        workoutDayId: input.workoutDayId ?? null,
        startedAt: input.startedAt ?? now(),
        endedAt: input.endedAt ?? now(),
        perceivedEffort: input.perceivedEffort ?? null,
        notes: input.notes ?? null,
        createdAt: now(),
        workoutLogSets: (input.sets ?? []).map((set, index) => ({
          id: uid(),
          exerciseId: set.exerciseId,
          setIndex: set.setIndex ?? index + 1,
          reps: set.reps ?? null,
          weight: set.weight ?? null,
          rpe: set.rpe ?? null,
          restSeconds: set.restSeconds ?? null,
          notes: set.notes ?? null,
          exercises: exercises.find((exercise) => exercise.id === set.exerciseId) ?? null,
        })),
        workouts: workoutName ? { name: workoutName } : null,
        workoutDays: workoutDayName ? { name: workoutDayName } : null,
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
    generateWorkout: async (_profileId: string, body: GenerateWorkoutRequest): Promise<GeneratedWorkout> =>
      buildDemoGeneratedWorkout(body),
  },
};

// Generacion de rutina en modo demo (sin IA real): reparte el catalogo por dias.
function buildDemoGeneratedWorkout(body: GenerateWorkoutRequest): GeneratedWorkout {
  const goal = body.goal.toLowerCase();
  const targetReps = /fuerza/.test(goal) ? "4-6" : /resist/.test(goal) ? "12-15" : "8-12";
  const restSeconds = /fuerza/.test(goal) ? 150 : /resist/.test(goal) ? 45 : 90;
  const perDay = body.frequency >= 5 ? 4 : 5;
  const dayNames = ["Dia A", "Dia B", "Dia C", "Dia D", "Dia E", "Dia F"];

  const workoutDays = Array.from({ length: body.frequency }, (_, dayIndex) => {
    const chosen = exercises.filter((_, index) => index % body.frequency === dayIndex).slice(0, perDay);
    return {
      name: dayNames[dayIndex] ?? `Dia ${dayIndex + 1}`,
      dayIndex,
      workoutDayExercises: chosen.map((exercise, orderIndex) => ({
        exerciseId: exercise.id,
        orderIndex,
        targetSets: 3,
        targetReps,
        restSeconds,
        targetWeight: null,
        notes: null,
        exercises: { id: exercise.id, name: exercise.name },
      })),
    };
  });

  return {
    summary:
      "Rutina base creada en modo demo. Reparte ejercicios efectivos por dias segun tu objetivo; revisala y ajustala antes de guardar.",
    workoutDays,
  };
}
