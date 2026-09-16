import { describe, expect, it } from "vitest";
import { buildExerciseTechniqueVideoSearchUrl, EXERCISE_LIBRARY } from "./exerciseLibrary";

describe("buildExerciseTechniqueVideoSearchUrl", () => {
  it("builds a YouTube search URL scoped to Shorts", () => {
    const url = buildExerciseTechniqueVideoSearchUrl("Sentadilla goblet");
    expect(url).toContain("https://www.youtube.com/results?");
    expect(url).toContain("search_query=Sentadilla+goblet");
    // sp=EgIYAQ%3D%3D is YouTube's own "Shorts" filter parameter.
    expect(url).toContain("sp=EgIYAQ%3D%3D");
  });

  it("URL-encodes exercise names with accents and special characters", () => {
    const url = buildExerciseTechniqueVideoSearchUrl("Extensión de tríceps en polea");
    expect(url).not.toContain(" ");
    expect(() => new URL(url)).not.toThrow();
  });

  it("produces a valid, distinct search URL for every exercise in the library", () => {
    const urls = EXERCISE_LIBRARY.map((exercise) => buildExerciseTechniqueVideoSearchUrl(exercise.name));
    for (const url of urls) {
      expect(() => new URL(url)).not.toThrow();
    }
    // Different exercise names should not collide on the same search query.
    expect(new Set(urls).size).toBe(urls.length);
  });
});
