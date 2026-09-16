import { describe, expect, it } from "vitest";
import {
  buildDefinitionRoutine,
  DEFINITION_ROUTINE,
  DEFINITION_ROUTINE_CATALOG_ADDITIONS,
  isDefinitionRoutine,
} from "./definitionRoutine";
import { EXERCISE_LIBRARY } from "./exerciseLibrary";
import { CreateWorkoutSchema } from "./schemas";

const catalog = EXERCISE_LIBRARY.map((exercise, index) => ({
  name: exercise.name,
  id: `12345678-1234-4234-8234-${String(index + 1).padStart(12, "0")}`,
}));

describe("the user's five-day PDF routine", () => {
  it("preserves all 39 rows, five training days and the two recovery days", () => {
    const result = buildDefinitionRoutine(catalog);
    expect(result.issues).toEqual([]);
    expect(result.missingExercises).toEqual([]);
    expect(CreateWorkoutSchema.safeParse(result.workout).success).toBe(true);
    expect(result.workout?.days.map((day) => day.exercises.length)).toEqual([7, 7, 9, 8, 8]);
    expect(result.workout?.days.map((day) => day.dayIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(
      DEFINITION_ROUTINE.weeklySchedule.filter((day) => !day.training).map((day) => day.weekday),
    ).toEqual(["Jueves", "Domingo"]);
    expect(isDefinitionRoutine(result.workout!)).toBe(true);
    expect(result.workout?.description).toContain("1.8-2.2");
  });

  it("preserves RIR, rep ranges, unilateral leg notation and source labels without inventing loads or rests", () => {
    const workout = buildDefinitionRoutine(catalog).workout!;
    const flat = workout.days.flatMap((day) => day.exercises);
    for (const exercise of flat) {
      expect(exercise.notes).toContain("RIR 1-2");
      expect(exercise.restSeconds).toBeNull();
      expect(exercise.targetWeight).toBeNull();
    }
    expect(workout.days[0]?.exercises[0]?.targetReps).toBe("6-8");
    expect(workout.days[1]?.exercises[2]?.targetReps).toBe("10-12 c/pierna");
    expect(workout.days[1]?.exercises[2]?.notes).toContain("2-3 series");
    expect(
      workout.days[2]?.exercises
        .slice(3, 6)
        .reduce((sum, exercise) => sum + exercise.targetSets!, 0),
    ).toBe(8);
    expect(
      workout.days[2]?.exercises
        .slice(6, 9)
        .reduce((sum, exercise) => sum + exercise.targetSets!, 0),
    ).toBe(8);
    expect(workout.days[4]?.exercises[0]?.targetSets).toBe(4);
    expect(
      flat.map((entry) => catalog.find((exercise) => exercise.id === entry.exerciseId)?.name),
    ).not.toContain("Peso muerto rumano");
    expect(
      flat.map((entry) => catalog.find((exercise) => exercise.id === entry.exerciseId)?.name),
    ).not.toContain("Split squat bulgaro");
  });

  it("requires every exact variant; a generic curl or press must not silently replace it", () => {
    const missingNames = DEFINITION_ROUTINE_CATALOG_ADDITIONS.map((exercise) => exercise.name);
    const result = buildDefinitionRoutine(
      catalog.filter((exercise) => !missingNames.includes(exercise.name)),
    );
    expect(result.workout).toBeNull();
    expect(result.missingExercises.sort()).toEqual(missingNames.sort());
  });

  it("allows only the PDF alternatives and exposes every choice for review", () => {
    const result = buildDefinitionRoutine(catalog, {
      unilateralSets: 2,
      exerciseChoices: {
        "martes-sentadilla": "Sentadilla",
        "lunes-laterales": "Elevaciones laterales en polea",
      },
    });
    expect(result.workout?.days[1]?.exercises[2]?.targetSets).toBe(2);
    expect(result.selections).toContainEqual(
      expect.objectContaining({ key: "martes-sentadilla", selectedName: "Sentadilla" }),
    );
    expect(result.workout?.days[0]?.exercises[4]?.notes).toContain(
      "Variante elegida: Elevaciones laterales en polea",
    );
    const invalid = buildDefinitionRoutine(catalog, {
      exerciseChoices: { "sabado-femoral": "Peso muerto rumano" },
    });
    expect(invalid.workout).toBeNull();
    expect(invalid.issues[0]).toContain("no está contemplada");
  });

  it("rejects unavailable chosen alternatives, ambiguous catalog identities and invalid UUIDs", () => {
    expect(
      buildDefinitionRoutine(catalog, {
        exerciseChoices: { "miercoles-press": "Press de hombros en maquina" },
      }).missingExercises,
    ).toEqual(["Press de hombros en maquina"]);
    const duplicate = { name: "Curl en polea", id: "12345678-1234-4234-8234-999999999999" };
    expect(buildDefinitionRoutine([...catalog, duplicate]).issues[0]).toContain(
      "más de un identificador",
    );
    expect(
      buildDefinitionRoutine(
        catalog.map((exercise) =>
          exercise.name === "Curl en polea" ? { ...exercise, id: "made-up" } : exercise,
        ),
      ).workout,
    ).toBeNull();
  });

  it("does not mutate a caller's catalog or reclassify unrelated routines", () => {
    const before = JSON.stringify(catalog);
    buildDefinitionRoutine(catalog);
    expect(JSON.stringify(catalog)).toBe(before);
    expect(isDefinitionRoutine({ description: "Rutina de definición propia" })).toBe(false);
  });
});
