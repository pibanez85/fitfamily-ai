import { describe, expect, it } from "vitest";
import { FoodSearchService } from "../services/food/FoodSearchService";
import { LocalFoodProvider } from "../services/food/LocalFoodProvider";

describe("FoodSearchService", () => {
  it("returns normalized local foods and cache metadata", async () => {
    const service = new FoodSearchService([new LocalFoodProvider()]);
    const first = await service.search("marraqueta", { includeExternal: false, limit: 5 });
    const second = await service.search("marraqueta", { includeExternal: false, limit: 5 });

    expect(first.results[0]?.source).toBe("local");
    expect(first.results.some((food) => food.name.includes("marraqueta"))).toBe(true);
    expect(second.cached).toBe(true);
  });
});
