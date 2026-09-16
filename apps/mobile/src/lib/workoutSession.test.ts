import { describe, expect, it } from "vitest";
import {
  completedSessionSets,
  emptyRestClock,
  parseSessionEffort,
  remainingRestSeconds,
  validateCompletedSet,
  workoutDraftKey,
  validStoredSet,
  type WorkoutSetDraft,
} from "./workoutSession";

const set = (patch: Partial<WorkoutSetDraft> = {}): WorkoutSetDraft => ({
  reps: "10",
  weight: "20",
  rpe: "",
  restSeconds: "90",
  notes: "",
  done: false,
  ...patch,
});
const exercise = (sets: WorkoutSetDraft[]) => ({
  exerciseId: "exercise-1",
  exerciseName: "Press",
  exerciseNote: "",
  sets,
});

describe("honest workout session logging", () => {
  it("never saves prefilled or edited sets until explicitly completed", () => {
    expect(completedSessionSets([exercise([set(), set({ reps: "12", weight: "30" })])])).toEqual(
      [],
    );
  });
  it("saves only checked sets, preserving their original series position and comma decimals", () => {
    const result = completedSessionSets([
      exercise([set(), set({ done: true, weight: "22,5", rpe: "7,5" })]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ setIndex: 2, weight: 22.5, rpe: 7.5, reps: 10 });
  });
  it("rejects completed sets with empty or invalid actual values instead of silently saving null", () => {
    for (const patch of [
      { reps: "" },
      { reps: "10-12" },
      { reps: "2.5" },
      { weight: "-2" },
      { weight: "NaN" },
      { rpe: "11" },
      { restSeconds: "1.5" },
    ]) {
      expect(() => completedSessionSets([exercise([set({ ...patch, done: true })])])).toThrow();
    }
  });
  it("allows bodyweight sets without a weight and zero added load", () => {
    expect(validateCompletedSet(set({ weight: "" }))).toBeNull();
    expect(completedSessionSets([exercise([set({ done: true, weight: "0" })])])[0]!.weight).toBe(0);
  });
  it("validates optional session effort", () => {
    expect(parseSessionEffort("")).toBeNull();
    expect(parseSessionEffort("8")).toBe(8);
    for (const effort of ["0", "11", "7.5", "mucho"])
      expect(() => parseSessionEffort(effort)).toThrow();
  });
  it("isolates seven daily sessions and family member draft namespaces", () => {
    const sessions = Array.from({ length: 7 }, (_, day) =>
      completedSessionSets([exercise([set({ done: day % 2 === 0, reps: String(8 + day) })])]),
    );
    expect(sessions.map((sets) => sets.length)).toEqual([1, 0, 1, 0, 1, 0, 1]);
    expect(workoutDraftKey("parent", "plan", "monday")).not.toBe(
      workoutDraftKey("child", "plan", "monday"),
    );
    expect(workoutDraftKey("parent", "plan", "monday")).not.toBe(
      workoutDraftKey("parent", "plan", "tuesday"),
    );
  });
  it("rejects corrupted stored sets", () => {
    expect(validStoredSet(set())).toBe(true);
    expect(validStoredSet({ ...set(), done: "true" })).toBe(false);
    expect(validStoredSet({ ...set(), weight: 12 })).toBe(false);
  });
});

describe("wall clock rest timer", () => {
  it("catches up after background suspension instead of losing elapsed time", () => {
    const clock = { ...emptyRestClock, deadline: 100_000 + 90_000 };
    expect(remainingRestSeconds(clock, 100_000)).toBe(90);
    expect(remainingRestSeconds(clock, 160_000)).toBe(30);
    expect(remainingRestSeconds(clock, 220_000)).toBe(0);
  });
  it("keeps paused remaining time across reload and never returns negative time", () => {
    expect(remainingRestSeconds({ ...emptyRestClock, pausedSeconds: 24 }, 999_999)).toBe(24);
    expect(remainingRestSeconds(emptyRestClock)).toBe(0);
  });
});
