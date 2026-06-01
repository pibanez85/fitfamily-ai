import type { NextFunction, Request, Response } from "express";
import type { SupabaseService } from "../services/supabase";
import { AppError } from "../utils/AppError";

function extractBearerToken(header: string | undefined): string {
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Missing bearer token.");
  }

  return header.slice("Bearer ".length).trim();
}

export function requireAuth(supabase: SupabaseService) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      req.user = await supabase.getUserFromToken(token);
      req.authToken = token;
      next();
    } catch (error) {
      next(error);
    }
  };
}
