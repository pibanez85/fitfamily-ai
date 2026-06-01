import type { FoodCatalogItem } from "@fitfamily-ai/shared";

export type FoodSearchOptions = {
  limit: number;
};

export interface FoodDataProvider {
  readonly source: FoodCatalogItem["source"];
  searchFoods(query: string, options: FoodSearchOptions): Promise<FoodCatalogItem[]>;
  getFoodDetails(id: string): Promise<FoodCatalogItem | null>;
  getFoodByBarcode(barcode: string): Promise<FoodCatalogItem | null>;
}
