import {
  BarcodeParamSchema,
  FoodSearchQuerySchema,
} from "@fitfamily-ai/shared";
import { Router } from "express";
import { validateParams, validateQuery } from "../middleware/validate";
import type { FoodSearchService } from "../services/food/FoodSearchService";
import { AppError } from "../utils/AppError";
import { getParam } from "../utils/http";

export function createFoodsRouter(foodSearch: FoodSearchService) {
  const router = Router();

  router.get("/foods/search", validateQuery(FoodSearchQuerySchema), async (req, res, next) => {
    try {
      const parsed = req.query as unknown as { query: string; limit: number; includeExternal: boolean };
      const query = parsed.query;
      const limit = parsed.limit;
      const includeExternal = parsed.includeExternal;
      const results = await foodSearch.search(query, { limit, includeExternal });
      res.json({ data: results });
    } catch (error) {
      next(error);
    }
  });

  router.get("/foods/barcode/:barcode", validateParams(BarcodeParamSchema), async (req, res, next) => {
    try {
      const barcode = getParam(req, "barcode");
      const food = await foodSearch.byBarcode(barcode);
      if (!food) throw new AppError(404, "FOOD_NOT_FOUND", "No encontramos ese producto por codigo de barra.");
      res.json({ data: food });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
