/**
 * Bot Bet History API
 * GET /api/bot-betting/history?address=<wallet_address>&limit=10&offset=0
 * 
 * Returns betting history for a specific user
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface BotBetHistoryItem {
    id: string;
    matchId: string;
    bot1Name: string;
    bot2Name: string;
    bot1CharacterId: string;
    bot2CharacterId: string;
    betOn: 'bot1' | 'bot2';
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

        // Get bets with pool and match information
        const { data: betsData, error: betsError } = await db
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
                bot_betting_pools!inner (
                    bot_match_id,
                    winner,
                    bot_matches!inner (
                        bot1_name,
                        bot2_name,
                        bot1_character_id,
                        bot2_character_id
                    )
                )
            `)
            .eq("bettor_address", address)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (betsError) {
            console.error("[BotBetHistory] Error fetching bets:", betsError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch bet history" },
                { status: 500 }
            );
        }

        // Get total count
        const { count, error: countError } = await db
            .from("bot_bets")
            .select("id", { count: "exact", head: true })
            .eq("bettor_address", address);

        const total = count || 0;

        // Transform data
        const history: BotBetHistoryItem[] = (betsData || []).map((bet: any) => {
            const pool = bet.bot_betting_pools;
            const match = pool?.bot_matches;

            return {
                id: bet.id,
                matchId: pool?.bot_match_id || "",
                bot1Name: match?.bot1_name || "Unknown",
                bot2Name: match?.bot2_name || "Unknown",
                bot1CharacterId: match?.bot1_character_id || "",
                bot2CharacterId: match?.bot2_character_id || "",
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

        // Calculate stats
        const stats = {
            totalBets: total,
            wonBets: history.filter(b => b.status === 'won').length,
            lostBets: history.filter(b => b.status === 'lost').length,
            pendingBets: history.filter(b => b.status === 'confirmed' || b.status === 'pending').length,
            totalWagered: history.reduce((sum, b) => sum + BigInt(b.amount), BigInt(0)).toString(),
            totalWon: history.filter(b => b.status === 'won' && b.payoutAmount)
                .reduce((sum, b) => sum + BigInt(b.payoutAmount!), BigInt(0)).toString(),
        };

        return NextResponse.json({
            success: true,
            history,
            stats,
            pagination: {
                limit,
                offset,
                total,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error("[BotBetHistory] Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
