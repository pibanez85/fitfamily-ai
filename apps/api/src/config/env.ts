import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  AI_MODEL_TEXT: z.string().min(1).default("gpt-5.4-mini"),
  AI_MODEL_VISION: z.string().min(1).default("gpt-5.4-mini"),
  OPEN_FOOD_FACTS_BASE_URL: z.url().default("https://world.openfoodfacts.org"),
  OPEN_FOOD_FACTS_USER_AGENT: z
    .string()
    .min(1)
    .default("FitFamilyAI/0.1 (development; contact: local)"),
  USDA_API_KEY: z.string().min(1).optional(),
  AI_ARENA_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
