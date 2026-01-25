/**
 * Supabase Realtime Broadcast Helper
 * Helper function to properly send broadcasts from server-side code.
 * 
 * Supabase Realtime requires the channel to be subscribed before sending.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Send a broadcast message on a Supabase Realtime channel.
 * This properly subscribes to the channel before sending.
 * Includes retry logic for reliability.
 */
export async function broadcastToChannel(
  supabase: SupabaseClient,
  channelName: string,
  event: string,
  payload: Record<string, unknown>,
  maxRetries = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Broadcast] Retry ${attempt}/${maxRetries} for ${event} to ${channelName}`);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }

      await broadcastToChannelOnce(supabase, channelName, event, payload);
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.error(`[Broadcast] Attempt ${attempt + 1} failed:`, error);
    }
  }

  // All attempts failed
  throw lastError || new Error("Broadcast failed after all retries");
}

/**
 * Internal function to attempt broadcast once.
 */
/**
 * Internal function to attempt broadcast once.
 * Updated to use httpSend for stateless broadcasting/**
 * Internal function to attempt broadcast once via direct REST API.
 * This completely bypasses the supabase-js realtime library to avoid WS connection timeouts
 * and the "fallback" warning. It makes a stateless HTTP POST request.
 */
async function broadcastToChannelOnce(
  supabase: SupabaseClient,
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase configuration for direct broadcast");
  }

  // Realtime REST API endpoint
  const broadcastUrl = `${supabaseUrl}/realtime/v1/api/broadcast`;

  const body = {
    messages: [
      {
        topic: channelName,
        event: event,
        payload: payload,
        ref: null
      }
    ]
  };

  const response = await fetch(broadcastUrl, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Broadcast failed: ${response.status} ${errorText}`);
  }
}

/**
 * Send multiple broadcast messages on a Supabase Realtime channel.
 * This is more efficient than calling broadcastToChannel multiple times
 * as it only subscribes once.
 * Includes retry logic for reliability.
 */
export async function broadcastMultipleToChannel(
  supabase: SupabaseClient,
  channelName: string,
  messages: Array<{ event: string; payload: Record<string, unknown> }>,
  maxRetries = 2
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Broadcast] Retry ${attempt}/${maxRetries} for multiple events to ${channelName}`);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }

      await broadcastMultipleToChannelOnce(supabase, channelName, messages);
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.error(`[Broadcast] Attempt ${attempt + 1} failed:`, error);
    }
  }

  // All attempts failed
  throw lastError || new Error("Broadcast failed after all retries");
}

/**
 * Internal function to attempt multiple broadcasts once.
 */
async function broadcastMultipleToChannelOnce(
  supabase: SupabaseClient,
  channelName: string,
  messages: Array<{ event: string; payload: Record<string, unknown> }>
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase configuration for direct broadcast");
  }

  const broadcastUrl = `${supabaseUrl}/realtime/v1/api/broadcast`;

  const body = {
    messages: messages.map(msg => ({
      topic: channelName,
      event: msg.event,
      payload: msg.payload,
      ref: null
    }))
  };

  const response = await fetch(broadcastUrl, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Broadcast failed: ${response.status} ${errorText}`);
  }

  console.log(`[Broadcast] Sent ${messages.length} events to ${channelName} (via Direct REST)`);
}
