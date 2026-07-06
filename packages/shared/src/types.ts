import type { z } from "zod";
import type {
  AIChatApiResponseSchema,
  AIChatRequestSchema,
  BodyMetricSchema,
  ChatMessageSchema,
  CreateBodyMetricSchema,
  CreateExerciseSchema,
  CreateMealSchema,
  CreateProfileSchema,
  CreateWorkoutLogSchema,
  CreateWorkoutSchema,
  DashboardResponseSchema,
  GenerateWorkoutRequestSchema,
  GeneratedWorkoutSchema,
  WorkoutBuilderCatalogItemSchema,
  ExerciseSchema,
  FoodItemSchema,
  FoodSearchResponseSchema,
  FoodAnalysisApiResponseSchema,
  FoodAnalysisResultSchema,
  FoodSourceSchema,
  GymMachineAnalysisApiResponseSchema,
  GymMachineAnalysisResultSchema,
  MealItemInputSchema,
  MealSchema,
  ProfileSchema,
  UpdateMealSchema,
  UpdateProfileSchema,
  UpdateWorkoutLogSchema,
  UpdateWorkoutSchema,
  WorkoutLogSchema,
  WorkoutSchema,
} from "./schemas";

export type Profile = z.infer<typeof ProfileSchema>;
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export type Exercise = z.infer<typeof ExerciseSchema>;
export type CreateExerciseInput = z.infer<typeof CreateExerciseSchema>;

export type Workout = z.infer<typeof WorkoutSchema>;
export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;
export type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;

export type WorkoutLog = z.infer<typeof WorkoutLogSchema>;
export type CreateWorkoutLogInput = z.infer<typeof CreateWorkoutLogSchema>;
export type UpdateWorkoutLogInput = z.infer<typeof UpdateWorkoutLogSchema>;

export type Meal = z.infer<typeof MealSchema>;
export type MealItemInput = z.infer<typeof MealItemInputSchema>;
export type CreateMealInput = z.infer<typeof CreateMealSchema>;
export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;
export type FoodSourceType = z.infer<typeof FoodSourceSchema>;
export type NormalizedFoodItem = z.infer<typeof FoodItemSchema>;
export type NormalizedFoodSearchResponse = z.infer<typeof FoodSearchResponseSchema>;

export type BodyMetric = z.infer<typeof BodyMetricSchema>;
export type CreateBodyMetricInput = z.infer<typeof CreateBodyMetricSchema>;

export type FoodPhotoAnalysis = z.infer<typeof FoodAnalysisApiResponseSchema>;
export type FoodAnalysisResult = z.infer<typeof FoodAnalysisResultSchema>;
export type GymMachineAnalysis = z.infer<typeof GymMachineAnalysisApiResponseSchema>;
export type GymMachineAnalysisResult = z.infer<typeof GymMachineAnalysisResultSchema>;

export type AIChatRequest = z.infer<typeof AIChatRequestSchema>;
export type AIChatResult = z.infer<typeof AIChatApiResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;

export type WorkoutBuilderCatalogItem = z.infer<typeof WorkoutBuilderCatalogItemSchema>;
export type GenerateWorkoutRequest = z.infer<typeof GenerateWorkoutRequestSchema>;
export type GeneratedWorkout = z.infer<typeof GeneratedWorkoutSchema>;

export type AIProviderName = "openai" | "mock" | "anthropic";

export type AIProviderResult<T> = {
  provider: AIProviderName;
  model: string;
  latencyMs: number;
  data: T;
  rawResponse?: unknown;
};
