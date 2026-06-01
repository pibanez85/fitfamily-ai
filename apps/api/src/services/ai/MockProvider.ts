import {
  FOOD_ANALYSIS_DISCLAIMER,
  GYM_MACHINE_DISCLAIMER,
  HEALTH_DISCLAIMER,
  type AIProviderResult,
  type FoodAnalysisResult,
  type GymMachineAnalysisResult,
} from "@fitfamily-ai/shared";
import type { AIChatInput, AIChatProviderResult, AIProvider, AnalyzePhotoInput } from "./types";

export class MockProvider implements AIProvider {
  readonly name = "mock" as const;

  async analyzeFoodPhoto(
    _input: AnalyzePhotoInput,
  ): Promise<AIProviderResult<FoodAnalysisResult>> {
    const started = Date.now();
    return {
      provider: this.name,
      model: "local-mock",
      latencyMs: Date.now() - started,
      data: {
        estimatedMealName: "Comida estimada de prueba",
        items: [
          {
            name: "Proteina magra",
            estimatedPortion: "1 porcion",
            calories: 220,
            proteinG: 32,
            carbsG: 4,
            fatG: 8,
            fiberG: 1,
            confidence: 0.45,
          },
          {
            name: "Carbohidrato",
            estimatedPortion: "1 taza",
            calories: 190,
            proteinG: 4,
            carbsG: 42,
            fatG: 1,
            fiberG: 2,
            confidence: 0.45,
          },
        ],
        totals: {
          calories: 410,
          proteinG: 36,
          carbsG: 46,
          fatG: 9,
          fiberG: 3,
        },
        confidence: 0.45,
        disclaimer: FOOD_ANALYSIS_DISCLAIMER,
      },
    };
  }

  async analyzeGymMachinePhoto(
    _input: AnalyzePhotoInput,
  ): Promise<AIProviderResult<GymMachineAnalysisResult>> {
    const started = Date.now();
    return {
      provider: this.name,
      model: "local-mock",
      latencyMs: Date.now() - started,
      data: {
        machineName: "Maquina no confirmada",
        possibleExercises: ["Movimiento guiado de fuerza"],
        primaryMuscles: ["grupo muscular principal por confirmar"],
        secondaryMuscles: [],
        instructions: [
          "Ajusta asiento y apoyos antes de cargar peso.",
          "Haz una serie liviana para confirmar rango y comodidad.",
          "Mantén control durante todo el recorrido.",
        ],
        commonMistakes: ["Usar demasiado peso", "Perder postura", "Bloquear articulaciones"],
        safetyRecommendations: ["Detente ante dolor agudo", "Pide ayuda si no conoces la maquina"],
        avoidIf: ["Dolor o lesion sin evaluacion profesional"],
        difficulty: "unknown",
        confidence: 0.35,
        disclaimer: GYM_MACHINE_DISCLAIMER,
      },
    };
  }

  async chat(input: AIChatInput): Promise<AIProviderResult<AIChatProviderResult>> {
    const started = Date.now();
    return {
      provider: this.name,
      model: "local-mock",
      latencyMs: Date.now() - started,
      data: {
        content: `Tengo el contexto del perfil y puedo ayudarte a revisar la rutina. Modo mock activo: conecta OpenAI para respuestas reales. ${HEALTH_DISCLAIMER}\n\nTu mensaje: ${input.message}`,
      },
    };
  }
}
