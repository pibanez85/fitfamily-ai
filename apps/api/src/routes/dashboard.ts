import { profileIdParamSchema } from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateParams } from "../middleware/validate";
import type { DashboardService } from "../services/dashboardService";
import type { OwnershipService } from "../services/ownership";
import { getParam, requireUserId } from "../utils/http";

export function createDashboardRouter(
  dashboard: DashboardService,
  ownership: OwnershipService,
) {
  const router = Router();

  router.get(
    "/profiles/:profileId/dashboard",
    validateParams(profileIdParamSchema),
    async (req, res, next) => {
      try {
        const profileId = getParam(req, "profileId");
        await ownership.assertProfile(profileId, requireUserId(req));
        const data = await dashboard.build(profileId);
        res.json({ data });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
