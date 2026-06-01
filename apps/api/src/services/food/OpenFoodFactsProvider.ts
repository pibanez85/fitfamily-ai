import type { FoodCatalogItem } from "@fitfamily-ai/shared";
import type { FoodDataProvider, FoodSearchOptions } from "./FoodDataProvider";

type OpenFoodFactsConfig = {
  baseUrl: string;
  userAgent: string;
};

type OpenFoodFactsProduct = Record<string, unknown>;

export class OpenFoodFactsProvider implements FoodDataProvider {
  readonly source = "open_food_facts" as const;

  constructor(private readonly config: OpenFoodFactsConfig) {}

  async searchFoods(query: string, options: FoodSearchOptions): Promise<FoodCatalogItem[]> {
    if (query.trim().length < 2) return [];
    const fields = [
      "code",
      "product_name",
      "brands",
      "categories",
      "countries_tags",
      "image_front_small_url",
      "serving_quantity",
      "serving_size",
      "nutriments",
    ].join(",");
    const url = new URL("/cgi/search.pl", this.config.baseUrl);
    url.searchParams.set("search_terms", query);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", String(Math.min(options.limit, 12)));
    url.searchParams.set("fields", fields);

    const payload = await this.fetchJson(url);
    const products = Array.isArray(payload.products) ? payload.products : [];
    return products
      .map((product) => normalizeOpenFoodFactsProduct(product as OpenFoodFactsProduct))
      .filter((food): food is FoodCatalogItem => Boolean(food));
  }

  async getFoodDetails(id: string): Promise<FoodCatalogItem | null> {
    return this.getFoodByBarcode(id);
  }

  async getFoodByBarcode(barcode: string): Promise<FoodCatalogItem | null> {
    const fields = [
      "code",
      "product_name",
      "brands",
      "categories",
      "countries_tags",
      "image_front_small_url",
      "serving_quantity",
      "serving_size",
      "nutriments",
    ].join(",");
    const url = new URL(`/api/v2/product/${encodeURIComponent(barcode)}.json`, this.config.baseUrl);
    url.searchParams.set("fields", fields);
    const payload = await this.fetchJson(url);
    const product = isRecord(payload.product) ? payload.product : null;
    return product ? normalizeOpenFoodFactsProduct(product) : null;
  }

  private async fetchJson(url: URL): Promise<Record<string, unknown>> {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": this.config.userAgent,
      },
    });

    if (!response.ok) return {};
    const payload = (await response.json()) as unknown;
    return isRecord(payload) ? payload : {};
  }
}

function normalizeOpenFoodFactsProduct(product: OpenFoodFactsProduct): FoodCatalogItem | null {
  const name = text(product.product_name);
  const code = text(product.code);
  const nutriments = isRecord(product.nutriments) ? product.nutriments : {};
  const calories = numberFrom(nutriments["energy-kcal_100g"]);
  if (!name || calories === null) return null;

  const brand = text(product.brands);
  const servingGrams = numberFrom(product.serving_quantity) ?? 100;
  const servingSize = text(product.serving_size) ?? `${Math.round(servingGrams)} g`;
  const protein = numberFrom(nutriments.proteins_100g) ?? 0;
  const carbs = numberFrom(nutriments.carbohydrates_100g) ?? 0;
  const fat = numberFrom(nutriments.fat_100g) ?? 0;
  const fiber = numberFrom(nutriments.fiber_100g) ?? 0;

  return {
    id: `off-${code || slug(name)}`,
    source: "open_food_facts",
    sourceId: code || slug(name),
    name,
    brand,
    category: text(product.categories) ?? "Producto envasado",
    country: countryFromTags(product.countries_tags),
    aliases: brand ? [brand] : [],
    servingOptions: [
      {
        label: servingSize,
        quantity: 1,
        unit: "porcion",
        gramsEquivalent: servingGrams,
        description: `${servingSize} aprox. ${Math.round(servingGrams)} g`,
      },
      { label: "100 g", quantity: 100, unit: "g", gramsEquivalent: 100 },
    ],
    baseQuantity: 100,
    baseUnit: "g",
    gramsPerBaseUnit: 100,
    caloriesPer100g: calories,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    fatPer100g: fat,
    fiberPer100g: fiber,
    sugarPer100g: numberFrom(nutriments.sugars_100g),
    sodiumPer100g: numberFrom(nutriments.sodium_100g),
    barcode: code,
    imageUrl: text(product.image_front_small_url),
    isVerified: false,
    isEstimated: false,
    servingLabel: servingSize,
    servingG: servingGrams,
    per100g: { calories, proteinG: protein, carbsG: carbs, fatG: fat, fiberG: fiber },
    units: [{ label: "porcion", grams: servingGrams }, { label: "g", grams: 1 }],
    estimated: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberFrom(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function countryFromTags(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const chile = value.find((item) => typeof item === "string" && item.toLowerCase().includes("chile"));
  return typeof chile === "string" ? "CL" : null;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
