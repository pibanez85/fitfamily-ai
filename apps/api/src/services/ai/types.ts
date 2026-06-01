import type {
  AIProviderName,
  AIProviderResult,
  FoodAnalysisResult,
  GymMachineAnalysisResult,
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

export interface AIProvider {
  readonly name: AIProviderName;
  analyzeFoodPhoto(input: AnalyzePhotoInput): Promise<AIProviderResult<FoodAnalysisResult>>;
  analyzeGymMachinePhoto(
    input: AnalyzePhotoInput,
  ): Promise<AIProviderResult<GymMachineAnalysisResult>>;
  chat(input: AIChatInput): Promise<AIProviderResult<AIChatProviderResult>>;
}
