import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      values.delete(key);
    }),
  };
});
vi.mock("./localStorage", () => ({ deviceStorage: storage }));
vi.mock("../config/env", () => ({ isDemoMode: true }));

beforeEach(() => {
  storage.values.clear();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("demo persistence through a full week", () => {
  it("keeps meals, sets, exercise IDs and profile separation across seven cold starts", async () => {
    let { demoApi } = await import("./demoData");
    const profile = await demoApi.profiles.create({ displayName: "Semana de prueba" });
    const other = await demoApi.profiles.create({ displayName: "Otro familiar" });
    const exercise = (await demoApi.workouts.exercises())[0]!;
    const workout = await demoApi.workouts.create(profile.id, {
      name: "Prueba semanal",
      days: [
        {
          name: "Sesión",
          dayIndex: 0,
          exercises: [{ exerciseId: exercise.id, orderIndex: 0, targetSets: 1, targetReps: "8" }],
        },
      ],
    });
    for (let day = 10; day <= 16; day++) {
      const timestamp = `2026-09-${day}T15:00:00.000Z`;
      await demoApi.meals.create(profile.id, {
        mealType: "other",
        name: `Comida ${day}`,
        eatenAt: timestamp,
        calories: day * 10,
        items: [{ name: "Yogur", calories: day * 10, proteinG: 12.5 }],
      });
      await demoApi.workouts.createLog(profile.id, {
        workoutId: workout.id,
        startedAt: timestamp,
        sets: [{ exerciseId: exercise.id, setIndex: 1, reps: 8, weight: 20 + day }],
      });
      vi.resetModules();
      ({ demoApi } = await import("./demoData"));
      expect(await demoApi.meals.list(profile.id)).toHaveLength(day - 9);
      expect(await demoApi.workouts.logs(profile.id)).toHaveLength(day - 9);
      expect((await demoApi.workouts.exercises())[0]!.id).toBe(exercise.id);
      expect(await demoApi.meals.list(other.id)).toEqual([]);
    }
    const meals = await demoApi.meals.list(profile.id);
    expect(meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0)).toBe(910);
    expect(meals[0]).toMatchObject({ mealItems: [{ name: "Yogur", proteinG: 12.5 }] });
    const copiedId = meals[0]!.id;
    await demoApi.meals.delete(copiedId);
    vi.resetModules();
    ({ demoApi } = await import("./demoData"));
    expect(await demoApi.meals.list(profile.id)).toHaveLength(6);
    expect(await demoApi.workouts.logs(profile.id)).toHaveLength(7);
  });

  it("reports failed writes and rolls back memory instead of pretending to save", async () => {
    const { demoApi } = await import("./demoData");
    const profiles = await demoApi.profiles.list();
    storage.setItem.mockRejectedValueOnce(new Error("Disk full"));
    await expect(demoApi.profiles.create({ displayName: "No guardado" })).rejects.toThrow(
      "El cambio no se aplicó",
    );
    expect(await demoApi.profiles.list()).toEqual(profiles);
  });

  it("does not overwrite a corrupt local snapshot with new example data", async () => {
    const { demoApi, DEMO_DATA_STORAGE_KEY } = await import("./demoData");
    storage.values.set(DEMO_DATA_STORAGE_KEY, "corrupt snapshot");
    await expect(demoApi.profiles.list()).rejects.toThrow();
    expect(storage.values.get(DEMO_DATA_STORAGE_KEY)).toBe("corrupt snapshot");
  });

  it("restores and clears only the simulated session, without storing access tokens", async () => {
    let { createDemoAuth, DEMO_SESSION_STORAGE_KEY } = await import("./demoSession");
    const auth = createDemoAuth();
    await auth.signInWithPassword({ email: "demo@example.test", password: "demo-only" });
    const saved = storage.values.get(DEMO_SESSION_STORAGE_KEY)!;
    expect(saved).not.toContain("access_token");
    expect(saved).not.toContain("password");
    vi.resetModules();
    ({ createDemoAuth, DEMO_SESSION_STORAGE_KEY } = await import("./demoSession"));
    const restored = createDemoAuth();
    expect((await restored.getUser()).data.user?.email).toBe("demo@example.test");
    await restored.signOut();
    expect((await createDemoAuth().getSession()).data.session).toBeNull();
  });
});
