import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import type { Env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { createAIRouter } from "./routes/ai";
import { createBodyMetricsRouter } from "./routes/bodyMetrics";
import { createDashboardRouter } from "./routes/dashboard";
import { createExercisesRouter } from "./routes/exercises";
import { createHealthRouter } from "./routes/health";
import { createFoodsRouter } from "./routes/foods";
import { createMealsRouter } from "./routes/meals";
import { createProfilesRouter } from "./routes/profiles";
import { createWorkoutLogsRouter } from "./routes/workoutLogs";
import { createWorkoutsRouter } from "./routes/workouts";
import { AIComparisonService } from "./services/ai/AIComparisonService";
import { createAIProvider } from "./services/ai/providerFactory";
import { ChatContextService } from "./services/chatContextService";
import { DashboardService } from "./services/dashboardService";
import { DataService } from "./services/dataService";
import { AIFoodEstimateProvider } from "./services/food/AIFoodEstimateProvider";
import { FoodSearchService } from "./services/food/FoodSearchService";
import { LocalFoodProvider } from "./services/food/LocalFoodProvider";
import { OpenFoodFactsProvider } from "./services/food/OpenFoodFactsProvider";
import { USDAFoodProvider } from "./services/food/USDAFoodProvider";
import { OwnershipService } from "./services/ownership";
import { SupabaseService } from "./services/supabase";

export function createApp(env: Env) {
  const app = express();
  const supabase = new SupabaseService(env);
  const data = new DataService(supabase.admin);
  const ownership = new OwnershipService(data);
  const aiProvider = createAIProvider(env);
  const chatContext = new ChatContextService(data);
  const dashboard = new DashboardService(data);
  const aiArena = new AIComparisonService(env.AI_ARENA_ENABLED);
  const foodSearch = new FoodSearchService([
    new LocalFoodProvider(),
    new OpenFoodFactsProvider({
      baseUrl: env.OPEN_FOOD_FACTS_BASE_URL,
      userAgent: env.OPEN_FOOD_FACTS_USER_AGENT,
    }),
    new USDAFoodProvider({ apiKey: env.USDA_API_KEY }),
    new AIFoodEstimateProvider(aiProvider),
  ]);

  // Render (y la mayoria de PaaS) ponen la app detras de un proxy: confiar en
  // el primer salto permite detectar la IP real (logs + rate limit).
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(createHealthRouter());

  const privateRouter = express.Router();
  privateRouter.use(requireAuth(supabase));
  privateRouter.use(createProfilesRouter(data, ownership));
  privateRouter.use(createExercisesRouter(data));
  privateRouter.use(createFoodsRouter(foodSearch));
  privateRouter.use(createWorkoutsRouter(data, ownership));
  privateRouter.use(createWorkoutLogsRouter(data, ownership));
  privateRouter.use(createMealsRouter(data, ownership));
  privateRouter.use(createBodyMetricsRouter(data, ownership));
  privateRouter.use(createDashboardRouter(dashboard, ownership));
  privateRouter.use(
    createAIRouter({
      data,
      ownership,
      aiProvider,
      chatContext,
      aiArena,
    }),
  );

  app.use(privateRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
