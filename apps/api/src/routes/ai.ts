import {
  AIChatRequestSchema,
  AnalyzePhotoRequestSchema,
  GenerateWorkoutRequestSchema,
  profileIdParamSchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { aiRateLimiter } from "../middleware/rateLimit";
import { validateBody, validateParams } from "../middleware/validate";
import type { AIComparisonService } from "../services/ai/AIComparisonService";
import type { AIProvider } from "../services/ai/types";
import type { ChatContextService } from "../services/chatContextService";
import type { DataService } from "../services/dataService";
import type { OwnershipService } from "../services/ownership";
import { AppError } from "../utils/AppError";
import { getParam, requireUserId } from "../utils/http";

export function createAIRouter(input: {
  data: DataService;
  ownership: OwnershipService;
  aiProvider: AIProvider;
  chatContext: ChatContextService;
  aiArena: AIComparisonService;
}) {
  const router = Router();

  // Todas las rutas de IA comparten el limite de tasa (protegen el gasto OpenAI).
  router.use("/profiles/:profileId/ai", aiRateLimiter);

  router.post(
    "/profiles/:profileId/ai/analyze-food-photo",
    validateParams(profileIdParamSchema),
    validateBody(AnalyzePhotoRequestSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await input.ownership.assertProfile(profileId, requireUserId(req));
        const result = await input.aiProvider.analyzeFoodPhoto({
          profileId,
          imageUrl: req.body.imageUrl,
          notes: req.body.notes,
        });

        await input.aiArena.compareFoodPhoto(
          {
            profileId,
            imageUrl: req.body.imageUrl,
            notes: req.body.notes,
          },
          [input.aiProvider],
        );

        const analysis = await input.data.insert("food_photo_analyses", {
          profileId,
          imageUrl: req.body.imageUrl,
          estimatedMealName: result.data.estimatedMealName,
          detectedItems: result.data.items,
          estimatedTotals: result.data.totals,
          confidence: result.data.confidence,
          aiProvider: result.provider,
          aiModel: result.model,
          rawResponse: result.rawResponse ?? null,
        });

        res.status(201).json({
          analysisId: analysis.id,
          ...result.data,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/ai/analyze-gym-machine-photo",
    validateParams(profileIdParamSchema),
    validateBody(AnalyzePhotoRequestSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await input.ownership.assertProfile(profileId, requireUserId(req));
        const result = await input.aiProvider.analyzeGymMachinePhoto({
          profileId,
          imageUrl: req.body.imageUrl,
          notes: req.body.notes,
        });

        const analysis = await input.data.insert("gym_machine_photo_analyses", {
          profileId,
          imageUrl: req.body.imageUrl,
          machineName: result.data.machineName,
          possibleExercises: result.data.possibleExercises,
          primaryMuscles: result.data.primaryMuscles,
          secondaryMuscles: result.data.secondaryMuscles,
          instructions: result.data.instructions,
          commonMistakes: result.data.commonMistakes,
          safetyRecommendations: result.data.safetyRecommendations,
          avoidIf: result.data.avoidIf,
          difficulty: result.data.difficulty,
          confidence: result.data.confidence,
          aiProvider: result.provider,
          aiModel: result.model,
          rawResponse: result.rawResponse ?? null,
        });

        res.status(201).json({
          analysisId: analysis.id,
          ...result.data,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/ai/generate-workout",
    validateParams(profileIdParamSchema),
    validateBody(GenerateWorkoutRequestSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await input.ownership.assertProfile(profileId, requireUserId(req));
        const result = await input.aiProvider.generateWorkout({
          profileId,
          goal: req.body.goal,
          frequency: req.body.frequency,
          experienceLevel: req.body.experienceLevel,
          durationLabel: req.body.durationLabel ?? undefined,
          instructions: req.body.instructions ?? undefined,
          catalog: req.body.catalog,
        });
        res.json(result.data);
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/ai/chat",
    validateParams(profileIdParamSchema),
    validateBody(AIChatRequestSchema),
    async (req, res, next) => {
      try {
        const userId = requireUserId(req);
        const profileId = getParam(req, "profileId");
        await input.ownership.assertProfile(profileId, userId);

        const threadId = req.body.threadId
          ? await ensureThreadForProfile(input, req.body.threadId, profileId, userId)
          : await createThread(input.data, profileId, req.body.message);

        await input.data.insert("ai_chat_messages", {
          threadId,
          role: "user",
          content: req.body.message,
          metadata: null,
        });

        const context = await input.chatContext.build(profileId);
        const result = await input.aiProvider.chat({
          profileId,
          threadId,
          message: req.body.message,
          context,
        });

        await input.data.insert("ai_chat_messages", {
          threadId,
          role: "assistant",
          content: result.data.content,
          metadata: {
            provider: result.provider,
            model: result.model,
            latencyMs: result.latencyMs,
          },
        });

        res.json({
          threadId,
          message: {
            role: "assistant",
            content: result.data.content,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

async function ensureThreadForProfile(
  input: { ownership: OwnershipService },
  threadId: string,
  profileId: string,
  userId: string,
): Promise<string> {
  const thread = await input.ownership.assertChatThread(threadId, userId);
  if (thread.profile_id !== profileId) {
    throw new AppError(404, "CHAT_THREAD_NOT_FOUND", "Chat thread was not found for this profile.");
  }

  return threadId;
}

async function createThread(data: DataService, profileId: string, message: string): Promise<string> {
  const thread = await data.insert("ai_chat_threads", {
    profileId,
    title: message.slice(0, 80),
  });

  return String(thread.id);
}
