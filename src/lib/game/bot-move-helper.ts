/**
 * Bot Move Helper
 * Reusable function to submit bot moves
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CombatEngine } from "@/game/combat";

export async function submitBotMoveForMatch(
    matchId: string,
    roundId: string,
    botPlayer: "player1" | "player2"
): Promise<void> {
    const supabase = await createSupabaseServerClient();

    // Fetch match
    const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

    if (!match) {
        throw new Error("Match not found");
    }

    // Fetch round
    const { data: round } = await supabase
        .from("rounds")
        .select("*")
        .eq("id", roundId)
        .single();

    if (!round) {
        throw new Error("Round not found");
    }

    const botAddress = botPlayer === "player1" ? match.player1_address : match.player2_address;
    
    if (!botAddress) {
        throw new Error("Bot address not found");
    }

    // Create combat engine to get current state
    const engine = new CombatEngine(
        match.player1_character_id || "dag-warrior",
        match.player2_character_id || "dag-warrior",
        match.format as "best_of_1" | "best_of_3" | "best_of_5"
    );

    // Replay all previous rounds to get current state
    const { data: previousRounds } = await supabase
        .from("rounds")
        .select("*")
        .eq("match_id", matchId)
        .lt("round_number", round.round_number)
        .order("round_number", { ascending: true });

    if (previousRounds) {
        for (const prevRound of previousRounds) {
            if (prevRound.player1_move && prevRound.player2_move) {
                engine.resolveTurn(prevRound.player1_move as any, prevRound.player2_move as any);
            }
        }
    }

    const engineState = engine.getState();

    // Get bot's smart move
    const { SmartBotOpponent } = await import("@/lib/game/smart-bot-opponent");

    // Get bot name from player profile
    const { data: botProfile } = await supabase
        .from("players")
        .select("display_name")
        .eq("address", botAddress)
        .single();
    const botName = botProfile?.display_name || "Bot Opponent";
    const bot = new SmartBotOpponent(botName);

    // Update bot context
    const humanPlayer = botPlayer === "player1" ? "player2" : "player1";
    bot.updateContext({
        botHealth: engineState[botPlayer].hp,
        botMaxHealth: engineState[botPlayer].maxHp,
        botEnergy: engineState[botPlayer].energy,
        botMaxEnergy: engineState[botPlayer].maxEnergy,
        botGuardMeter: engineState[botPlayer].guardMeter,
        botIsStunned: engineState[botPlayer].isStunned || false,
        botIsStaggered: engineState[botPlayer].isStaggered || false,
        opponentHealth: engineState[humanPlayer].hp,
        opponentMaxHealth: engineState[humanPlayer].maxHp,
        opponentEnergy: engineState[humanPlayer].energy,
        opponentMaxEnergy: engineState[humanPlayer].maxEnergy,
        opponentGuardMeter: engineState[humanPlayer].guardMeter,
        opponentIsStunned: engineState[humanPlayer].isStunned || false,
        opponentIsStaggered: engineState[humanPlayer].isStaggered || false,
        roundNumber: engineState.currentRound,
        turnNumber: engineState.currentTurn,
        botRoundsWon: engineState[botPlayer].roundsWon,
        opponentRoundsWon: engineState[humanPlayer].roundsWon,
    });

    const decision = bot.decide();
    const botMove = decision.move;

    console.log(`[BotMoveHelper] Bot chose move: ${botMove} (${decision.reasoning})`);

    // Submit bot's move
    const botTxId = `bot_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`.padEnd(64, '0').substring(0, 64);
    const botMoveColumn = botPlayer === "player1" ? "player1_move" : "player2_move";

    // Insert move record
    await supabase.from("moves").insert({
        round_id: roundId,
        player_address: botAddress as string,
        move_type: botMove,
        tx_id: botTxId,
    });

    // Update round with bot move
    await supabase.from("rounds").update({
        [botMoveColumn]: botMove,
    }).eq("id", roundId);

    // Broadcast bot move
    const botGameChannel = supabase.channel(`game:${matchId}`);
    await botGameChannel.send({
        type: "broadcast",
        event: "move_submitted",
        payload: {
            player: botPlayer,
            txId: botTxId,
            submittedAt: Date.now(),
        },
    });
    await supabase.removeChannel(botGameChannel);

    console.log(`[BotMoveHelper] Bot move submitted and saved`);

    // Trigger combat resolution
    const { resolveRound } = await import("@/lib/game/combat-resolver");
    console.log(`[BotMoveHelper] Triggering combat resolution`);
    await resolveRound(matchId, roundId);
}
