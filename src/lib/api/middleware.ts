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
 * Allowed CORS origins

 */
const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://kaspaclash.vercel.app",
  // Add staging/preview URLs if needed
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

/**
 * Get CORS headers based on request origin

 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => {
    // Exact match or wildcard subdomain match
    if (allowed === origin) return true;
    // Support Vercel preview URLs
    if (origin.endsWith(".vercel.app") && process.env.VERCEL) return true;
    return false;
  });

  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature, X-Wallet-Address, X-Timestamp",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Legacy CORS headers (deprecated - use getCorsHeaders instead)
 * @deprecated Use getCorsHeaders(origin) instead for origin-restricted CORS
 */
export const corsHeaders = getCorsHeaders(null);

/**
 * Add CORS headers to response.
 */
export function withCors<T>(response: NextResponse<T>, origin?: string | null): NextResponse<T> {
  const headers = getCorsHeaders(origin ?? null);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle OPTIONS request for CORS preflight.
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
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
 * This is now properly implemented using kaspa-wasm SDK.
 * 
 * @deprecated Use verifyWalletSignature from auth-middleware instead for new code
 */
export async function verifySignature(
  address: string,
  message: string,
  signature: string,
  publicKey?: string
): Promise<boolean> {
  // Import and use the proper signature verification from auth-middleware
  const { verifyWalletSignature } = await import("./auth-middleware");
  return verifyWalletSignature(address, message, signature, publicKey);
}

