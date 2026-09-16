import { describe, expect, it } from "vitest";
import {
  buildMockWorkout,
  enrichGeneratedWorkout,
  prepareWorkoutInput,
  type GeneratedWorkoutRaw,
} from "../services/ai/workoutBuilder";
import type { GenerateWorkoutInput } from "../services/ai/types";

const input: GenerateWorkoutInput = {
  profileId: "test",
  goal: "Fuerza",
  frequency: 2,
  experienceLevel: "Intermedio",
  catalog: [
    { id: "bar", name: "Sentadilla", equipment: "barra", muscles: ["pierna"] },
    { id: "db", name: "Remo", equipment: "mancuernas", muscles: ["espalda"] },
    { id: "either", name: "Peso muerto", equipment: "barra o mancuernas", muscles: ["pierna"] },
    { id: "both", name: "Press", equipment: "mancuernas y banco", muscles: ["pecho"] },
  ],
};
const exercise = (id = "db") => ({
  exerciseId: id,
  targetSets: 3,
  targetReps: "8-12",
  restSeconds: 90,
  notes: "Controla el movimiento",
});
const raw = (): GeneratedWorkoutRaw => ({
  summary: "Plan de dos días",
  days: [
    { name: "A", exercises: [exercise()] },
    { name: "B", exercises: [exercise("either")] },
  ],
});

describe("workout preferences and output integrity", () => {
  it("filters unavailable equipment and excluded exercises before generation", () => {
    const prepared = prepareWorkoutInput({
      ...input,
      allowedEquipment: ["Mancuerna"],
      excludedExerciseIds: ["db"],
    });
    expect(prepared.catalog.map((item) => item.id)).toEqual(["either"]);
  });
  it("requires every piece of a combined setup", () => {
    expect(
      prepareWorkoutInput({ ...input, allowedEquipment: ["mancuernas", "banco"] }).catalog.map(
        (item) => item.id,
      ),
    ).toEqual(["db", "either", "both"]);
  });
  it("reports incompatible requirements rather than using the full catalog", () => {
    expect(() => prepareWorkoutInput({ ...input, allowedEquipment: ["polea"] })).toThrow(
      /No hay ejercicios compatibles/,
    );
  });
  it("rejects stale exclusions and duplicate catalog ids", () => {
    expect(() => prepareWorkoutInput({ ...input, excludedExerciseIds: ["missing"] })).toThrow(
      /ya no existe/,
    );
    expect(() =>
      prepareWorkoutInput({ ...input, catalog: [...input.catalog, input.catalog[0]!] }),
    ).toThrow(/repetidos/);
  });
  it("rejects a different number of days without silently truncating the plan", () => {
    expect(() => enrichGeneratedWorkout({ ...raw(), days: [raw().days[0]!] }, input)).toThrow(
      /2 días/,
    );
  });
  it("rejects unknown or explicitly excluded exercises instead of discarding them", () => {
    const invalid = raw();
    invalid.days[0]!.exercises.push(exercise("invented"));
    expect(() => enrichGeneratedWorkout(invalid, input)).toThrow(/desconocido/);
    expect(() => enrichGeneratedWorkout(raw(), { ...input, excludedExerciseIds: ["db"] })).toThrow(
      /incompatible/,
    );
  });
  it("rejects an exercise with unavailable equipment", () => {
    const invalid = raw();
    invalid.days[0]!.exercises = [exercise("bar")];
    expect(() =>
      enrichGeneratedWorkout(invalid, { ...input, allowedEquipment: ["mancuernas"] }),
    ).toThrow(/incompatible/);
  });
  it("rejects duplicates, empty days, zero sets and negative rest", () => {
    const duplicate = raw();
    duplicate.days[0]!.exercises.push(exercise());
    expect(() => enrichGeneratedWorkout(duplicate, input)).toThrow(/repitió/);
    const empty = raw();
    empty.days[0]!.exercises = [];
    expect(() => enrichGeneratedWorkout(empty, input)).toThrow(/incompleta/);
    for (const patch of [{ targetSets: 0 }, { restSeconds: -1 }, { targetReps: " " }]) {
      const invalid = raw();
      Object.assign(invalid.days[0]!.exercises[0]!, patch);
      expect(() => enrichGeneratedWorkout(invalid, input)).toThrow(/inválidos/);
    }
  });
  it("preserves requested day names and exact exercise identifiers", () => {
    const result = enrichGeneratedWorkout(raw(), { ...input, dayNames: ["Lunes", "Jueves"] });
    expect(result.workoutDays.map((day) => day.name)).toEqual(["Lunes", "Jueves"]);
    expect(result.workoutDays[0]!.workoutDayExercises[0]!.exercises).toEqual({
      id: "db",
      name: "Remo",
    });
  });
  it("mock never pretends to interpret personalized instructions", () => {
    expect(() =>
      buildMockWorkout({ ...input, instructions: "Solo piernas, nada de brazos" }),
    ).toThrow(/modo de prueba/);
  });
  it("mock fills all six requested days even with a small permitted catalog", () => {
    const result = buildMockWorkout({
      ...input,
      frequency: 6,
      allowedEquipment: ["mancuernas"],
      excludedExerciseIds: ["db"],
    });
    expect(result.workoutDays).toHaveLength(6);
    expect(
      result.workoutDays.every(
        (day) =>
          day.workoutDayExercises.length === 1 &&
          day.workoutDayExercises[0]!.exerciseId === "either",
      ),
    ).toBe(true);
  });
});
