import {
  CreateExerciseSchema,
  enrichExerciseRecord,
  sortExercisesByEvidence,
  exerciseIdParamSchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import type { DataService } from "../services/dataService";
import { getParam } from "../utils/http";

export function createExercisesRouter(data: DataService) {
  const router = Router();

  router.get("/exercises", async (_req, res, next) => {
    try {
      const exercises = await data.list("exercises", { order: "name" });
      res.json({ data: sortExercisesByEvidence(exercises as Array<{ id: string; name: string }>) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/exercises", validateBody(CreateExerciseSchema), async (req, res, next) => {
    try {
      const exercise = await data.insert("exercises", req.body);
      res.status(201).json({ data: exercise });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/exercises/:exerciseId",
    validateParams(exerciseIdParamSchema),
    async (req, res, next) => {
      try {
        const exercise = await data.getById("exercises", getParam(req, "exerciseId"));
        res.json({ data: enrichExerciseRecord(exercise as { id: string; name: string }) });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
