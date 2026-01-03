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
 */
export async function broadcastToChannel(
  supabase: SupabaseClient,
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const channel = supabase.channel(channelName);
  
  return new Promise((resolve, reject) => {
    // Subscribe first
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          // Now send the broadcast
          await channel.send({
            type: "broadcast",
            event,
            payload,
          });
          console.log(`[Broadcast] Sent ${event} to ${channelName}`);
          
          // Clean up
          await supabase.removeChannel(channel);
          resolve();
        } catch (error) {
          console.error(`[Broadcast] Error sending ${event}:`, error);
          await supabase.removeChannel(channel);
          reject(error);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[Broadcast] Channel error for ${channelName}: ${status}`);
        await supabase.removeChannel(channel);
        reject(new Error(`Channel subscription failed: ${status}`));
      }
    });
    
    // Timeout fallback
    setTimeout(async () => {
      console.error(`[Broadcast] Timeout subscribing to ${channelName}`);
      await supabase.removeChannel(channel);
      reject(new Error("Channel subscription timeout"));
    }, 5000);
  });
}

/**
 * Send multiple broadcast messages on a Supabase Realtime channel.
 * This is more efficient than calling broadcastToChannel multiple times
 * as it only subscribes once.
 */
export async function broadcastMultipleToChannel(
  supabase: SupabaseClient,
  channelName: string,
  messages: Array<{ event: string; payload: Record<string, unknown> }>
): Promise<void> {
  const channel = supabase.channel(channelName);
  
  return new Promise((resolve, reject) => {
    // Subscribe first
    channel.subscribe(async (status) => {
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
          
          // Clean up
          await supabase.removeChannel(channel);
          resolve();
        } catch (error) {
          console.error(`[Broadcast] Error sending messages:`, error);
          await supabase.removeChannel(channel);
          reject(error);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[Broadcast] Channel error for ${channelName}: ${status}`);
        await supabase.removeChannel(channel);
        reject(new Error(`Channel subscription failed: ${status}`));
      }
    });
    
    // Timeout fallback
    setTimeout(async () => {
      console.error(`[Broadcast] Timeout subscribing to ${channelName}`);
      await supabase.removeChannel(channel);
      reject(new Error("Channel subscription timeout"));
    }, 5000);
  });
}
