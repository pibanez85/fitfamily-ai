import type { Env } from "../../config/env";
import { MockProvider } from "./MockProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import type { AIProvider } from "./types";

export function createAIProvider(env: Env): AIProvider {
  if (env.AI_PROVIDER === "openai") {
    return new OpenAIProvider(env.OPENAI_API_KEY, env.AI_MODEL_TEXT, env.AI_MODEL_VISION);
  }

  return new MockProvider();
}
