import { describe, expect, it } from "vitest";
import {
  FOOD_ANALYSIS_DISCLAIMER,
  GYM_MACHINE_DISCLAIMER,
  FoodAnalysisResultSchema,
  GymMachineAnalysisResultSchema,
} from "./index";

describe("AI result schemas", () => {
  it("validates a structured food photo analysis", () => {
    const result = FoodAnalysisResultSchema.parse({
      estimatedMealName: "Pollo con arroz",
      items: [
        {
          name: "Pechuga de pollo",
          estimatedPortion: "150 g",
          calories: 250,
          proteinG: 45,
          carbsG: 0,
          fatG: 6,
          fiberG: 0,
          confidence: 0.78,
        },
      ],
      totals: {
        calories: 250,
        proteinG: 45,
        carbsG: 0,
        fatG: 6,
        fiberG: 0,
      },
      confidence: 0.78,
      disclaimer: FOOD_ANALYSIS_DISCLAIMER,
    });

    expect(result.items[0]?.proteinG).toBe(45);
  });

  it("rejects food analysis confidence outside 0..1", () => {
    expect(() =>
      FoodAnalysisResultSchema.parse({
        estimatedMealName: "Desconocido",
        items: [
          {
            name: "Comida",
            estimatedPortion: "1 plato",
            calories: 500,
            proteinG: 20,
            carbsG: 60,
            fatG: 15,
            fiberG: 8,
            confidence: 2,
          },
        ],
        totals: {
          calories: 500,
          proteinG: 20,
          carbsG: 60,
          fatG: 15,
          fiberG: 8,
        },
        confidence: 2,
        disclaimer: FOOD_ANALYSIS_DISCLAIMER,
      }),
    ).toThrow();
  });

  it("validates a structured gym machine analysis", () => {
    const result = GymMachineAnalysisResultSchema.parse({
      machineName: "Prensa de piernas",
      possibleExercises: ["Prensa de piernas"],
      primaryMuscles: ["cuadriceps", "gluteos"],
      secondaryMuscles: ["isquiotibiales"],
      instructions: ["Ajusta el respaldo", "Empuja la plataforma sin bloquear rodillas"],
      commonMistakes: ["Bloquear rodillas", "Bajar demasiado sin control"],
      safetyRecommendations: ["Usa rango controlado", "Detente ante dolor agudo"],
      avoidIf: ["Dolor de rodilla no evaluado"],
      difficulty: "beginner",
      confidence: 0.82,
      disclaimer: GYM_MACHINE_DISCLAIMER,
    });

    expect(result.primaryMuscles).toContain("cuadriceps");
  });
});
