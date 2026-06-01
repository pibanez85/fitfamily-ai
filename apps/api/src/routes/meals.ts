import {
  CreateMealSchema,
  UpdateMealSchema,
  mealIdParamSchema,
  profileIdParamSchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import type { DataService, Row } from "../services/dataService";
import type { OwnershipService } from "../services/ownership";
import { getParam, requireUserId } from "../utils/http";

const mealSelect = "*, meal_items(*)";

export function createMealsRouter(data: DataService, ownership: OwnershipService) {
  const router = Router();

  router.get(
    "/profiles/:profileId/meals",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const meals = await data.listBy("meals", "profile_id", profileId, {
          select: mealSelect,
          order: "eaten_at",
        });
        res.json({ data: meals });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/meals",
    validateParams(profileIdParamSchema),
    validateBody(CreateMealSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const { items, ...mealInput } = req.body;
        const meal = await data.insert("meals", {
          ...mealInput,
          profileId,
        });
        await data.bulkInsert(
          "meal_items",
          (items as Row[]).map((item) => ({ ...item, mealId: meal.id })) as Row[],
        );
        const created = await data.getById("meals", String(meal.id), mealSelect);
        res.status(201).json({ data: created });
      } catch (error) {
        next(error);
      }
    },
  );

  router.get("/meals/:mealId", validateParams(mealIdParamSchema), async (req, res, next) => {
    try {
      const mealId = getParam(req, "mealId");
      await ownership.assertResourceProfile("meals", mealId, requireUserId(req));
      const meal = await data.getById("meals", mealId, mealSelect);
      res.json({ data: meal });
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    "/meals/:mealId",
    validateParams(mealIdParamSchema),
    validateBody(UpdateMealSchema),
    async (req, res, next) => {
      try {
        const mealId = getParam(req, "mealId");
        await ownership.assertResourceProfile("meals", mealId, requireUserId(req));
        const { items: _items, ...mealInput } = req.body;
        const meal = await data.update("meals", mealId, mealInput);
        res.json({ data: meal });
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete("/meals/:mealId", validateParams(mealIdParamSchema), async (req, res, next) => {
    try {
      const mealId = getParam(req, "mealId");
      await ownership.assertResourceProfile("meals", mealId, requireUserId(req));
      await data.remove("meals", mealId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
