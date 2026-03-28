import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { sendError } from "../utils/response";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  console.error("[Unhandled Error]", err);
  sendError(res, "Internal server error", 500);
}
