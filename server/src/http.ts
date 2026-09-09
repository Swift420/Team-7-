import type { NextFunction, Request, RequestHandler, Response } from "express";

export interface ErrorResponse {
  success: false;
  error: { code: string; message: string; details?: string[] };
}

/** Express 4 does not await rejected async handlers; this adapter forwards them to one error boundary. */
export const asyncHandler =
  (
    handler: (req: Request, res: Response, next: NextFunction) => unknown,
  ): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export function sendSuccess<T>(res: Response, data: T, status = 200): Response {
  return res.status(status).json({ success: true, data });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: string[],
): Response<ErrorResponse> {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details?.length ? { details } : {}) },
  });
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = "HttpError";
  }
}
