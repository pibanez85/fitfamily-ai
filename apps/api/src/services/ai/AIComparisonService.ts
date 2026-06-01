import type { AIProviderResult, FoodAnalysisResult } from "@fitfamily-ai/shared";
import type { AIProvider, AnalyzePhotoInput } from "./types";

export type AIArenaScore = {
  exactitud: number;
  claridad: number;
  seguridad: number;
  utilidadPractica: number;
  formatoJsonValido: boolean;
  latenciaMs: number;
};

export class AIComparisonService {
  constructor(private readonly enabled: boolean) {}

  async compareFoodPhoto(
    input: AnalyzePhotoInput,
    providers: AIProvider[],
  ): Promise<Array<{ result: AIProviderResult<FoodAnalysisResult>; score: AIArenaScore }> | null> {
    if (!this.enabled) return null;

    const settled = await Promise.allSettled(
      providers.map(async (provider) => provider.analyzeFoodPhoto(input)),
    );

    return settled.flatMap((entry) => {
      if (entry.status === "rejected") return [];

      const result = entry.value;
      return [
        {
          result,
          score: {
            exactitud: result.data.confidence,
            claridad: result.data.items.length > 0 ? 0.8 : 0.2,
            seguridad: result.data.disclaimer.length > 0 ? 1 : 0,
            utilidadPractica: result.data.items.length > 0 ? 0.8 : 0.2,
            formatoJsonValido: true,
            latenciaMs: result.latencyMs,
          },
        },
      ];
    });
  }
}
