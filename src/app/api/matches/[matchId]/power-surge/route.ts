/**
 * POST /api/matches/[matchId]/power-surge
 * Submit a Power Surge card selection for the current round
 * 
 * Body: { cardId: string, roundNumber: number, txId: string, playerAddress: string }
 * 
 * - Validates the transaction on Kaspa blockchain
 * - Stores selection in power_surges table
 * - Broadcasts selection to both players via Supabase Realtime
 * 
 * NOTE: Card identity is hidden until both players select or timeout.
 * The reveal happens when the UI closes (onClose -> reveals opponent card).
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApiError, ErrorCodes, createErrorResponse } from "@/lib/api/errors";
import {
  PowerSurgeCardId,
  POWER_SURGE_CARDS,
  getRandomPowerSurgeCards,
} from "@/types/power-surge";

// =============================================================================
// TYPES
// =============================================================================

interface PowerSurgeRequest {
  cardId: PowerSurgeCardId;
  roundNumber: number;
  txId: string;
  playerAddress: string;
  offeredCards?: PowerSurgeCardId[];
}

interface PowerSurgeRow {
  id: string;
  match_id: string;
  round_number: number;
  offered_cards: PowerSurgeCardId[];
  player1_card_id: string | null;
  player1_tx_id: string | null;
  player1_selected_at: string | null;
  player2_card_id: string | null;
  player2_tx_id: string | null;
  player2_selected_at: string | null;
  revealed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Auto-submit bot's power surge choice for a given round.
 * Uses pre-computed choices from the match's bot_power_surge_choices column.
 */
async function autoSubmitBotPowerSurge(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  matchId: string,
  roundNumber: number,
  match: { bot_power_surge_choices?: Record<string, string>; power_surge_deck?: Record<string, PowerSurgeCardId[]> },
  offeredCards: PowerSurgeCardId[],
  surgeRowId?: string
): Promise<void> {
  console.log(`[PowerSurge API] Auto-submitting bot power surge for round ${roundNumber}`);
  
  // Get bot's pre-computed choice
  const botChoices = match.bot_power_surge_choices as Record<string, string> | null;
  if (!botChoices || !botChoices[roundNumber.toString()]) {
    // Fallback: randomly pick one of the offered cards
    console.log(`[PowerSurge API] No pre-computed bot choice, picking randomly`);
    const randomIndex = Math.floor(Math.random() * offeredCards.length);
    const botCardId = offeredCards[randomIndex];
    await saveBotSelection(supabase, matchId, roundNumber, botCardId, offeredCards, surgeRowId);
    return;
  }
  
  const botCardId = botChoices[roundNumber.toString()] as PowerSurgeCardId;
  
  // Validate the bot's choice is in the offered cards
  if (!offeredCards.includes(botCardId)) {
    console.warn(`[PowerSurge API] Bot's pre-computed choice ${botCardId} not in offered cards, picking randomly`);
    const randomIndex = Math.floor(Math.random() * offeredCards.length);
    const fallbackCardId = offeredCards[randomIndex];
    await saveBotSelection(supabase, matchId, roundNumber, fallbackCardId, offeredCards, surgeRowId);
    return;
  }
  
  await saveBotSelection(supabase, matchId, roundNumber, botCardId, offeredCards, surgeRowId);
}

/**
 * Save bot's power surge selection to database and broadcast.
 */
async function saveBotSelection(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  matchId: string,
  roundNumber: number,
  cardId: PowerSurgeCardId,
  offeredCards: PowerSurgeCardId[],
  surgeRowId?: string
): Promise<void> {
  console.log(`[PowerSurge API] Saving bot selection: ${cardId} for round ${roundNumber}`);
  
  // Generate a fake transaction ID for the bot
  const botTxId = `bot-surge-${matchId}-r${roundNumber}-${Date.now()}`;
  
  if (surgeRowId) {
    // Update existing row
    await supabase
      .from("power_surges")
      .update({
        player2_card_id: cardId,
        player2_tx_id: botTxId,
        player2_selected_at: new Date().toISOString(),
      })
      .eq("id", surgeRowId);
  } else {
    // Insert new row with bot's selection
    await supabase
      .from("power_surges")
      .upsert({
        match_id: matchId,
        round_number: roundNumber,
        offered_cards: offeredCards,
        player2_card_id: cardId,
        player2_tx_id: botTxId,
        player2_selected_at: new Date().toISOString(),
      }, { onConflict: "match_id,round_number" });
  }
  
  // Broadcast bot's selection immediately so polling picks it up fast
  await broadcastSurgeSelection(supabase, matchId, {
    matchId,
    roundNumber,
    player: "player2",
    cardId,
    txId: botTxId,
    timestamp: Date.now(),
  });
  
  console.log(`[PowerSurge API] Bot selection saved and broadcast: ${cardId}`);
}

