import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isAppError } from "../utils/AppError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next({
    statusCode: 404,
    code: "ROUTE_NOT_FOUND",
    message: `Route ${req.method} ${req.path} was not found.`,
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload.",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  const fallback = error as { statusCode?: number; code?: string; message?: string };
  const statusCode = fallback.statusCode ?? 500;
  const code = fallback.code ?? "INTERNAL_SERVER_ERROR";
  const message = statusCode >= 500 ? "Unexpected server error." : fallback.message;

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
