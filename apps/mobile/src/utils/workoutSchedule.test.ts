import { describe, expect, it } from "vitest";
import type { WorkoutLog } from "@fitfamily-ai/shared";
import { suggestedWorkoutDay } from "./workoutSchedule";

describe("weekly workout schedule", () => {
  it("follows all five PDF training days and both rest days", () => {
    const days = [
      "Lunes · Torso",
      "Martes · Piernas",
      "Miércoles · Brazos",
      "Viernes · Torso",
      "Sábado · Piernas",
    ].map((name, dayIndex) => ({ id: String(dayIndex), name, dayIndex }));
    expect(
      [14, 15, 16, 17, 18, 19, 20].map((day) =>
        suggestedWorkoutDay(days, [], "routine", `2026-09-${day}`),
      ),
    ).toEqual([0, 1, 2, -1, 3, 4, -1]);
  });
  it("advances unscheduled routines from their latest log, preserving today's selection", () => {
    const days = ["Empuje", "Piernas", "Tirón"].map((name, dayIndex) => ({
      id: String(dayIndex),
      name,
      dayIndex,
    }));
    const logs = [
      {
        workoutId: "routine",
        workoutDayId: "1",
        startedAt: new Date(2026, 8, 15, 12).toISOString(),
      },
    ] as WorkoutLog[];
    expect(suggestedWorkoutDay(days, logs, "routine", "2026-09-15")).toBe(1);
    expect(suggestedWorkoutDay(days, logs, "routine", "2026-09-16")).toBe(2);
    expect(suggestedWorkoutDay(days, logs, "other", "2026-09-16")).toBe(0);
  });
});