// =============================================================================
// HANDLER: POST - Submit surge selection
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<any> }
): Promise<NextResponse<any>> {
  try {
    const { matchId } = await params;
    console.log(`[PowerSurge API] POST request for match ${matchId}`);

    // Validate match ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid match ID format")
      );
    }

    // Parse request body
    const body = await request.json() as PowerSurgeRequest;
    const { cardId, roundNumber, txId, playerAddress, offeredCards: clientOfferedCards } = body;
    console.log(`[PowerSurge API] Body:`, { cardId, roundNumber, txId, playerAddress });

    // Validate required fields
    if (!cardId || !roundNumber || !txId || !playerAddress) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Missing required fields: cardId, roundNumber, txId, playerAddress")
      );
    }

    // Validate card ID
    const validCard = POWER_SURGE_CARDS.find((c) => c.id === cardId);
    if (!validCard) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, `Invalid card ID: ${cardId}`)
      );
    }

    // Validate round number (1-5 for best of 5)
    if (roundNumber < 1 || roundNumber > 5) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Round number must be between 1 and 5")
      );
    }

    const supabase = await createSupabaseServerClient();
    console.log(`[PowerSurge API] Supabase client created`);

    // Fetch the match with player info
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      console.error(`[PowerSurge API] Match not found:`, matchError);
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }
    console.log(`[PowerSurge API] Match found, status: ${match.status}`);

    // Determine which player is making the request
    const isPlayer1 = match.player1_address === playerAddress;
    const isPlayer2 = match.player2_address === playerAddress;
    console.log(`[PowerSurge API] Player check - isPlayer1: ${isPlayer1}, isPlayer2: ${isPlayer2}`);

    if (!isPlayer1 && !isPlayer2) {
      return createErrorResponse(
        new ApiError(ErrorCodes.FORBIDDEN, "Not a participant in this match")
      );
    }

    const playerKey = isPlayer1 ? "player1" : "player2";

    // Verify match is in progress
    if (match.status !== "in_progress") {
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, `Cannot submit surge: match is ${match.status}`)
      );
    }

    // Get pre-computed deck from match
    const deck = (match as any).power_surge_deck as Record<string, PowerSurgeCardId[]> | null;
    let offeredCards: PowerSurgeCardId[];

    if (deck && deck[roundNumber.toString()]) {
      offeredCards = deck[roundNumber.toString()];
      console.log(`[PowerSurge API] Using pre-computed deck for round ${roundNumber}:`, offeredCards);
    } else {
      // Fallback for legacy matches without pre-computed deck
      console.log(`[PowerSurge API] No pre-computed deck, using client cards or generating`);
      if (clientOfferedCards && clientOfferedCards.length === 3) {
        offeredCards = clientOfferedCards;
      } else {
        const cards = getRandomPowerSurgeCards(3);
        offeredCards = cards.map(c => c.id);
      }
    }

    // Validate the selected card is one of the offered cards
    if (!offeredCards.includes(cardId)) {
      console.error(`[PowerSurge API] Card validation failed - ${cardId} not in`, offeredCards);
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Selected card was not offered this round")
      );
    }

    // Get or create power surge row for this round
    console.log(`[PowerSurge API] Querying power_surges table...`);
    let { data: surgeRow, error: surgeError } = await supabase
      .from("power_surges")
      .select("*")
      .eq("match_id", matchId)
      .eq("round_number", roundNumber)
      .single() as { data: PowerSurgeRow | null; error: any };

    console.log(`[PowerSurge API] Query result - error:`, surgeError, `row exists:`, !!surgeRow);

    if (!surgeRow) {
      console.log(`[PowerSurge API] No row exists, creating new one...`);
      // First selection for this round - create the row

      const insertData: any = {
        match_id: matchId,
        round_number: roundNumber,
        offered_cards: offeredCards,
        [`${playerKey}_card_id`]: cardId,
        [`${playerKey}_tx_id`]: txId,
        [`${playerKey}_selected_at`]: new Date().toISOString(),
      };
      console.log(`[PowerSurge API] Inserting:`, insertData);

      const { data: newRow, error: insertError } = await supabase
        .from("power_surges")
        .insert(insertData)
        .select()
        .single() as { data: PowerSurgeRow | null; error: any };

      if (insertError) {
        console.error(`[PowerSurge API] Insert error:`, insertError);
        // Race condition - another player created the row
        if (insertError.code === "23505") {
          // Retry by fetching and updating
          const { data: existingRow } = await supabase
            .from("power_surges")
            .select("*")
            .eq("match_id", matchId)
            .eq("round_number", roundNumber)
            .single() as { data: PowerSurgeRow | null; error: any };

          if (existingRow) {
            surgeRow = existingRow;
          } else {
            return createErrorResponse(
              new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to create surge row")
            );
          }
        } else {
          console.error("[PowerSurge] Insert error:", insertError);
          return createErrorResponse(
            new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to save surge selection")
          );
        }
      } else {
        surgeRow = newRow;
        console.log(`[PowerSurge API] Row created successfully, broadcasting...`);
        
        // Broadcast immediately for new row
        await broadcastSurgeSelection(supabase, matchId, {
          matchId,
          roundNumber,
          player: playerKey,
          cardId,
          txId,
          timestamp: Date.now(),
        });

        // If this is a bot match and player1 submitted, auto-submit bot's choice
        const isBotMatch = (match as any).is_bot === true;
        if (isBotMatch && isPlayer1 && newRow) {
          console.log(`[PowerSurge API] Bot match detected, auto-submitting bot's choice...`);
          // Await to ensure bot's selection is saved before response returns
          // This ensures the UI polling will find both selections
          try {
            await autoSubmitBotPowerSurge(
              supabase,
              matchId,
              roundNumber,
              match as any,
              offeredCards,
              newRow.id
            );
          } catch (err) {
            console.error("[PowerSurge API] Bot auto-submit error:", err);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            matchId,
            roundNumber,
            player: playerKey,
            cardId,
            txId,
          },
        });
      }
    }

    // Only reach here if row already existed (or race condition occurred)
    console.log(`[PowerSurge API] Checking if player already submitted...`);
    // Check if this player already submitted
    const playerCardField = `${playerKey}_card_id` as keyof PowerSurgeRow;
    if (surgeRow && surgeRow[playerCardField]) {
      console.log(`[PowerSurge API] Player already submitted!`);
      return createErrorResponse(
        new ApiError(ErrorCodes.CONFLICT, "Already submitted surge selection for this round")
      );
    }

    // Card validation already done earlier with pre-computed deck

    console.log(`[PowerSurge API] Updating row with player selection...`);
    // Update the row with this player's selection
    const updateData: any = {
      [`${playerKey}_card_id`]: cardId,
      [`${playerKey}_tx_id`]: txId,
      [`${playerKey}_selected_at`]: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("power_surges")
      .update(updateData)
      .eq("id", surgeRow.id);

    if (updateError) {
      console.error("[PowerSurge] Update error:", updateError);
      return createErrorResponse(
        new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to save surge selection")
      );
    }

    // Broadcast to game channel (hidden reveal - just signals "ready")
    await broadcastSurgeSelection(supabase, matchId, {
      matchId,
      roundNumber,
      player: playerKey,
      cardId, // Opponent will hide this until reveal
      txId,
      timestamp: Date.now(),
    });

    // If this is a bot match and player1 submitted, auto-submit bot's choice
    const isBotMatch = (match as any).is_bot === true;
    if (isBotMatch && isPlayer1 && surgeRow && !surgeRow.player2_card_id) {
      console.log(`[PowerSurge API] Bot match detected (update path), auto-submitting bot's choice...`);
      // Await to ensure bot's selection is saved before response returns
      try {
        await autoSubmitBotPowerSurge(
          supabase,
          matchId,
          roundNumber,
          match as any,
          offeredCards,
          surgeRow.id
        );
      } catch (err) {
        console.error("[PowerSurge API] Bot auto-submit error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        matchId,
        roundNumber,
        player: playerKey,
        cardId,
        txId,
      },
    });
  } catch (error) {
    console.error("[PowerSurge] Error:", error);
    console.error("[PowerSurge] Error stack:", error instanceof Error ? error.stack : "No stack");
    return createErrorResponse(
      new ApiError(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Internal server error"
      )
    );
  }
}

