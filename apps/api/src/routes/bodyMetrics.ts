import { CreateBodyMetricSchema, profileIdParamSchema } from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateBody, validateParams } from "../middleware/validate";
import type { DataService } from "../services/dataService";
import type { OwnershipService } from "../services/ownership";
import { getParam, requireUserId } from "../utils/http";

export function createBodyMetricsRouter(data: DataService, ownership: OwnershipService) {
  const router = Router();

  router.get(
    "/profiles/:profileId/body-metrics",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const metrics = await data.listBy("body_metrics", "profile_id", profileId, {
          order: "measured_at",
        });
        res.json({ data: metrics });
      } catch (error) {
        next(error);
      }
    },
  );

  router.post(
    "/profiles/:profileId/body-metrics",
    validateParams(profileIdParamSchema),
    validateBody(CreateBodyMetricSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const metric = await data.insert("body_metrics", {
          ...req.body,
          profileId,
        });
        res.status(201).json({ data: metric });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
