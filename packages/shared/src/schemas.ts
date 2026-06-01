import { z } from "zod";
import { AI_DIFFICULTIES, CHAT_ROLES, MEAL_TYPES } from "./constants";
import { FOOD_SOURCES } from "./foodCatalog";

export const uuidSchema = z.uuid();
export const isoDateSchema = z.iso.date();
export const isoDateTimeSchema = z.iso.datetime({ offset: true });
export const nullableTextSchema = z.string().trim().max(4000).nullable().optional();
export const nonNegativeNumberSchema = z.number().finite().min(0);
export const confidenceSchema = z.number().finite().min(0).max(1);

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const profileIdParamSchema = z.object({
  profileId: uuidSchema,
});

export const exerciseIdParamSchema = z.object({
  exerciseId: uuidSchema,
});

export const workoutIdParamSchema = z.object({
  workoutId: uuidSchema,
});

export const workoutLogIdParamSchema = z.object({
  workoutLogId: uuidSchema,
});

export const mealIdParamSchema = z.object({
  mealId: uuidSchema,
});

export const ProfileSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  displayName: z.string().trim().min(1).max(120),
  birthdate: isoDateSchema.nullable().optional(),
  sex: z.string().trim().max(40).nullable().optional(),
  heightCm: nonNegativeNumberSchema.nullable().optional(),
  goal: z.string().trim().max(500).nullable().optional(),
  activityLevel: z.string().trim().max(80).nullable().optional(),
  dietaryPreferences: z.record(z.string(), z.unknown()).nullable().optional(),
  trainingPreferences: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const CreateProfileSchema = ProfileSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateProfileSchema = CreateProfileSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one profile field must be provided.",
);

export const ExerciseSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  primaryMuscles: z.array(z.string().trim().min(1)).default([]),
  secondaryMuscles: z.array(z.string().trim().min(1)).default([]),
  equipment: z.string().trim().max(120).nullable().optional(),
  instructions: z.string().trim().max(4000).nullable().optional(),
  safetyNotes: z.string().trim().max(4000).nullable().optional(),
  createdAt: isoDateTimeSchema,
});

export const CreateExerciseSchema = ExerciseSchema.omit({
  id: true,
  createdAt: true,
});

export const WorkoutDayExerciseInputSchema = z.object({
  exerciseId: uuidSchema,
  orderIndex: z.number().int().min(0),
  targetSets: z.number().int().min(1).nullable().optional(),
  targetReps: z.string().trim().max(80).nullable().optional(),
  targetWeight: nonNegativeNumberSchema.nullable().optional(),
  restSeconds: z.number().int().min(0).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const WorkoutDayInputSchema = z.object({
  dayIndex: z.number().int().min(0),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).nullable().optional(),
  exercises: z.array(WorkoutDayExerciseInputSchema).default([]),
});

export const WorkoutSchema = z.object({
  id: uuidSchema,
  profileId: uuidSchema,
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  goal: z.string().trim().max(500).nullable().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const CreateWorkoutSchema = WorkoutSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  days: z.array(WorkoutDayInputSchema).default([]),
});

export const UpdateWorkoutSchema = CreateWorkoutSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one workout field must be provided.",
);

export const WorkoutLogSetInputSchema = z.object({
  exerciseId: uuidSchema,
  setIndex: z.number().int().min(1),
  reps: z.number().int().min(0).nullable().optional(),
  weight: nonNegativeNumberSchema.nullable().optional(),
  rpe: z.number().finite().min(0).max(10).nullable().optional(),
  restSeconds: z.number().int().min(0).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const WorkoutLogSchema = z.object({
  id: uuidSchema,
  profileId: uuidSchema,
  workoutId: uuidSchema.nullable().optional(),
  workoutDayId: uuidSchema.nullable().optional(),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema.nullable().optional(),
  perceivedEffort: z.number().int().min(1).max(10).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  createdAt: isoDateTimeSchema,
});

export const CreateWorkoutLogSchema = WorkoutLogSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
}).extend({
  sets: z.array(WorkoutLogSetInputSchema).default([]),
});

