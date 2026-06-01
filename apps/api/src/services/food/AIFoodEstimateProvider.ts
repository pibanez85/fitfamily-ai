import type { FoodCatalogItem } from "@fitfamily-ai/shared";
import type { AIProvider } from "../ai/types";
import type { FoodDataProvider, FoodSearchOptions } from "./FoodDataProvider";

export class AIFoodEstimateProvider implements FoodDataProvider {
  readonly source = "ai_estimate" as const;

  constructor(private readonly _aiProvider: AIProvider) {}

  async searchFoods(_query: string, _options: FoodSearchOptions): Promise<FoodCatalogItem[]> {
    return [];
  }

  async getFoodDetails(_id: string): Promise<FoodCatalogItem | null> {
    return null;
  }

  async getFoodByBarcode(_barcode: string): Promise<FoodCatalogItem | null> {
    return null;
  }
}
