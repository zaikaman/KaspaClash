/**
 * API Middleware
 * Common middleware functions for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiError, Errors, createErrorResponse, handleError } from "./errors";

/**
 * Request handler type with typed params.
 */
export type ApiHandler<T = void> = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<T>>;

/**
 * Wrap an API handler with error handling.
 */
export function withErrorHandling<T>(handler: ApiHandler<T>): ApiHandler<T> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const apiError = handleError(error);
      return createErrorResponse(apiError) as NextResponse<T>;
    }
  };
}

/**
 * Rate limiting store (in-memory for simplicity).
 * In production, use Redis or similar.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limiting configuration.
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

/**
 * Default rate limit: 60 requests per minute.
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

/**
 * Get client identifier from request.
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a unique identifier based on available info
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Check rate limit for a client.
 */
function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  if (!record || now > record.resetAt) {
    // New window
    const resetAt = now + config.windowMs;
    rateLimitStore.set(clientId, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Rate limiting middleware.
 */
export function withRateLimit<T>(
  handler: ApiHandler<T>,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): ApiHandler<T> {
  return async (request, context) => {
    const clientId = getClientId(request);
    const { allowed, remaining, resetAt } = checkRateLimit(clientId, config);

    if (!allowed) {
      const response = createErrorResponse(Errors.rateLimited());
      response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set(
        "X-RateLimit-Reset",
        Math.ceil(resetAt / 1000).toString()
      );
      response.headers.set(
        "Retry-After",
        Math.ceil((resetAt - Date.now()) / 1000).toString()
      );
      return response as NextResponse<T>;
    }

    const response = await handler(request, context);
    response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(resetAt / 1000).toString()
    );

    return response;
  };
}

/**
 * Validate JSON body middleware.
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw Errors.badRequest("Invalid JSON body");
  }
}

/**
 * Validate required fields in body.
 */
export function validateRequired<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null
  );

  if (missing.length > 0) {
    throw Errors.validation(`Missing required fields: ${missing.join(", ")}`);
  }
}

/**
 * Validate Kaspa address format.
 */
export function validateKaspaAddress(address: string): void {
  // Kaspa address validation:
  // - Mainnet: starts with 'kaspa:' followed by bech32m encoded data
  // - Testnet: starts with 'kaspatest:' or 'kaspasim:'
  const kaspaAddressRegex = /^(kaspa|kaspatest|kaspasim):[a-z0-9]{40,90}$/;

  if (!kaspaAddressRegex.test(address)) {
    throw Errors.invalidAddress(address);
  }
}

/**
 * CORS headers for API routes.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature",
};

/**
 * Add CORS headers to response.
 */
export function withCors<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle OPTIONS request for CORS preflight.
 */
export function handleCorsPreFlight(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * Compose multiple middleware functions.
 */
export function compose<T>(
  ...middlewares: ((handler: ApiHandler<T>) => ApiHandler<T>)[]
): (handler: ApiHandler<T>) => ApiHandler<T> {
  return (handler) =>
    middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
}

/**
 * Verify a Kaspa wallet signature.
 * In a production environment, this would use the kaspa-wasm SDK
 * to cryptographically verify the signature.
 */
export async function verifySignature(
  _address: string,
  _message: string,
  _signature: string
): Promise<boolean> {
  // TODO: Implement actual signature verification using kaspa-wasm
  // For now, return true for development
  // In production, this should:
  // 1. Load the kaspa-wasm SDK
  // 2. Use PublicKey.fromAddress(address)
  // 3. Verify the signature against the message
  console.warn(
    "verifySignature: Signature verification not implemented. " +
    "Accepting all signatures for development."
  );
  return true;
}
