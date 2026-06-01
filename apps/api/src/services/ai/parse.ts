import type { ZodSchema } from "zod";
import { AppError } from "../../utils/AppError";

export function parseStructuredJson<T>(text: string, schema: ZodSchema<T>): T {
  const trimmed = text.trim();
  const candidates = [trimmed];
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);

  if (objectMatch?.[0] && objectMatch[0] !== trimmed) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return schema.parse(parsed);
    } catch {
      // Try the next candidate before returning a controlled error.
    }
  }

  throw new AppError(502, "AI_INVALID_JSON", "AI provider returned invalid structured JSON.");
}
