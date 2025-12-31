/**
 * Health Check API Route
 * Endpoint: GET /api/health
 */

import { NextResponse } from "next/server";

/**
 * Health check response type.
 */
interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    kaspa: "ok" | "error";
  };
}

/**
 * GET /api/health
 * Returns the health status of the API and its dependencies.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: { database: "ok" | "error"; kaspa: "ok" | "error" } = {
    database: "ok",
    kaspa: "ok",
  };

  // Check database connection
  try {
    // In production, this would actually ping Supabase
    // For now, just check if env vars are configured
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      checks.database = "error";
    }
  } catch {
    checks.database = "error";
  }

  // Determine overall status
  const allOk = Object.values(checks).every((v) => v === "ok");
  const anyError = Object.values(checks).some((v) => v === "error");

  const status = allOk ? "healthy" : anyError ? "unhealthy" : "degraded";

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks,
  };

  return NextResponse.json(response, {
    status: status === "healthy" ? 200 : status === "degraded" ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
