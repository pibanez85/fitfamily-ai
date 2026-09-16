import { afterAll, describe, expect, it } from "vitest";
import type { BodyMetric, Meal } from "@fitfamily-ai/shared";
import { buildProgressData } from "./progressData";
import { localNoonIso } from "./localDate";
import type { WorkoutLogDetail } from "./workoutAnalytics";

const oldTimezone = process.env.TZ;
process.env.TZ = "America/Santiago";
afterAll(() => {
  if (oldTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = oldTimezone;
});

const meal = (eatenAt: string, calories: number) => ({ eatenAt, calories, proteinG: 20 }) as Meal;
const metric = (date: string, weightKg: number) =>
  ({ measuredAt: localNoonIso(date), weightKg }) as BodyMetric;
const log = (date: string, id = date): WorkoutLogDetail =>
  ({
    id,
    profileId: "test-profile",
    startedAt: localNoonIso(date),
    workoutLogSets: [{ exerciseId: "press", setIndex: 1, weight: 20.5, reps: 8 }],
  }) as WorkoutLogDetail;

describe("weekly progress uses the selected calendar period", () => {
  it("includes the whole first local day and excludes previous and future dates", () => {
    const data = buildProgressData(
      [log("2026-09-09"), log("2026-09-10"), log("2026-09-16"), log("2026-09-17")],
      [
        meal("2026-09-10T00:10:00-03:00", 200),
        meal("2026-09-16T23:45:00-03:00", 400),
        meal(localNoonIso("2026-09-09"), 9000),
        meal(localNoonIso("2026-09-17"), 9000),
      ],
      [],
      "7d",
      "2026-09-16",
    );
    expect(data.sessions).toBe(2);
    expect(data.sessionsPrev).toBe(1);
    expect(data.avgCalories).toBe(300);
    expect(data.nutritionWeek.map((day) => day.calories)).toEqual([200, 0, 0, 0, 0, 0, 400]);
  });

  it("can show older weight history without claiming that change happened this week", () => {
    const data = buildProgressData(
      [],
      [],
      [metric("2026-08-18", 79.9), metric("2026-09-15", 78.4)],
      "7d",
      "2026-09-16",
    );
    expect(data.weightPoints).toHaveLength(2);
    expect(data.latestWeight).toBe(78.4);
    expect(data.weightDelta).toBeNull();
  });

  it("calculates weight change only between measurements in the selected period", () => {
    const data = buildProgressData(
      [],
      [],
      [
        metric("2026-08-18", 90),
        metric("2026-09-10", 79),
        metric("2026-09-15", 78.4),
        metric("2026-09-17", 100),
      ],
      "7d",
      "2026-09-16",
    );
    expect(data.weightDelta).toBe(-0.6);
    expect(data.latestWeight).toBe(78.4);
  });

  it("does not report an improvement from zero for an exercise logged only once", () => {
    const data = buildProgressData([log("2026-09-16")], [], [], "7d", "2026-09-16");
    expect(data.personalRecords[0]?.kg).toBe(20.5);
    expect(data.personalRecords[0]?.deltaKg).toBe(0);
    expect(data.volumeBars[0]?.value).toBe(164);
  });
});
