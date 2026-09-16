import { describe, expect, it } from "vitest";
import { DEFINITION_ROUTINE_CATALOG_ADDITIONS } from "@fitfamily-ai/shared";
import { prepareDefinitionRoutineCatalog } from "../services/definitionRoutineCatalog";
import type { Row } from "../services/dataService";

function memoryCatalog(initial: Row[] = []) {
  const records = [...initial];
  return {
    records,
    async list() {
      return records.map((row) => ({ ...row }));
    },
    async insert(_table: string, input: Row) {
      if (records.some((record) => record.id === input.id)) throw new Error("Duplicate ID");
      records.push(input);
      return input;
    },
  };
}

describe("definition routine catalog preparation", () => {
  it("adds exactly the five missing variants and is idempotent", async () => {
    const data = memoryCatalog([{ id: "existing", name: "Sentadilla" }]);
    await prepareDefinitionRoutineCatalog(data);
    await prepareDefinitionRoutineCatalog(data);
    expect(data.records).toHaveLength(6);
    expect(data.records.slice(1).map((row) => row.name)).toEqual(
      DEFINITION_ROUTINE_CATALOG_ADDITIONS.map((row) => row.name),
    );
  });

  it("reuses existing matching IDs, including accents and capitalisation", async () => {
    const data = memoryCatalog([{ id: "existing-curl", name: "CURL EN PÓLEA" }]);
    const result = await prepareDefinitionRoutineCatalog(data);
    expect(result.find((row) => row.name === "CURL EN PÓLEA")?.id).toBe("existing-curl");
    expect(data.records).toHaveLength(5);
  });

  it("can recover concurrent preparation without duplicate exercise IDs", async () => {
    const data = memoryCatalog();
    await Promise.all([
      prepareDefinitionRoutineCatalog(data),
      prepareDefinitionRoutineCatalog(data),
    ]);
    expect(data.records).toHaveLength(5);
    expect(new Set(data.records.map((row) => row.id)).size).toBe(5);
  });

  it("does not hide a database failure when the requested variant is still missing", async () => {
    await expect(
      prepareDefinitionRoutineCatalog({
        async list() {
          return [];
        },
        async insert() {
          throw new Error("Offline");
        },
      }),
    ).rejects.toThrow("Offline");
  });
});
