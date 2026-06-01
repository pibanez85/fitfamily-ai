import {
  CreateWorkoutLogSchema,
  UpdateWorkoutLogSchema,
  profileIdParamSchema,
  workoutLogIdParamSchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import type { DataService, Row } from "../services/dataService";
import type { OwnershipService } from "../services/ownership";
import { getParam, requireUserId } from "../utils/http";

const workoutLogSelect = "*, workouts(name), workout_days(name), workout_log_sets(*, exercises(*))";

export function createWorkoutLogsRouter(data: DataService, ownership: OwnershipService) {
  const router = Router();

  router.get(
    "/profiles/:profileId/workout-logs",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const logs = await data.listBy("workout_logs", "profile_id", profileId, {
          select: workoutLogSelect,
          order: "started_at",
        });
        res.json({ data: logs });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/workout-logs",
    validateParams(profileIdParamSchema),
    validateBody(CreateWorkoutLogSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const { sets, ...logInput } = req.body;
        const log = await data.insert("workout_logs", {
          ...logInput,
          profileId,
        });
        await data.bulkInsert(
          "workout_log_sets",
          (sets as Row[]).map((set) => ({ ...set, workoutLogId: log.id })) as Row[],
        );
        const created = await data.getById("workout_logs", String(log.id), workoutLogSelect);
        res.status(201).json({ data: created });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/workout-logs/:workoutLogId",
    validateParams(workoutLogIdParamSchema),
    async (req, res, next) => {
      try {
        const workoutLogId = getParam(req, "workoutLogId");
        await ownership.assertResourceProfile(
          "workout_logs",
          workoutLogId,
          requireUserId(req),
        );
        const log = await data.getById("workout_logs", workoutLogId, workoutLogSelect);
        res.json({ data: log });
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    "/workout-logs/:workoutLogId",
    validateParams(workoutLogIdParamSchema),
    validateBody(UpdateWorkoutLogSchema),
    async (req, res, next) => {
      try {
        const workoutLogId = getParam(req, "workoutLogId");
        await ownership.assertResourceProfile(
          "workout_logs",
          workoutLogId,
          requireUserId(req),
        );
        const { sets: _sets, ...logInput } = req.body;
        const log = await data.update("workout_logs", workoutLogId, logInput);
        res.json({ data: log });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
