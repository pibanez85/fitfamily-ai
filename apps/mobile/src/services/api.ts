import type {
  AIChatResult,
  BodyMetric,
  CreateBodyMetricInput,
  CreateMealInput,
  CreateProfileInput,
  CreateWorkoutInput,
  CreateWorkoutLogInput,
  DashboardResponse,
  ExerciseCatalogItem,
  FoodCatalogItem,
  FoodSearchResponse,
  FoodPhotoAnalysis,
  GenerateWorkoutRequest,
  GeneratedWorkout,
  GymMachineAnalysis,
  Meal,
  Profile,
  UpdateProfileInput,
  UpdateWorkoutInput,
  Workout,
  WorkoutLog,
} from "@fitfamily-ai/shared";
import { router } from "expo-router";
import { env, isDemoMode } from "@/config/env";
import { supabase } from "@/lib/supabase";
import { demoApi } from "@/services/demoData";
import { withTimeout } from "@/services/asyncUtils";
import { useAppStore } from "@/store/appStore";

type ApiEnvelope<T> = { data: T };

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Sesion no disponible. Inicia sesion nuevamente.");
  }

  return token;
}

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 18000): Promise<T> {
  const token = await getAccessToken();
  let response: Response;

  try {
    response = await withTimeout(
      fetch(`${env.apiUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      }),
      timeoutMs,
      `El backend no respondio a tiempo en ${env.apiUrl}.`,
    );
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes("no respondio a tiempo")) {
      throw caught;
    }
    throw new Error(
      `No pude conectar con el backend en ${env.apiUrl}. Revisa que dev:api este corriendo y que el celular este en la misma Wi-Fi.`,
    );
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? "Error de API";
    if (response.status === 401 || String(message).toLowerCase().includes("invalid or expired")) {
      await clearInvalidSession();
      throw new Error("Tu sesion vencio o quedo antigua. Inicia sesion nuevamente.");
    }
    throw new Error(message);
  }

  return (payload?.data ?? payload) as T;
}

async function clearInvalidSession() {
  await supabase.auth.signOut();
  useAppStore.getState().setSession(null);
  useAppStore.getState().setProfiles([]);
  router.replace("/login");
}

export async function checkBackendHealth(): Promise<string> {
  try {
    const response = await withTimeout(fetch(`${env.apiUrl}/health`), 8000, "Backend sin respuesta.");
    if (!response.ok) return `Backend responde con estado ${response.status}.`;
    const payload = (await response.json()) as { service?: string };
    return `Backend OK: ${payload.service ?? env.apiUrl}`;
  } catch {
    return `No pude llegar a ${env.apiUrl}. Abre dev:api y revisa firewall/Wi-Fi.`;
  }
}

const realApi = {
  profiles: {
    list: () => request<Profile[]>("/profiles"),
    create: (input: CreateProfileInput) =>
      request<Profile>("/profiles", { method: "POST", body: JSON.stringify(input) }),
    update: (profileId: string, input: UpdateProfileInput) =>
      request<Profile>(`/profiles/${profileId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
  },
  dashboard: (profileId: string) =>
    request<DashboardResponse>(`/profiles/${profileId}/dashboard`),
  workouts: {
    exercises: () => request<ExerciseCatalogItem[]>("/exercises"),
    exerciseDetail: (exerciseId: string) => request<ExerciseCatalogItem>(`/exercises/${exerciseId}`),
    list: (profileId: string) => request<Workout[]>(`/profiles/${profileId}/workouts`),
    create: (profileId: string, input: CreateWorkoutInput) =>
      request<Workout>(`/profiles/${profileId}/workouts`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    detail: (workoutId: string) => request<Workout>(`/workouts/${workoutId}`),
    update: (workoutId: string, input: UpdateWorkoutInput) =>
      request<Workout>(`/workouts/${workoutId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    delete: (workoutId: string) =>
      request<void>(`/workouts/${workoutId}`, {
        method: "DELETE",
      }),
    logs: (profileId: string) => request<WorkoutLog[]>(`/profiles/${profileId}/workout-logs`),
    createLog: (profileId: string, input: CreateWorkoutLogInput) =>
      request<WorkoutLog>(`/profiles/${profileId}/workout-logs`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  meals: {
    list: (profileId: string) => request<Meal[]>(`/profiles/${profileId}/meals`),
    create: (profileId: string, input: CreateMealInput) =>
      request<Meal>(`/profiles/${profileId}/meals`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  foods: {
    search: (query: string, includeExternal = true, limit = 18) =>
      request<FoodSearchResponse>(
        `/foods/search?query=${encodeURIComponent(query)}&includeExternal=${includeExternal ? "true" : "false"}&limit=${limit}`,
      ),
    barcode: (barcode: string) => request<FoodCatalogItem>(`/foods/barcode/${encodeURIComponent(barcode)}`),
  },
  bodyMetrics: {
    list: (profileId: string) => request<BodyMetric[]>(`/profiles/${profileId}/body-metrics`),
    create: (profileId: string, input: CreateBodyMetricInput) =>
      request<BodyMetric>(`/profiles/${profileId}/body-metrics`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  ai: {
    analyzeFood: (profileId: string, imageUrl: string, notes?: string) =>
      request<FoodPhotoAnalysis>(`/profiles/${profileId}/ai/analyze-food-photo`, {
        method: "POST",
        body: JSON.stringify({ imageUrl, notes }),
      }, 90000),
    analyzeMachine: (profileId: string, imageUrl: string, notes?: string) =>
      request<GymMachineAnalysis>(`/profiles/${profileId}/ai/analyze-gym-machine-photo`, {
        method: "POST",
        body: JSON.stringify({ imageUrl, notes }),
      }, 90000),
    chat: (profileId: string, message: string, threadId?: string) =>
      request<AIChatResult>(`/profiles/${profileId}/ai/chat`, {
        method: "POST",
        body: JSON.stringify({ message, threadId }),
      }),
    generateWorkout: (profileId: string, body: Omit<GenerateWorkoutRequest, never>) =>
      request<GeneratedWorkout>(`/profiles/${profileId}/ai/generate-workout`, {
        method: "POST",
        body: JSON.stringify(body),
      }, 60000),
  },
};

// En modo demo (sin credenciales) usamos datos simulados en memoria.
// Con credenciales reales, llamamos al backend Express.
export const api: typeof realApi = isDemoMode
  ? (demoApi as unknown as typeof realApi)
  : realApi;

export type { ApiEnvelope };
