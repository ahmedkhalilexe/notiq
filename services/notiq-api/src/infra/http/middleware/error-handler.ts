import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../domain/shared/errors/base-error";

const PG_UNIQUE_VIOLATION = "23505";

/** Errors raised by express.json() / body-parser before a route runs. */
const BODY_PARSER_ERRORS: Record<
  string,
  { status: number; code: string; message: string }
> = {
  "entity.parse.failed": {
    status: 400,
    code: "INVALID_JSON",
    message: "Request body is not valid JSON",
  },
  "entity.too.large": {
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: "Request body is too large",
  },
  "encoding.unsupported": {
    status: 415,
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "Unsupported content encoding",
  },
  "charset.unsupported": {
    status: 415,
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "Unsupported charset",
  },
};

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ status: "error", code, message });
}

export function NotFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    `Route ${req.method} ${req.path} not found`,
  );
}

export function ErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  // The response has already started; let Express close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    console.warn(`[${err.code}] ${err.message}`);
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  const { type, code } = err as { type?: string; code?: string };

  const bodyError = type ? BODY_PARSER_ERRORS[type] : undefined;
  if (bodyError) {
    console.warn(`[${bodyError.code}] ${err.message}`);
    sendError(res, bodyError.status, bodyError.code, bodyError.message);
    return;
  }

  // A unique index caught what the use case's existence check missed, i.e.
  // two concurrent requests creating the same resource.
  if (code === PG_UNIQUE_VIOLATION) {
    console.warn(`[CONFLICT] ${err.message}`);
    sendError(res, 409, "CONFLICT", "Resource already exists");
    return;
  }

  console.error("[UNEXPECTED ERROR]", err);
  sendError(res, 500, "INTERNAL_ERROR", "An unexpected error occurred");
}
