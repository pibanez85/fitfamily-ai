import {
  CreateWorkoutSchema,
  UpdateWorkoutSchema,
  profileIdParamSchema,
  workoutIdParamSchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import type { DataService, Row } from "../services/dataService";
import type { OwnershipService } from "../services/ownership";
import { getParam, requireUserId } from "../utils/http";

const workoutSelect = "*, workout_days(*, workout_day_exercises(*, exercises(*)))";

export function createWorkoutsRouter(data: DataService, ownership: OwnershipService) {
  const router = Router();

  router.get(
    "/profiles/:profileId/workouts",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const workouts = await data.listBy("workouts", "profile_id", profileId, {
          order: "created_at",
        });
        res.json({ data: workouts });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/workouts",
    validateParams(profileIdParamSchema),
    validateBody(CreateWorkoutSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const { days, ...workoutInput } = req.body;
        const workout = await data.insert("workouts", {
          ...workoutInput,
          profileId,
        });

        for (const day of days as Array<Row & { exercises: Row[] }>) {
          const { exercises, ...dayInput } = day;
          const workoutDay = await data.insert("workout_days", {
            ...dayInput,
            workoutId: workout.id,
          });
          const dayExercises = exercises.map((exercise: Row) => ({
            ...exercise,
            workoutDayId: workoutDay.id,
          }));
          await data.bulkInsert("workout_day_exercises", dayExercises as Row[]);
        }

        const created = await data.getById("workouts", String(workout.id), workoutSelect);
        res.status(201).json({ data: created });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get(
    "/workouts/:workoutId",
    validateParams(workoutIdParamSchema),
    async (req, res, next) => {
      try {
        const workoutId = getParam(req, "workoutId");
        await ownership.assertResourceProfile("workouts", workoutId, requireUserId(req));
        const workout = await data.getById("workouts", workoutId, workoutSelect);
        res.json({ data: workout });
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    "/workouts/:workoutId",
    validateParams(workoutIdParamSchema),
    validateBody(UpdateWorkoutSchema),
    async (req, res, next) => {
      try {
        const workoutId = getParam(req, "workoutId");
        await ownership.assertResourceProfile("workouts", workoutId, requireUserId(req));
        const { days: _days, ...workoutInput } = req.body;
        const workout = await data.update("workouts", workoutId, workoutInput);
        res.json({ data: workout });
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    "/workouts/:workoutId",
    validateParams(workoutIdParamSchema),
    async (req, res, next) => {
      try {
        const workoutId = getParam(req, "workoutId");
        await ownership.assertResourceProfile("workouts", workoutId, requireUserId(req));
        await data.remove("workouts", workoutId);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
