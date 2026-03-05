import type { Response } from "express";
import type { ErrorCode } from "./apiErrors.js";

/**
 * Standard success response
 */
export function successResponse<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    success: true,
    data,
  });
}

/**
 * Standard error response
 */
export function errorResponse(
  res: Response,
  code: ErrorCode,
  message: string,
  status = 400
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}
