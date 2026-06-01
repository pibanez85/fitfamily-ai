import {
  CreateProfileSchema,
  UpdateProfileSchema,
  profileIdParamSchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import type { DataService } from "../services/dataService";
import type { OwnershipService } from "../services/ownership";
import { toCamel } from "../utils/case";
import { getParam, requireUserId } from "../utils/http";

export function createProfilesRouter(data: DataService, ownership: OwnershipService) {
  const router = Router();

  router.get("/profiles", async (req, res, next) => {
    try {
      const userId = requireUserId(req);
      const profiles = await data.listBy("profiles", "user_id", userId, { order: "created_at" });
      res.json({ data: profiles });
    } catch (error) {
      next(error);
    }
  });

  router.post("/profiles", validateBody(CreateProfileSchema), async (req, res, next) => {
    try {
      const profile = await data.insert("profiles", {
        ...req.body,
        userId: requireUserId(req),
      });
      res.status(201).json({ data: profile });
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/profiles/:profileId",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        const profile = await ownership.assertProfile(profileId, requireUserId(req));
        res.json({ data: toCamel(profile) });
      } catch (error) {
        next(error);
      }
    },
  );

  router.patch(
    "/profiles/:profileId",
    validateParams(profileIdParamSchema),
    validateBody(UpdateProfileSchema),
    async (req, res, next) => {
      try {
        const userId = requireUserId(req);
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, userId);
        const profile = await data.update("profiles", profileId, req.body);
        res.json({ data: profile });
      } catch (error) {
        next(error);
      }
    },
  );

  router.delete(
    "/profiles/:profileId",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        await data.remove("profiles", profileId);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
