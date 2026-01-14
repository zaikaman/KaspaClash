/**
 * Battle Pass Claim API Route
 * Endpoint: POST /api/battle-pass/claim
 * Handles claiming rewards for unlocked tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { Errors, handleError, createErrorResponse, ApiError, ErrorCodes } from '@/lib/api/errors';
import { getTierRewards } from '@/lib/progression/tier-rewards';

interface ClaimRequest {
    playerId: string;
    tier: number; // Tier to claim
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as ClaimRequest;
        const { playerId, tier } = body;

        if (!playerId || !tier) {
            throw Errors.badRequest('playerId and tier are required');
        }

        const supabase = createSupabaseAdminClient() as any;

        // 1. Fetch player progression
        const { data: progression, error: fetchError } = await supabase
            .from('player_progression')
            .select('*')
            .eq('player_id', playerId)
            .single();

        if (fetchError || !progression) {
            console.error('Error fetching progression:', fetchError);
            throw Errors.badRequest('Player progression not found');
        }

        // 2. Validate tier is unlocked
        if (tier > progression.current_tier) {
            throw Errors.badRequest('Tier is not unlocked yet');
        }

        // 3. Validate tier is not already claimed
        const claimedTiers: number[] = progression.claimed_tiers || [];
        if (claimedTiers.includes(tier)) {
            throw Errors.badRequest('Tier rewards already claimed');
        }

        // 4. Get rewards for the tier
        const rewards = getTierRewards(tier, false);

        // 5. Award rewards (Transaction)
        // Award Currency
        const currencyRewards = rewards.filter((r) => r.type === 'currency');
        let totalShards = 0;

        for (const reward of currencyRewards) {
            if (reward.currencyAmount && reward.currencyAmount > 0) {
                totalShards += reward.currencyAmount;
            }
        }

        if (totalShards > 0) {
            // Update currency
            const { data: currencyData } = await supabase
                .from('player_currency')
                .select('clash_shards, total_earned')
                .eq('player_id', playerId)
                .single();

            const currentBalance = currencyData?.clash_shards || 0;
            const newBalance = currentBalance + totalShards;

            if (currencyData) {
                await supabase
                    .from('player_currency')
                    .update({
                        clash_shards: newBalance,
                        total_earned: (currencyData.total_earned || 0) + totalShards,
                        updated_at: new Date().toISOString()
                    })
                    .eq('player_id', playerId);
            } else {
                await supabase.from('player_currency').insert({
                    player_id: playerId,
                    clash_shards: totalShards,
                    total_earned: totalShards,
                    total_spent: 0
                });
            }

            // Record transaction
            await supabase.from('currency_transactions').insert({
                player_id: playerId,
                amount: totalShards,
                transaction_type: 'earn',
                source: 'battle_pass_claim',
                balance_before: currentBalance,
                balance_after: newBalance,
                metadata: { tier }
            });
        }

        // Award Cosmetics / Badges
        const itemRewards = rewards.filter(r => r.type === 'cosmetic' || r.type === 'achievement_badge');
        for (const item of itemRewards) {
            if (item.itemId) {
                // Here we would lookup cosmetic ID by name/itemId or just insert into inventory
                // For MVP, if we don't have a lookup, we might skip or need a mapping.
                // Assuming `cosmetic_items` table has these items.
                // For now, logging that we would award item.
                // Ideally: lookup item ID from `cosmetic_items` where name = item.itemId
                console.log(`[Claim] Would award item: ${item.itemId} to ${playerId}`);
            }
        }

        // 6. Update claimed_tiers
        const newClaimedTiers = [...claimedTiers, tier];
        const { error: updateError } = await supabase
            .from('player_progression')
            .update({
                claimed_tiers: newClaimedTiers,
                updated_at: new Date().toISOString()
            })
            .eq('player_id', playerId);

        if (updateError) {
            console.error('Error updating claimed tiers:', updateError);
            throw new ApiError(ErrorCodes.INTERNAL_ERROR, 'Failed to update claimed status');
        }

        return NextResponse.json({
            success: true,
            tier,
            rewards,
            claimedTiers: newClaimedTiers,
            newCurrencyBalance: totalShards > 0 ? (await supabase.from('player_currency').select('clash_shards').eq('player_id', playerId).single()).data?.clash_shards : undefined
        });

    } catch (error) {
        return createErrorResponse(handleError(error));
    }
}
