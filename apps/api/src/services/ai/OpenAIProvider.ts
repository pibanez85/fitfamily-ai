import {
  FOOD_ANALYSIS_DISCLAIMER,
  FoodAnalysisResultSchema,
  GYM_MACHINE_DISCLAIMER,
  GymMachineAnalysisResultSchema,
  type AIProviderResult,
  type FoodAnalysisResult,
  type GeneratedWorkout,
  type GymMachineAnalysisResult,
} from "@fitfamily-ai/shared";
import OpenAI from "openai";
import { AppError } from "../../utils/AppError";
import {
  foodAnalysisJsonSchema,
  generatedWorkoutJsonSchema,
  gymMachineAnalysisJsonSchema,
} from "./jsonSchemas";
import { parseStructuredJson } from "./parse";
import {
  chatSystemPrompt,
  foodAnalysisSystemPrompt,
  gymMachineSystemPrompt,
  workoutBuilderSystemPrompt,
} from "./prompts";
import type {
  AIChatInput,
  AIChatProviderResult,
  AIProvider,
  AnalyzePhotoInput,
  GenerateWorkoutInput,
} from "./types";
import { GeneratedWorkoutRawSchema, enrichGeneratedWorkout } from "./workoutBuilder";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  private readonly client: OpenAI;

  constructor(
    apiKey: string | undefined,
    private readonly modelText: string,
    private readonly modelVision: string,
  ) {
    if (!apiKey || isPlaceholderKey(apiKey)) {
      throw new AppError(
        500,
        "OPENAI_KEY_MISSING",
        "OPENAI_API_KEY real is required when AI_PROVIDER=openai.",
      );
    }

    this.client = new OpenAI({ apiKey });
  }

  async analyzeFoodPhoto(
    input: AnalyzePhotoInput,
  ): Promise<AIProviderResult<FoodAnalysisResult>> {
    const started = Date.now();
    const response = (await this.client.responses.create({
      model: this.modelVision,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: foodAnalysisSystemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analiza esta comida. Notas del usuario: ${input.notes ?? "sin notas"}.
Devuelve estimaciones de calorias, proteinas, carbohidratos, grasas y fibra. Usa este disclaimer exacto: ${FOOD_ANALYSIS_DISCLAIMER}`,
            },
            { type: "input_image", image_url: input.imageUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "food_photo_analysis",
          schema: foodAnalysisJsonSchema,
          strict: true,
        },
      },
    } as any)) as any;

    const data = parseStructuredJson(response.output_text ?? "", FoodAnalysisResultSchema);

    return {
      provider: this.name,
      model: this.modelVision,
      latencyMs: Date.now() - started,
      data,
      rawResponse: response,
    };
  }

  async analyzeGymMachinePhoto(
    input: AnalyzePhotoInput,
  ): Promise<AIProviderResult<GymMachineAnalysisResult>> {
    const started = Date.now();
    const response = (await this.client.responses.create({
      model: this.modelVision,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: gymMachineSystemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Identifica la maquina y explica ejercicios posibles. Notas del usuario: ${input.notes ?? "sin notas"}.
Usa este disclaimer exacto: ${GYM_MACHINE_DISCLAIMER}`,
            },
            { type: "input_image", image_url: input.imageUrl },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "gym_machine_photo_analysis",
          schema: gymMachineAnalysisJsonSchema,
          strict: true,
        },
      },
    } as any)) as any;

    const data = parseStructuredJson(response.output_text ?? "", GymMachineAnalysisResultSchema);

    return {
      provider: this.name,
      model: this.modelVision,
      latencyMs: Date.now() - started,
      data,
      rawResponse: response,
    };
  }

  async chat(input: AIChatInput): Promise<AIProviderResult<AIChatProviderResult>> {
    const started = Date.now();
    const response = (await this.client.responses.create({
      model: this.modelText,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: chatSystemPrompt }],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Contexto disponible de los ultimos 30 dias:\n${input.context}\n\nMensaje del usuario:\n${input.message}`,
            },
          ],
        },
      ],
    } as any)) as any;

    const content = String(response.output_text ?? "").trim();
    if (!content) {
      throw new AppError(502, "AI_EMPTY_RESPONSE", "AI provider returned an empty response.");
    }

    return {
      provider: this.name,
      model: this.modelText,
      latencyMs: Date.now() - started,
      data: { content },
      rawResponse: response,
    };
  }

  async generateWorkout(input: GenerateWorkoutInput): Promise<AIProviderResult<GeneratedWorkout>> {
    const started = Date.now();
    const catalogText = input.catalog
      .map(
        (item) =>
          `${item.id} | ${item.name} | musculos: ${item.muscles.join(", ") || "varios"} | equipo: ${item.equipment ?? "variable"}`,
      )
      .join("\n");

    const userText = [
      `Objetivo: ${input.goal}.`,
      `Frecuencia: ${input.frequency} dias por semana (crea EXACTAMENTE ${input.frequency} dias).`,
      `Nivel del usuario: ${input.experienceLevel}.`,
      input.durationLabel ? `Duracion del plan: ${input.durationLabel}.` : "",
      input.instructions?.trim()
        ? `Peticion e instrucciones del usuario (PRIORIDAD MAXIMA, respetalas al pie de la letra): ${input.instructions.trim()}`
        : "El usuario no agrego instrucciones adicionales.",
      "",
      "Catalogo de ejercicios permitidos. Usa SOLO estos y copia el exerciseId EXACTO de la primera columna:",
      catalogText,
    ]
      .filter(Boolean)
      .join("\n");

    const response = (await this.client.responses.create({
      model: this.modelText,
      input: [
        { role: "system", content: [{ type: "input_text", text: workoutBuilderSystemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: userText }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "generated_workout",
          schema: generatedWorkoutJsonSchema,
          strict: true,
        },
      },
    } as any)) as any;

    const raw = parseStructuredJson(response.output_text ?? "", GeneratedWorkoutRawSchema);
    const data = enrichGeneratedWorkout(raw, input);

    return {
      provider: this.name,
      model: this.modelText,
      latencyMs: Date.now() - started,
      data,
      rawResponse: response,
    };
  }
}

function isPlaceholderKey(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return lower.includes("your-") || lower.includes("placeholder") || lower === "sk-your-server-only-key";
}
