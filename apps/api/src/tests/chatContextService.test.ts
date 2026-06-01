import { describe, expect, it } from "vitest";
import { formatChatContext } from "../services/chatContextService";

describe("formatChatContext", () => {
  it("includes profile, meals, training count and latest weight without inventing data", () => {
    const context = formatChatContext({
      profile: {
        displayName: "Familia",
        goal: "Ganar fuerza",
        activityLevel: "moderate",
      },
      workoutsLast30Days: 3,
      mealsLast30Days: [
        {
          meal_type: "lunch",
          name: "Pollo con arroz",
          calories: 650,
          protein_g: 45,
          eaten_at: "2026-05-20T12:00:00.000Z",
        },
      ],
      latestMetric: {
        weight_kg: 75,
        measured_at: "2026-05-21T08:00:00.000Z",
      },
      preferences: {
        dietary: { likes: ["alto en proteina"] },
        training: { days: 4 },
      },
    });

    expect(context).toContain("Ganar fuerza");
    expect(context).toContain("Entrenamientos registrados ultimos 30 dias: 3");
    expect(context).toContain("Pollo con arroz");
    expect(context).toContain("75 kg");
  });

  it("states when nutrition and body data are missing", () => {
    const context = formatChatContext({
      profile: null,
      workoutsLast30Days: 0,
      mealsLast30Days: [],
      latestMetric: null,
    });

    expect(context).toContain("Sin comidas registradas.");
    expect(context).toContain("Sin peso registrado.");
  });
});
