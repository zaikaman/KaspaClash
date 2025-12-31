/**
 * API Error Handler
 * Centralized error handling for API routes
 */

import { NextResponse } from "next/server";

/**
 * API error codes.
 */
export const ErrorCodes = {
  // General errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_ADDRESS: "INVALID_ADDRESS",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",
  INVALID_MOVE: "INVALID_MOVE",
  
  // Match errors
  MATCH_NOT_FOUND: "MATCH_NOT_FOUND",
  MATCH_FULL: "MATCH_FULL",
  MATCH_ALREADY_STARTED: "MATCH_ALREADY_STARTED",
  MATCH_NOT_STARTED: "MATCH_NOT_STARTED",
  MATCH_COMPLETED: "MATCH_COMPLETED",
  
  // Player errors
  PLAYER_NOT_FOUND: "PLAYER_NOT_FOUND",
  PLAYER_NOT_IN_MATCH: "PLAYER_NOT_IN_MATCH",
  PLAYER_ALREADY_IN_QUEUE: "PLAYER_ALREADY_IN_QUEUE",
  
  // Round errors
  ROUND_NOT_ACTIVE: "ROUND_NOT_ACTIVE",
  MOVE_ALREADY_SUBMITTED: "MOVE_ALREADY_SUBMITTED",
  MOVE_TIMEOUT: "MOVE_TIMEOUT",
  
  // Blockchain errors
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  WALLET_NOT_CONNECTED: "WALLET_NOT_CONNECTED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * API error response structure.
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Custom API error class.
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert error to response object.
   */
  toResponse(): ApiErrorResponse {
    const response: ApiErrorResponse = {
      error: {
        code: this.code,
        message: this.message,
      },
    };
    if (this.details) {
      response.error.details = this.details;
    }
    return response;
  }
}

/**
 * Create a NextResponse from an ApiError.
 */
export function createErrorResponse(error: ApiError): NextResponse<ApiErrorResponse> {
  return NextResponse.json(error.toResponse(), { status: error.statusCode });
}

/**
 * Handle unknown errors and convert to ApiError.
 */
export function handleError(error: unknown): ApiError {
  // Already an ApiError
  if (error instanceof ApiError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    console.error("Unhandled error:", error);
    return new ApiError(
      ErrorCodes.INTERNAL_ERROR,
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred",
      500
    );
  }

  // Unknown error type
  console.error("Unknown error:", error);
  return new ApiError(
    ErrorCodes.INTERNAL_ERROR,
    "An unexpected error occurred",
    500
  );
}

/**
 * Factory functions for common errors.
 */
export const Errors = {
  badRequest: (message: string, details?: unknown) =>
    new ApiError(ErrorCodes.BAD_REQUEST, message, 400, details),

  unauthorized: (message = "Unauthorized") =>
    new ApiError(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = "Forbidden") =>
    new ApiError(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource = "Resource") =>
    new ApiError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  conflict: (message: string) =>
    new ApiError(ErrorCodes.CONFLICT, message, 409),

  rateLimited: (message = "Too many requests") =>
    new ApiError(ErrorCodes.RATE_LIMITED, message, 429),

  validation: (message: string, details?: unknown) =>
    new ApiError(ErrorCodes.VALIDATION_ERROR, message, 400, details),

  invalidAddress: (address?: string) =>
    new ApiError(
      ErrorCodes.INVALID_ADDRESS,
      address ? `Invalid Kaspa address: ${address}` : "Invalid Kaspa address",
      400
    ),

  invalidSignature: () =>
    new ApiError(ErrorCodes.INVALID_SIGNATURE, "Invalid signature", 401),

  matchNotFound: (matchId?: string) =>
    new ApiError(
      ErrorCodes.MATCH_NOT_FOUND,
      matchId ? `Match ${matchId} not found` : "Match not found",
      404
    ),

  matchFull: () =>
    new ApiError(ErrorCodes.MATCH_FULL, "Match is already full", 409),

  playerNotInMatch: () =>
    new ApiError(
      ErrorCodes.PLAYER_NOT_IN_MATCH,
      "Player is not in this match",
      403
    ),

  moveAlreadySubmitted: () =>
    new ApiError(
      ErrorCodes.MOVE_ALREADY_SUBMITTED,
      "Move already submitted for this round",
      409
    ),

  moveTimeout: () =>
    new ApiError(ErrorCodes.MOVE_TIMEOUT, "Move submission timed out", 408),
};
