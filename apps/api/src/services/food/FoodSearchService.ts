import type { FoodCatalogItem, FoodSearchResponse, FoodSource } from "@fitfamily-ai/shared";
import type { FoodDataProvider } from "./FoodDataProvider";

type CacheEntry = {
  expiresAt: number;
  response: FoodSearchResponse;
};

export class FoodSearchService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly ttlMs = 1000 * 60 * 60 * 12;

  constructor(private readonly providers: FoodDataProvider[]) {}

  async search(query: string, options: { limit: number; includeExternal: boolean }): Promise<FoodSearchResponse> {
    const normalized = query.trim();
    const cacheKey = `search:${normalized.toLowerCase()}:${options.limit}:${options.includeExternal}`;
    const cached = this.get(cacheKey);
    if (cached) return { ...cached, cached: true };

    const providers = options.includeExternal ? this.providers : this.providers.filter((provider) => provider.source === "local");
    const perProviderLimit = Math.max(options.limit, 8);
    const settled = await Promise.allSettled(
      providers.map(async (provider) => provider.searchFoods(normalized, { limit: perProviderLimit })),
    );
    const results = uniqueFoods(
      settled.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
    ).slice(0, options.limit);

    const response: FoodSearchResponse = {
      query: normalized,
      results,
      sources: uniqueSources(results),
      cached: false,
    };
    this.set(cacheKey, response);
    return response;
  }

  async byBarcode(barcode: string): Promise<FoodCatalogItem | null> {
    const cacheKey = `barcode:${barcode}`;
    const cached = this.get(cacheKey);
    if (cached) return cached.results[0] ?? null;

    for (const provider of this.providers) {
      const food = await provider.getFoodByBarcode(barcode);
      if (food) {
        this.set(cacheKey, { query: barcode, results: [food], sources: [food.source], cached: false });
        return food;
      }
    }

    this.set(cacheKey, { query: barcode, results: [], sources: [], cached: false });
    return null;
  }

  private get(key: string): FoodSearchResponse | null {
    const found = this.cache.get(key);
    if (!found) return null;
    if (found.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return found.response;
  }

  private set(key: string, response: FoodSearchResponse): void {
    this.cache.set(key, { response, expiresAt: Date.now() + this.ttlMs });
  }
}

function uniqueFoods(foods: FoodCatalogItem[]): FoodCatalogItem[] {
  const seen = new Set<string>();
  return foods.filter((food) => {
    const key = `${food.source}:${food.sourceId ?? food.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSources(foods: FoodCatalogItem[]): FoodSource[] {
  return Array.from(new Set(foods.map((food) => food.source)));
}
