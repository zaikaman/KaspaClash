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

    // Fetch Power Surge cards for all rounds to apply their effects
    const { data: powerSurges } = await supabase
        .from("power_surges")
        .select("*")
        .eq("match_id", matchId);

    // Map surges by round number for quick lookup
    const surgeMap = new Map<number, { player1_card_id: string | null; player2_card_id: string | null }>();
    powerSurges?.forEach((ps: { round_number: number; player1_card_id: string | null; player2_card_id: string | null }) => {
        surgeMap.set(ps.round_number, ps);
    });

    // Replay all previous rounds to get current state (including Power Surge effects)
    const { data: previousRounds } = await supabase
        .from("rounds")
        .select("*")
        .eq("match_id", matchId)
        .lt("round_number", round.round_number)
        .order("round_number", { ascending: true });

    const validMoves = ["punch", "kick", "block", "special"];
    if (previousRounds) {
        for (const prevRound of previousRounds) {
            const p1Move = prevRound.player1_move;
            const p2Move = prevRound.player2_move;
            if (p1Move && p2Move && validMoves.includes(p1Move) && validMoves.includes(p2Move)) {
                const combatRound = engine.getState().currentRound;
                const surge = surgeMap.get(combatRound);

                engine.resolveTurn(
                    p1Move as "punch" | "kick" | "block" | "special",
                    p2Move as "punch" | "kick" | "block" | "special",
                    (surge?.player1_card_id || null) as any,
                    (surge?.player2_card_id || null) as any
                );

                // If a round ended, start new round
                const prevState = engine.getState();
                if (prevState.isRoundOver && !prevState.isMatchOver) {
                    engine.startNewRound();
                }
            }
        }
    }

    const engineState = engine.getState();
    console.log(`[BotMoveHelper] Bot state after replay - Energy: ${engineState[botPlayer].energy}, HP: ${engineState[botPlayer].hp}`);

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
