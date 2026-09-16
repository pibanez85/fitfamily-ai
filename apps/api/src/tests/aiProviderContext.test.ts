import { beforeEach, describe, expect, it, vi } from "vitest";
const { createResponse } = vi.hoisted(() => ({ createResponse: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    responses = { create: createResponse };
  },
}));
import { OpenAIProvider } from "../services/ai/OpenAIProvider";

const provider = new OpenAIProvider("unit-test-only-not-a-real-key", "test-model", "test-vision");
beforeEach(() => createResponse.mockReset());

describe("OpenAI request context without real API calls", () => {
  it("passes previous conversation instructions in order before the current request", async () => {
    createResponse.mockResolvedValue({ output_text: "Puedes usar mancuernas." });
    await provider.chat({
      profileId: "profile",
      threadId: "thread",
      context: "Perfil",
      message: "Dame otra opción",
      history: [
        { role: "user", content: "Solo tengo mancuernas" },
        { role: "assistant", content: "Entendido" },
      ],
    });
    const request = createResponse.mock.calls[0]![0];
    expect(request.input.map((message: { role: string }) => message.role)).toEqual([
      "system",
      "user",
      "assistant",
      "user",
    ]);
    expect(request.input[1].content).toBe("Solo tengo mancuernas");
    expect(request.input[3].content[0].text).toContain("Dame otra opción");
  });
  it("sends every custom instruction and only the permitted exercise catalog", async () => {
    createResponse.mockResolvedValue({
      output_text: JSON.stringify({
        summary: "Sesión con mancuernas",
        days: [
          {
            name: "Piernas",
            exercises: [
              { exerciseId: "db", targetSets: 3, targetReps: "10", restSeconds: 60, notes: "" },
            ],
          },
        ],
      }),
    });
    const result = await provider.generateWorkout({
      profileId: "profile",
      goal: "Fuerza",
      frequency: 1,
      experienceLevel: "Intermedio",
      instructions: "Prioriza piernas, evita saltos",
      allowedEquipment: ["mancuernas"],
      sessionMinutes: 45,
      catalog: [
        { id: "db", name: "Sentadilla goblet", muscles: ["piernas"], equipment: "mancuernas" },
        { id: "bar", name: "Sentadilla barra", muscles: ["piernas"], equipment: "barra" },
      ],
    });
    const text = createResponse.mock.calls[0]![0].input[1].content[0].text;
    expect(text).toContain("Prioriza piernas, evita saltos");
    expect(text).toContain("45 minutos");
    expect(text).toContain("db | Sentadilla goblet");
    expect(text).not.toContain("bar | Sentadilla barra");
    expect(result.data.workoutDays).toHaveLength(1);
  });
  it("surfaces an incompatible request explanation instead of replacing it with a generic routine", async () => {
    createResponse.mockResolvedValue({
      output_text: JSON.stringify({
        summary: "No hay ejercicios de natación en este catálogo.",
        days: [],
      }),
    });
    await expect(
      provider.generateWorkout({
        profileId: "profile",
        goal: "Natación",
        frequency: 1,
        experienceLevel: "Intermedio",
        catalog: [{ id: "db", name: "Remo", muscles: [], equipment: "mancuernas" }],
      }),
    ).rejects.toThrow("No hay ejercicios de natación");
  });
});
