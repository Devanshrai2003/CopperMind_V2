export const ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED", // Not Logged In || No req.user
  INVALID_SESSION: "INVALID_SESSION", // Invalid/Expired Token
  FORBIDDEN: "FORBIDDEN", // Not Authorized

  BAD_REQUEST: "BAD_REQUEST", //Correct Request Body, But Error in Data
  VALIDATION_ERROR: "VALIDATION_ERROR", // Malformed Request Body
  NOT_FOUND: "NOT_FOUND", // Resource Does Not Exist
  CONFLICT: "CONFLICT", // Valid Request, But Conflict Exists e.g. Duplicate Request

  INTERNAL_ERROR: "INTERNAL_ERROR", // Server Failure, Validation Error etc.
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
