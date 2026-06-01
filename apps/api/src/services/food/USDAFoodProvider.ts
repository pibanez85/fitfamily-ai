import type { FoodCatalogItem } from "@fitfamily-ai/shared";
import type { FoodDataProvider, FoodSearchOptions } from "./FoodDataProvider";

type USDAFoodProviderConfig = {
  apiKey?: string | undefined;
};

type USDAFood = Record<string, unknown>;

export class USDAFoodProvider implements FoodDataProvider {
  readonly source = "usda" as const;

  constructor(private readonly config: USDAFoodProviderConfig) {}

  async searchFoods(query: string, options: FoodSearchOptions): Promise<FoodCatalogItem[]> {
    if (!this.config.apiKey || query.trim().length < 2) return [];
    const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    url.searchParams.set("api_key", this.config.apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("pageSize", String(Math.min(options.limit, 10)));
    url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    const foods = isRecord(payload) && Array.isArray(payload.foods) ? payload.foods : [];
    return foods
      .map((food) => normalizeUSDAFood(food as USDAFood))
      .filter((food): food is FoodCatalogItem => Boolean(food));
  }

  async getFoodDetails(id: string): Promise<FoodCatalogItem | null> {
    if (!this.config.apiKey) return null;
    const fdcId = id.replace(/^usda-/, "");
    const url = new URL(`https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(fdcId)}`);
    url.searchParams.set("api_key", this.config.apiKey);
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const payload = (await response.json()) as unknown;
    return isRecord(payload) ? normalizeUSDAFood(payload) : null;
  }

  async getFoodByBarcode(_barcode: string): Promise<FoodCatalogItem | null> {
    return null;
  }
}

function normalizeUSDAFood(food: USDAFood): FoodCatalogItem | null {
  const fdcId = textOrNumber(food.fdcId);
  const name = text(food.description);
  if (!fdcId || !name) return null;
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
  const calories = nutrient(nutrients, ["Energy"], ["KCAL"]) ?? nutrient(nutrients, ["Energy"], []) ?? 0;
  const protein = nutrient(nutrients, ["Protein"], []) ?? 0;
  const carbs = nutrient(nutrients, ["Carbohydrate"], []) ?? 0;
  const fat = nutrient(nutrients, ["Total lipid", "fat"], []) ?? 0;
  const fiber = nutrient(nutrients, ["Fiber"], []) ?? 0;
  const sugar = nutrient(nutrients, ["Sugars"], []);
  const sodium = nutrient(nutrients, ["Sodium"], []);
  if (calories <= 0 && protein <= 0 && carbs <= 0 && fat <= 0) return null;

  return {
    id: `usda-${fdcId}`,
    source: "usda",
    sourceId: fdcId,
    name: titleCase(name),
    brand: text(food.brandName),
    category: text(food.foodCategory) ?? "Alimento generico",
    country: null,
    aliases: [name],
    servingOptions: [
      { label: "100 g", quantity: 100, unit: "g", gramsEquivalent: 100 },
      { label: "1 porcion aprox. 100 g", quantity: 1, unit: "porcion", gramsEquivalent: 100 },
    ],
    baseQuantity: 100,
    baseUnit: "g",
    gramsPerBaseUnit: 100,
    caloriesPer100g: calories,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    fiberPer100g: fiber,
    sugarPer100g: sugar,
    sodiumPer100g: sodium,
    barcode: null,
    imageUrl: null,
    isVerified: true,
    isEstimated: false,
    servingLabel: "100 g",
    servingG: 100,
    per100g: { calories, proteinG: protein, carbsG: carbs, fatG: fat, fiberG: fiber },
    units: [{ label: "g", grams: 1 }, { label: "porcion", grams: 100 }],
    estimated: false,
  };
}

function nutrient(nutrients: unknown[], nameParts: string[], units: string[]): number | null {
  const found = nutrients.find((item) => {
    if (!isRecord(item)) return false;
    const name = text(item.nutrientName) ?? text(item.name) ?? "";
    const unit = text(item.unitName) ?? "";
    const hasName = nameParts.some((part) => name.toLowerCase().includes(part.toLowerCase()));
    const hasUnit = units.length === 0 || units.some((candidate) => unit.toLowerCase().includes(candidate.toLowerCase()));
    return hasName && hasUnit;
  });
  return isRecord(found) ? numberFrom(found.value ?? found.amount) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function textOrNumber(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return text(value);
}

function numberFrom(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
