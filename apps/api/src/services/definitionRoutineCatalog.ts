import { DEFINITION_ROUTINE_CATALOG_ADDITIONS, normalizeExerciseName } from "@fitfamily-ai/shared";
import type { DataService } from "./dataService";

type CatalogRecord = { id: string; name: string };

/** A fixed server whitelist. Stable IDs make concurrent preparations safe to retry. */
export async function prepareDefinitionRoutineCatalog(
  data: Pick<DataService, "list" | "insert">,
): Promise<CatalogRecord[]> {
  const catalog = (await data.list("exercises", { order: "name" })) as CatalogRecord[];
  for (const [index, addition] of DEFINITION_ROUTINE_CATALOG_ADDITIONS.entries()) {
    if (
      catalog.some(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(addition.name),
      )
    )
      continue;
    const id = `daff0000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    try {
      const inserted = await data.insert("exercises", { ...addition, id });
      catalog.push(inserted as CatalogRecord);
    } catch (error) {
      // Another request may have inserted the same deterministic key while we waited.
      const refreshed = (await data.list("exercises", { order: "name" })) as CatalogRecord[];
      const existing = refreshed.find(
        (exercise) => normalizeExerciseName(exercise.name) === normalizeExerciseName(addition.name),
      );
      if (!existing) throw error;
      catalog.push(existing);
    }
  }
  return catalog;
}
