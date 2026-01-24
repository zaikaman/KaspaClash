/**
 * Supabase Server Client
 * Client for server-side Supabase operations (API routes)
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Create a Supabase client for server-side operations.
 * Should be called in API routes and Server Components.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
    global: {
      fetch: (url, options = {}) => {
        // Increase connection timeout to 60 seconds for slow network conditions
        // This prevents "Connect Timeout Error" when API responses are delayed
        return fetch(url, {
          ...options,
          connectTimeout: 60_000, // 60 seconds (undici-specific)
          headersTimeout: 60_000, // 60 seconds (undici-specific)
        } as RequestInit);
      },
    },
  });
}

/**
 * Create a Supabase admin client with service role.
 * Use only for server-side operations that need elevated permissions.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase admin environment variables. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  // Dynamic import to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js") as {
    createClient: typeof import("@supabase/supabase-js").createClient;
  };

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (url, options = {}) => {
        // Increase connection timeout to 60 seconds for slow network conditions
        return fetch(url, {
          ...options,
          connectTimeout: 60_000, // 60 seconds (undici-specific)
          headersTimeout: 60_000, // 60 seconds (undici-specific)
        } as RequestInit);
      },
    },
  });
}
