import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../domain/shared/errors/base-error";

export function ErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    console.warn(`[${err.code}] ${err.message}`);

    res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      message: err.message,
    });
    return;
  }

  console.error("[UNEXPECTED ERROR]", err);

  res.status(500).json({
    status: "error",
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  });
}
