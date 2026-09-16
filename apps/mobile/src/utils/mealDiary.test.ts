import { afterAll, describe, expect, it } from "vitest";
import {
  addLocalDays,
  datesEndingAt,
  localDateKey,
  localNoonIso,
  millisecondsUntilNextDay,
  parseLocalDate,
  resolveSelectedDate,
} from "./localDate";
import { copyMealToDate, mealTypes, mealsOnDate, sumMeals, type DiaryMeal } from "./mealDiary";

const originalTimezone = process.env.TZ;
process.env.TZ = "America/Santiago";
afterAll(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

function meal(
  profileId: string,
  date: string,
  type: DiaryMeal["mealType"],
  calories: number,
  serial = 0,
): DiaryMeal {
  return {
    id: `${profileId}-${date}-${type}-${serial}`,
    profileId,
    name: `${type} familiar`,
    mealType: type,
    eatenAt: localNoonIso(date),
    calories,
    proteinG: calories / 10,
    carbsG: 20,
    fatG: 8,
    fiberG: 3,
    createdAt: localNoonIso(date),
    updatedAt: localNoonIso(date),
    mealItems: [
      {
        name: "Yogur natural",
        estimatedPortion: "1 pote",
        calories,
        proteinG: calories / 10,
        carbsG: 20,
        fatG: 8,
        fiberG: 3,
      },
    ],
  };
}

describe("diario familiar durante siete días", () => {
  it("starts each local day empty, preserves previous days, and keeps family profiles separate", () => {
    const dates = datesEndingAt("2026-09-09"); // Includes Santiago's spring DST transition.
    let records: DiaryMeal[] = [];
    dates.forEach((date, index) => {
      const today = localDateKey(new Date(`${date}T08:00:00`));
      const selected = resolveSelectedDate(null, today);
      expect(selected).toBe(date);
      expect(mealsOnDate(records, selected, "pablo")).toEqual([]);
      records.push(meal("pablo", date, "breakfast", 300 + index));
      records.push(meal("pablo", date, "dinner", 600 + index));
      records.push(meal("familia", date, "lunch", 450));
      expect(sumMeals(mealsOnDate(records, selected, "pablo")).calories).toBe(900 + index * 2);
      expect(sumMeals(mealsOnDate(records, selected, "familia")).calories).toBe(450);
      if (index) expect(mealsOnDate(records, dates[index - 1]!, "pablo")).toHaveLength(2);
      // Simulate a cold launch using persisted data rather than retaining object identities.
      records = JSON.parse(JSON.stringify(records)) as DiaryMeal[];
      expect(mealsOnDate(records, selected, "pablo")).toHaveLength(2);
    });
    expect(records).toHaveLength(21);
    expect(sumMeals(records.filter((record) => record.profileId === "pablo")).calories).toBe(6342);
    expect(mealsOnDate(records, "2026-09-10", "pablo")).toEqual([]);
    expect(records[0]?.mealItems?.[0]?.name).toBe("Yogur natural");
  });

  it("rolls 'today' forward while an explicitly selected historical date remains fixed", () => {
    expect(resolveSelectedDate(null, "2026-09-14")).toBe("2026-09-14");
    expect(resolveSelectedDate(null, "2026-09-15")).toBe("2026-09-15");
    expect(resolveSelectedDate("2026-09-11", "2026-09-15")).toBe("2026-09-11");
    const beforeMidnight = new Date(2026, 8, 14, 23, 59, 59, 900);
    expect(millisecondsUntilNextDay(beforeMidnight)).toBe(200);
  });

  it("assigns a late Chilean dinner to its local day rather than the UTC date", () => {
    const lateDinner = {
      ...meal("pablo", "2026-09-14", "dinner", 600),
      eatenAt: "2026-09-15T02:45:00.000Z",
    };
    expect(localDateKey(lateDinner.eatenAt)).toBe("2026-09-14");
    expect(mealsOnDate([lateDinner], "2026-09-14", "pablo")).toHaveLength(1);
    expect(mealsOnDate([lateDinner], "2026-09-15", "pablo")).toHaveLength(0);
  });

  it("keeps photo/manual 'other' entries in the same daily diary and totals", () => {
    const records = [
      meal("pablo", "2026-09-14", "other", 175),
      meal("pablo", "2026-09-14", "lunch", 500),
    ];
    const entries = mealsOnDate(records, "2026-09-14", "pablo");
    const buckets = mealTypes.flatMap((type) => entries.filter((entry) => entry.mealType === type));
    expect(buckets).toHaveLength(2);
    expect(sumMeals(buckets).calories).toBe(675);
  });

  it("copies the selected meal to the selected day without moving or altering history", () => {
    const previous = meal("pablo", "2026-09-10", "breakfast", 320);
    const copied = copyMealToDate(previous, "2026-09-14");
    expect(localDateKey(copied.eatenAt)).toBe("2026-09-14");
    expect(localDateKey(previous.eatenAt)).toBe("2026-09-10");
    expect(copied.calories).toBe(previous.calories);
    expect(copied.items).toEqual(previous.mealItems);
    expect(copied.items).not.toBe(previous.mealItems);
    expect(copied).not.toHaveProperty("id");
    expect(copied).not.toHaveProperty("profileId");
  });
});

describe("local calendar boundaries", () => {
  it("crosses month/year and daylight-saving changes using calendar days", () => {
    expect(addLocalDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addLocalDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(datesEndingAt("2026-09-09")).toEqual([
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
    ]);
    expect(parseLocalDate("2026-09-06").getTime() - parseLocalDate("2026-09-05").getTime()).toBe(
      23 * 60 * 60 * 1000,
    );
    for (const date of datesEndingAt("2026-09-09"))
      expect(localDateKey(localNoonIso(date))).toBe(date);
  });
  it("rejects invalid form dates rather than silently changing their calendar day", () => {
    expect(() => parseLocalDate("2026-02-30")).toThrow("fecha válida");
    expect(() => parseLocalDate("2026-13-01")).toThrow("fecha válida");
    expect(() => parseLocalDate("not-a-date")).toThrow("fecha válida");
    expect(localDateKey("not-a-date")).toBe("");
    expect(localDateKey("2026-02-30")).toBe("");
    expect(localDateKey("2026-09-14")).toBe("2026-09-14");
  });
});
