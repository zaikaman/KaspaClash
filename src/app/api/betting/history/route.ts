/**
 * Unified Bet History API
 * GET /api/betting/history?address=<wallet_address>&limit=10&offset=0
 * 
 * Returns combined betting history for both real player matches and bot matches
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface UnifiedBetHistoryItem {
    id: string;
    matchId: string;
    matchType: 'player' | 'bot';
    player1Name: string;
    player2Name: string;
    player1CharacterId: string;
    player2CharacterId: string;
    betOn: 'player1' | 'player2';
    amount: string; // sompi
    feeAmount: string;
    netAmount: string;
    payoutAmount: string | null;
    status: string;
    winner: string | null;
    createdAt: string;
    paidAt: string | null;
    txId: string;
    payoutTxId: string | null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get("address");
        const limitParam = searchParams.get("limit");
        const offsetParam = searchParams.get("offset");

        if (!address) {
            return NextResponse.json(
                { success: false, error: "Address parameter is required" },
                { status: 400 }
            );
        }

        const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 50) : 10;
        const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;

        const supabase = await createSupabaseServerClient();
        const db = supabase as any;

        // Fetch bot bets
        const { data: botBetsData, error: botBetsError } = await db
            .from("bot_bets")
            .select(`
                id,
                bet_on,
                amount,
                fee_paid,
                net_amount,
                payout_amount,
                status,
                created_at,
                paid_at,
                tx_id,
                payout_tx_id,
                pool_id,
                bot_betting_pools!inner (
                    bot_match_id,
                    winner,
                    bot1_character_id,
                    bot2_character_id
                )
            `)
            .eq("bettor_address", address)
            .order("created_at", { ascending: false });

        if (botBetsError) {
            console.error("[UnifiedBetHistory] Error fetching bot bets:", botBetsError);
        }

        // Fetch player bets
        const { data: playerBetsData, error: playerBetsError } = await db
            .from("bets")
            .select(`
                id,
                bet_on,
                amount,
                fee_paid,
                net_amount,
                payout_amount,
                status,
                created_at,
                paid_at,
                tx_id,
                payout_tx_id,
                pool_id,
                betting_pools!inner (
                    match_id,
                    winner
                )
            `)
            .eq("bettor_address", address)
            .order("created_at", { ascending: false });

        if (playerBetsError) {
            console.error("[UnifiedBetHistory] Error fetching player bets:", playerBetsError);
        }

        // Get total counts
        const { count: botCount } = await db
            .from("bot_bets")
            .select("id", { count: "exact", head: true })
            .eq("bettor_address", address);

        const { count: playerCount } = await db
            .from("bets")
            .select("id", { count: "exact", head: true })
            .eq("bettor_address", address);

        const total = (botCount || 0) + (playerCount || 0);

        // Get match details for bot matches
        const botMatchIds = [...new Set((botBetsData || []).map((bet: any) => bet.bot_betting_pools?.bot_match_id).filter(Boolean))];
        const botMatchDetailsMap = new Map<string, any>();
        
        if (botMatchIds.length > 0) {
            const { data: botMatchesData } = await db
                .from("bot_matches")
                .select("id, bot1_name, bot2_name, bot1_character_id, bot2_character_id")
                .in("id", botMatchIds);

            if (botMatchesData) {
                botMatchesData.forEach((match: any) => {
                    botMatchDetailsMap.set(match.id, match);
                });
            }
        }

        // Get match details for player matches
        const playerMatchIds = [...new Set((playerBetsData || []).map((bet: any) => bet.betting_pools?.match_id).filter(Boolean))];
        const playerMatchDetailsMap = new Map<string, any>();
        
        if (playerMatchIds.length > 0) {
            const { data: playerMatchesData } = await db
                .from("matches")
                .select(`
                    id,
                    player1_id,
                    player2_id,
                    player1_character_id,
                    player2_character_id
                `)
                .in("id", playerMatchIds);

            if (playerMatchesData) {
                // Get player names
                const playerIds = [...new Set(playerMatchesData.flatMap((m: any) => [m.player1_id, m.player2_id]).filter(Boolean))];
                const { data: playersData } = await db
                    .from("players")
                    .select("address, username")
                    .in("address", playerIds);

                const playersMap = new Map(playersData?.map((p: any) => [p.address, p.username]) || []);

                playerMatchesData.forEach((match: any) => {
                    playerMatchDetailsMap.set(match.id, {
                        ...match,
                        player1_name: playersMap.get(match.player1_id) || match.player1_id?.slice(0, 8) || 'Unknown',
                        player2_name: playersMap.get(match.player2_id) || match.player2_id?.slice(0, 8) || 'Unknown',
                    });
                });
            }
        }

        // Transform bot bets
        const botHistory: UnifiedBetHistoryItem[] = (botBetsData || []).map((bet: any) => {
            const pool = bet.bot_betting_pools;
            const matchId = pool?.bot_match_id || "";
            const match = botMatchDetailsMap.get(matchId);

            return {
                id: bet.id,
                matchId,
                matchType: 'bot' as const,
                player1Name: match?.bot1_name || "Unknown Bot",
                player2Name: match?.bot2_name || "Unknown Bot",
                player1CharacterId: match?.bot1_character_id || pool?.bot1_character_id || "",
                player2CharacterId: match?.bot2_character_id || pool?.bot2_character_id || "",
                betOn: bet.bet_on === 'bot1' ? 'player1' : 'player2',
                amount: bet.amount?.toString() || "0",
                feeAmount: bet.fee_paid?.toString() || "0",
                netAmount: bet.net_amount?.toString() || "0",
                payoutAmount: bet.payout_amount?.toString() || null,
                status: bet.status,
                winner: pool?.winner === 'bot1' ? 'player1' : pool?.winner === 'bot2' ? 'player2' : null,
                createdAt: bet.created_at,
                paidAt: bet.paid_at,
                txId: bet.tx_id,
                payoutTxId: bet.payout_tx_id,
            };
        });

        // Transform player bets
        const playerHistory: UnifiedBetHistoryItem[] = (playerBetsData || []).map((bet: any) => {
            const pool = bet.betting_pools;
            const matchId = pool?.match_id || "";
            const match = playerMatchDetailsMap.get(matchId);

            return {
                id: bet.id,
                matchId,
                matchType: 'player' as const,
                player1Name: match?.player1_name || "Unknown Player",
                player2Name: match?.player2_name || "Unknown Player",
                player1CharacterId: match?.player1_character_id || "",
                player2CharacterId: match?.player2_character_id || "",
                betOn: bet.bet_on,
                amount: bet.amount?.toString() || "0",
                feeAmount: bet.fee_paid?.toString() || "0",
                netAmount: bet.net_amount?.toString() || "0",
                payoutAmount: bet.payout_amount?.toString() || null,
                status: bet.status,
                winner: pool?.winner || null,
                createdAt: bet.created_at,
                paidAt: bet.paid_at,
                txId: bet.tx_id,
                payoutTxId: bet.payout_tx_id,
            };
        });

        // Combine and sort by date
        const combinedHistory = [...botHistory, ...playerHistory]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(offset, offset + limit);

        // Calculate stats across both types
        const allBets = [...botHistory, ...playerHistory];
        const stats = {
            totalBets: total,
            wonBets: allBets.filter(b => b.status === 'won').length,
            lostBets: allBets.filter(b => b.status === 'lost').length,
            pendingBets: allBets.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
            totalWagered: allBets.reduce((sum, b) => sum + BigInt(b.amount), BigInt(0)).toString(),
            totalWon: allBets.filter(b => b.status === 'won' && b.payoutAmount)
                .reduce((sum, b) => sum + BigInt(b.payoutAmount!), BigInt(0)).toString(),
        };

        return NextResponse.json({
            success: true,
            history: combinedHistory,
            stats,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error("[UnifiedBetHistory] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
