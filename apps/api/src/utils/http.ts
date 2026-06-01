import type { Request } from "express";
import { AppError } from "./AppError";

export function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError(401, "UNAUTHORIZED", "Authenticated user is missing.");
  }

  return req.user.id;
}

export function getParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new AppError(400, "INVALID_ROUTE_PARAM", `Missing route parameter: ${name}.`);
  }

  return value;
}
