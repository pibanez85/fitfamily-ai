import type {
  AIProviderName,
  AIProviderResult,
  FoodAnalysisResult,
  GeneratedWorkout,
  GymMachineAnalysisResult,
  WorkoutBuilderCatalogItem,
} from "@fitfamily-ai/shared";

export type AnalyzePhotoInput = {
  profileId: string;
  imageUrl: string;
  notes?: string;
};

export type AIChatInput = {
  profileId: string;
  threadId: string;
  message: string;
  context: string;
};

export type AIChatProviderResult = {
  content: string;
};

export type GenerateWorkoutInput = {
  profileId: string;
  goal: string;
  frequency: number;
  experienceLevel: string;
  durationLabel?: string;
  instructions?: string;
  catalog: WorkoutBuilderCatalogItem[];
};

export interface AIProvider {
  readonly name: AIProviderName;
  analyzeFoodPhoto(input: AnalyzePhotoInput): Promise<AIProviderResult<FoodAnalysisResult>>;
  analyzeGymMachinePhoto(
    input: AnalyzePhotoInput,
  ): Promise<AIProviderResult<GymMachineAnalysisResult>>;
  chat(input: AIChatInput): Promise<AIProviderResult<AIChatProviderResult>>;
  generateWorkout(input: GenerateWorkoutInput): Promise<AIProviderResult<GeneratedWorkout>>;
}