export const UpdateWorkoutLogSchema = CreateWorkoutLogSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one workout log field must be provided.",
);

export const MealItemInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  estimatedPortion: z.string().trim().max(160).nullable().optional(),
  calories: nonNegativeNumberSchema.nullable().optional(),
  proteinG: nonNegativeNumberSchema.nullable().optional(),
  carbsG: nonNegativeNumberSchema.nullable().optional(),
  fatG: nonNegativeNumberSchema.nullable().optional(),
  fiberG: nonNegativeNumberSchema.nullable().optional(),
  confidence: confidenceSchema.nullable().optional(),
});

export const MealSchema = z.object({
  id: uuidSchema,
  profileId: uuidSchema,
  mealType: z.enum(MEAL_TYPES),
  eatenAt: isoDateTimeSchema,
  name: z.string().trim().max(160).nullable().optional(),
  calories: nonNegativeNumberSchema.nullable().optional(),
  proteinG: nonNegativeNumberSchema.nullable().optional(),
  carbsG: nonNegativeNumberSchema.nullable().optional(),
  fatG: nonNegativeNumberSchema.nullable().optional(),
  fiberG: nonNegativeNumberSchema.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const CreateMealSchema = MealSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  items: z.array(MealItemInputSchema).default([]),
});

export const UpdateMealSchema = CreateMealSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one meal field must be provided.",
);

export const FoodSourceSchema = z.enum(FOOD_SOURCES);

export const NutritionTotalsSchema = z.object({
  calories: nonNegativeNumberSchema,
  proteinG: nonNegativeNumberSchema,
  carbsG: nonNegativeNumberSchema,
  fatG: nonNegativeNumberSchema,
  fiberG: nonNegativeNumberSchema,
});

export const ServingOptionSchema = z.object({
  label: z.string().trim().min(1).max(120),
  quantity: nonNegativeNumberSchema,
  unit: z.string().trim().min(1).max(40),
  gramsEquivalent: nonNegativeNumberSchema,
  description: z.string().trim().max(240).optional(),
});

export const FoodItemSchema = z.object({
  id: z.string().trim().min(1).max(160),
  source: FoodSourceSchema,
  sourceId: z.string().trim().max(180).nullable().optional(),
  name: z.string().trim().min(1).max(240),
  brand: z.string().trim().max(160).nullable().optional(),
  category: z.string().trim().max(120),
  country: z.string().trim().max(20).nullable().optional(),
  aliases: z.array(z.string().trim().min(1).max(120)).default([]),
  servingOptions: z.array(ServingOptionSchema).min(1),
  baseQuantity: nonNegativeNumberSchema,
  baseUnit: z.string().trim().min(1).max(20),
  gramsPerBaseUnit: nonNegativeNumberSchema,
  caloriesPer100g: nonNegativeNumberSchema,
  proteinPer100g: nonNegativeNumberSchema,
  carbsPer100g: nonNegativeNumberSchema,
  fatPer100g: nonNegativeNumberSchema,
  fiberPer100g: nonNegativeNumberSchema,
  sugarPer100g: nonNegativeNumberSchema.nullable().optional(),
  sodiumPer100g: nonNegativeNumberSchema.nullable().optional(),
  barcode: z.string().trim().max(80).nullable().optional(),
  imageUrl: z.url().nullable().optional(),
  isVerified: z.boolean(),
  isEstimated: z.boolean(),
  servingLabel: z.string().trim().min(1).max(120),
  servingG: nonNegativeNumberSchema,
  per100g: NutritionTotalsSchema,
  units: z.array(
    z.object({
      label: z.string().trim().min(1).max(60),
      grams: nonNegativeNumberSchema,
    }),
  ),
  estimated: z.boolean().optional(),
});

export const FoodSearchQuerySchema = z.object({
  query: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(30).default(15),
  includeExternal: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const BarcodeParamSchema = z.object({
  barcode: z.string().trim().min(4).max(80),
});

export const FoodSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(FoodItemSchema),
  sources: z.array(FoodSourceSchema),
  cached: z.boolean(),
});

