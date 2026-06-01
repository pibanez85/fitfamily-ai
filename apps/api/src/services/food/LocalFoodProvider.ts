import { foodCatalog, searchFoods, type FoodCatalogItem } from "@fitfamily-ai/shared";
import type { FoodDataProvider, FoodSearchOptions } from "./FoodDataProvider";

export class LocalFoodProvider implements FoodDataProvider {
  readonly source = "local" as const;

  async searchFoods(query: string, options: FoodSearchOptions): Promise<FoodCatalogItem[]> {
    return searchFoods(query, options.limit);
  }

  async getFoodDetails(id: string): Promise<FoodCatalogItem | null> {
    return foodCatalog.find((food) => food.id === id) ?? null;
  }

  async getFoodByBarcode(_barcode: string): Promise<FoodCatalogItem | null> {
    return null;
  }
}