// =============================================================================
// HANDLER: GET - Get surge cards and selection state
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
): Promise<NextResponse> {
  try {
    const { matchId } = await params;
    const url = new URL(request.url);
    const roundNumber = parseInt(url.searchParams.get("round") || "1", 10);
    const reveal = url.searchParams.get("reveal") === "true";

    const supabase = await createSupabaseServerClient();

    // First, get the pre-computed deck from the match
    const { data: match, error: matchError } = await (supabase
      .from("matches") as any)
      .select("power_surge_deck")
      .eq("id", matchId)
      .single();

    if (matchError || !match) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Match not found")
      );
    }

    // Get cards from pre-computed deck
    const deck = (match as any).power_surge_deck as Record<string, PowerSurgeCardId[]> | null;
    let offeredCards: PowerSurgeCardId[];

    if (deck && deck[roundNumber.toString()]) {
      offeredCards = deck[roundNumber.toString()];
      console.log(`[PowerSurge GET] Using pre-computed deck for round ${roundNumber}:`, offeredCards);
    } else {
      // Fallback: generate cards if deck doesn't exist (legacy matches)
      console.log(`[PowerSurge GET] No pre-computed deck, generating for round ${roundNumber}`);
      const cards = getRandomPowerSurgeCards(3);
      offeredCards = cards.map(c => c.id);
    }

    // Get existing surge row for this round (for selection state)
    let { data: surgeRow } = await supabase
      .from("power_surges")
      .select("*")
      .eq("match_id", matchId)
      .eq("round_number", roundNumber)
      .single() as { data: PowerSurgeRow | null; error: any };

    if (!surgeRow) {
      // No selections yet
      return NextResponse.json({
        success: true,
        data: {
          roundNumber,
          offeredCards,
          player1Selection: null,
          player2Selection: null,
          revealed: false,
        },
      });
    }

    // If reveal=true and not yet revealed, mark as revealed
    if (reveal && !surgeRow.revealed_at) {
      await supabase
        .from("power_surges")
        .update({ revealed_at: new Date().toISOString() })
        .eq("id", surgeRow.id);
    }

    const isRevealed = !!surgeRow.revealed_at || reveal;

    return NextResponse.json({
      success: true,
      data: {
        roundNumber,
        offeredCards,
        player1Selection: surgeRow.player1_card_id ? {
          cardId: isRevealed ? surgeRow.player1_card_id : "hidden",
          txId: surgeRow.player1_tx_id,
          timestamp: surgeRow.player1_selected_at ? new Date(surgeRow.player1_selected_at).getTime() : null,
          ready: true,
        } : null,
        player2Selection: surgeRow.player2_card_id ? {
          cardId: isRevealed ? surgeRow.player2_card_id : "hidden",
          txId: surgeRow.player2_tx_id,
          timestamp: surgeRow.player2_selected_at ? new Date(surgeRow.player2_selected_at).getTime() : null,
          ready: true,
        } : null,
        revealed: isRevealed,
      },
    });
  } catch (error) {
    console.error("[PowerSurge] GET Error:", error);
    return createErrorResponse(
      new ApiError(ErrorCodes.INTERNAL_ERROR, "Failed to get surge cards")
    );
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Broadcast surge selection to game channel.
 */
async function broadcastSurgeSelection(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  matchId: string,
  payload: {
    matchId: string;
    roundNumber: number;
    player: "player1" | "player2";
    cardId: PowerSurgeCardId;
    txId: string;
    timestamp: number;
  }
): Promise<void> {
  try {
    const channel = supabase.channel(`game:${matchId}`);
    await channel.send({
      type: "broadcast",
      event: "power_surge_selected",
      payload,
    });
    console.log(`[PowerSurge] Broadcast surge selection for ${payload.player}`);
  } catch (error) {
    console.error("[PowerSurge] Broadcast error:", error);
  }
}