export const BodyMetricSchema = z.object({
  id: uuidSchema,
  profileId: uuidSchema,
  measuredAt: isoDateTimeSchema,
  weightKg: nonNegativeNumberSchema.nullable().optional(),
  bodyFatPercentage: z.number().finite().min(0).max(100).nullable().optional(),
  waistCm: nonNegativeNumberSchema.nullable().optional(),
  chestCm: nonNegativeNumberSchema.nullable().optional(),
  hipCm: nonNegativeNumberSchema.nullable().optional(),
  armCm: nonNegativeNumberSchema.nullable().optional(),
  thighCm: nonNegativeNumberSchema.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  createdAt: isoDateTimeSchema,
});

export const CreateBodyMetricSchema = BodyMetricSchema.omit({
  id: true,
  profileId: true,
  createdAt: true,
});

export const FoodAnalysisItemSchema = z.object({
  name: z.string().trim().min(1).max(160),
  estimatedPortion: z.string().trim().min(1).max(160),
  calories: nonNegativeNumberSchema,
  proteinG: nonNegativeNumberSchema,
  carbsG: nonNegativeNumberSchema,
  fatG: nonNegativeNumberSchema,
  fiberG: nonNegativeNumberSchema,
  confidence: confidenceSchema,
});

export const FoodAnalysisResultSchema = z.object({
  estimatedMealName: z.string().trim().min(1).max(160),
  items: z.array(FoodAnalysisItemSchema).min(1),
  totals: NutritionTotalsSchema,
  confidence: confidenceSchema,
  disclaimer: z.string().trim().min(1),
});

export const FoodAnalysisApiResponseSchema = FoodAnalysisResultSchema.extend({
  analysisId: uuidSchema,
});

export const GymMachineAnalysisResultSchema = z.object({
  machineName: z.string().trim().min(1).max(160),
  possibleExercises: z.array(z.string().trim().min(1).max(160)).min(1),
  primaryMuscles: z.array(z.string().trim().min(1).max(80)).default([]),
  secondaryMuscles: z.array(z.string().trim().min(1).max(80)).default([]),
  instructions: z.array(z.string().trim().min(1).max(500)).min(1),
  commonMistakes: z.array(z.string().trim().min(1).max(500)).default([]),
  safetyRecommendations: z.array(z.string().trim().min(1).max(500)).min(1),
  avoidIf: z.array(z.string().trim().min(1).max(500)).default([]),
  difficulty: z.enum(AI_DIFFICULTIES),
  confidence: confidenceSchema,
  disclaimer: z.string().trim().min(1),
});

export const GymMachineAnalysisApiResponseSchema = GymMachineAnalysisResultSchema.extend({
  analysisId: uuidSchema,
});

export const AnalyzePhotoRequestSchema = z.object({
  imageUrl: z.url(),
  notes: z.string().trim().max(2000).optional(),
});

export const AIChatRequestSchema = z.object({
  threadId: uuidSchema.optional(),
  message: z.string().trim().min(1).max(4000),
});

export const ChatMessageSchema = z.object({
  id: uuidSchema,
  threadId: uuidSchema,
  role: z.enum(CHAT_ROLES),
  content: z.string().trim().min(1),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: isoDateTimeSchema,
});

export const AIChatApiResponseSchema = z.object({
  threadId: uuidSchema,
  message: z.object({
    role: z.literal("assistant"),
    content: z.string().trim().min(1),
  }),
});

export const DashboardResponseSchema = z.object({
  workoutsLast7Days: z.number().int().min(0),
  mealsLast7Days: z.number().int().min(0),
  averageCalories: nonNegativeNumberSchema.nullable(),
  averageProteinG: nonNegativeNumberSchema.nullable(),
  latestWeightKg: nonNegativeNumberSchema.nullable(),
  recentExerciseProgress: z.array(
    z.object({
      exerciseId: uuidSchema,
      exerciseName: z.string(),
      latestWeight: nonNegativeNumberSchema.nullable(),
      latestReps: z.number().int().min(0).nullable(),
      loggedAt: isoDateTimeSchema,
    }),
  ),
  alerts: z.array(z.string()),
});
