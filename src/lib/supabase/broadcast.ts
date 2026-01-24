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
async function broadcastToChannelOnce(
  supabase: SupabaseClient,
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { ack: false, self: false },
    },
  });
  
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;
    
    const cleanup = async () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        await supabase.removeChannel(channel);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
    
    // Subscribe first
    channel.subscribe(async (status) => {
      if (isResolved) return;
      
      if (status === "SUBSCRIBED") {
        try {
          // Now send the broadcast
          await channel.send({
            type: "broadcast",
            event,
            payload,
          });
          console.log(`[Broadcast] Sent ${event} to ${channelName}`);
          
          isResolved = true;
          await cleanup();
          resolve();
        } catch (error) {
          console.error(`[Broadcast] Error sending ${event}:`, error);
          isResolved = true;
          await cleanup();
          reject(error);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[Broadcast] Channel error for ${channelName}: ${status}`);
        isResolved = true;
        await cleanup();
        reject(new Error(`Channel subscription failed: ${status}`));
      }
    });
    
    // Timeout fallback - increased to 10 seconds
    timeoutId = setTimeout(async () => {
      if (isResolved) return;
      console.error(`[Broadcast] Timeout subscribing to ${channelName}`);
      isResolved = true;
      await cleanup();
      reject(new Error("Channel subscription timeout"));
    }, 10000);
  });
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
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { ack: false, self: false },
    },
  });
  
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;
    
    const cleanup = async () => {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        await supabase.removeChannel(channel);
      } catch (e) {
        // Ignore cleanup errors
      }
    };
    
    // Subscribe first
    channel.subscribe(async (status) => {
      if (isResolved) return;
      
      if (status === "SUBSCRIBED") {
        try {
          // Send all messages
          for (const { event, payload } of messages) {
            await channel.send({
              type: "broadcast",
              event,
              payload,
            });
            console.log(`[Broadcast] Sent ${event} to ${channelName}`);
          }
          
          isResolved = true;
          await cleanup();
          resolve();
        } catch (error) {
          console.error(`[Broadcast] Error sending messages:`, error);
          isResolved = true;
          await cleanup();
          reject(error);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[Broadcast] Channel error for ${channelName}: ${status}`);
        isResolved = true;
        await cleanup();
        reject(new Error(`Channel subscription failed: ${status}`));
      }
    });
    
    // Timeout fallback - increased to 10 seconds
    timeoutId = setTimeout(async () => {
      if (isResolved) return;
      console.error(`[Broadcast] Timeout subscribing to ${channelName}`);
      isResolved = true;
      await cleanup();
      reject(new Error("Channel subscription timeout"));
    }, 10000);
  });
}
