import { describe, expect, it } from "vitest";
import { calculateFoodMacros, describeServing, foodCatalog, searchFoods } from "./foodCatalog";

describe("food catalog", () => {
  it("includes a broad initial Chilean food base", () => {
    expect(foodCatalog.length).toBeGreaterThanOrEqual(150);
  });

  it("finds Chilean aliases without accents", () => {
    const results = searchFoods("pan frances");
    expect(results.some((food) => food.id === "marraqueta")).toBe(true);
  });

  it("finds common Chilean terms and aliases", () => {
    expect(searchFoods("aguacate")[0]?.name).toBe("Palta");
    expect(searchFoods("coca").some((food) => food.name.includes("cola"))).toBe(true);
    expect(searchFoods("pollo").some((food) => food.name.includes("Pollo"))).toBe(true);
  });

  it("describes portions with a clear unit and grams", () => {
    const egg = searchFoods("huevo")[0]!;
    expect(describeServing(egg, 2, "huevo mediano")).toContain("100 g");
  });

  it("calculates macros from grams", () => {
    const rice = searchFoods("arroz")[0]!;
    const macros = calculateFoodMacros(rice, 160);
    expect(macros.calories).toBeGreaterThan(180);
    expect(macros.carbsG).toBeGreaterThan(40);
  });
});
