/**
 * Betting Service
 * Handles odds calculation, payout computation, and pool management
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/** House fee: 0.1% (1/1000) */
export const HOUSE_FEE_RATE = 0.001;

/** Minimum bet: 1 KAS in sompi */
export const MIN_BET_SOMPI = BigInt(100000000);

/** Sompi per KAS */
export const SOMPI_PER_KAS = BigInt(100000000);

// =============================================================================
// TYPES
// =============================================================================

export interface BettingPool {
    id: string;
    matchId: string;
    player1Total: bigint;
    player2Total: bigint;
    totalPool: bigint;
    totalFees: bigint;
    status: 'open' | 'locked' | 'resolved' | 'refunded';
    winner?: 'player1' | 'player2';
}

export interface Bet {
    id: string;
    poolId: string;
    bettorAddress: string;
    betOn: 'player1' | 'player2';
    amount: bigint;
    feePaid: bigint;
    netAmount: bigint;
    txId: string;
    payoutAmount?: bigint;
    status: 'pending' | 'confirmed' | 'won' | 'lost' | 'refunded';
}

export interface OddsInfo {
    player1Odds: number;
    player2Odds: number;
    player1Percentage: number;
    player2Percentage: number;
    totalPool: bigint;
    player1Pool: bigint;
    player2Pool: bigint;
}

export interface PayoutResult {
    bettorAddress: string;
    betAmount: bigint;
    payoutAmount: bigint;
    profit: bigint;
}

// =============================================================================
// ODDS CALCULATION
// =============================================================================

/**
 * Calculate current odds for a betting pool.
 * Returns odds as multipliers (e.g., 2.5x means bet 1 KAS, win 2.5 KAS)
 */
export function calculateOdds(pool: BettingPool): OddsInfo {
    const p1 = pool.player1Total;
    const p2 = pool.player2Total;
    const total = pool.totalPool;

    // Handle edge cases
    if (total === BigInt(0)) {
        return {
            player1Odds: 2.0,
            player2Odds: 2.0,
            player1Percentage: 50,
            player2Percentage: 50,
            totalPool: BigInt(0),
            player1Pool: BigInt(0),
            player2Pool: BigInt(0),
        };
    }

    // If a side has 0 bets, simulate odds based on a Minimum Bet placement
    // This prevents showing "Infinity" or massive numbers (like 10^10x) based on 1 sompi
    const hypotheticalBet = MIN_BET_SOMPI > 0 ? Number(MIN_BET_SOMPI) : 100000000;

    if (p1 === BigInt(0)) {
        // If I bet MIN_BET on P1, the pool becomes total + MIN_BET
        // Payout = (total + MIN_BET) / MIN_BET
        // Odds = Payout / Bet = (total + MIN_BET) / MIN_BET / 1 ?? 
        // No, Odds multiplier = TotalPayout / BetAmount
        const estimatedOdds = (Number(total) + hypotheticalBet) / hypotheticalBet;
        return {
            player1Odds: estimatedOdds,
            player2Odds: 1.05, // Minimum/Refund-ish for the crowded side if we assume current state
            player1Percentage: 0,
            player2Percentage: 100,
            totalPool: total,
            player1Pool: p1,
            player2Pool: p2,
        };
    }

    if (p2 === BigInt(0)) {
        const estimatedOdds = (Number(total) + hypotheticalBet) / hypotheticalBet;
        return {
            player1Odds: 1.05,
            player2Odds: estimatedOdds,
            player1Percentage: 100,
            player2Percentage: 0,
            totalPool: total,
            player1Pool: p1,
            player2Pool: p2,
        };
    }

    // Calculate odds: total / side
    const player1Odds = Number(total) / Number(p1);
    const player2Odds = Number(total) / Number(p2);

    // Calculate percentages
    const player1Percentage = (Number(p1) / Number(total)) * 100;
    const player2Percentage = (Number(p2) / Number(total)) * 100;

    return {
        player1Odds: Math.round(player1Odds * 100) / 100, // 2 decimal places
        player2Odds: Math.round(player2Odds * 100) / 100,
        player1Percentage: Math.round(player1Percentage),
        player2Percentage: Math.round(player2Percentage),
        totalPool: total,
        player1Pool: p1,
        player2Pool: p2,
    };
}

// =============================================================================
// FEE CALCULATION
// =============================================================================

/**
 * Calculate the fee for a bet (0.1%)
 */
export function calculateFee(amount: bigint): bigint {
    // fee = amount * 0.001 = amount / 1000
    return amount / BigInt(1000);
}

/**
 * Calculate net amount after fee
 */
export function calculateNetAmount(amount: bigint): bigint {
    const fee = calculateFee(amount);
    return amount - fee;
}

// =============================================================================
// PAYOUT CALCULATION
// =============================================================================

/**
 * Calculate payout for a winning bet.
 * Payout = netAmount * (totalPool / winningPool)
 */
export function calculatePayout(
    bet: Bet,
    pool: BettingPool
): bigint {
    // Only calculate for confirmed bets on winning side
    if (bet.betOn !== pool.winner) {
        return BigInt(0);
    }

    const winningPool = pool.winner === 'player1'
        ? pool.player1Total
        : pool.player2Total;

    if (winningPool === BigInt(0)) {
        return bet.netAmount; // Refund if no one else bet
    }

    // payout = netAmount * (totalPool / winningPool)
    // Use bigint math carefully to avoid overflow
    const payout = (bet.netAmount * pool.totalPool) / winningPool;

    return payout;
}

/**
 * Calculate all payouts for a resolved pool.
 */
export function calculateAllPayouts(
    bets: Bet[],
    pool: BettingPool
): PayoutResult[] {
    if (!pool.winner) {
        throw new Error('Pool has no winner set');
    }

    const winningPool = pool.winner === 'player1'
        ? pool.player1Total
        : pool.player2Total;

    return bets
        .filter(bet => bet.betOn === pool.winner && bet.status === 'confirmed')
        .map(bet => {
            const payoutAmount = calculatePayout(bet, pool);
            const profit = payoutAmount - bet.netAmount;

            return {
                bettorAddress: bet.bettorAddress,
                betAmount: bet.amount,
                payoutAmount,
                profit,
            };
        });
}

// =============================================================================
// POOL SIMULATION
// =============================================================================

/**
 * Simulate what odds would be after a hypothetical bet.
 * Useful for showing users "if you bet X, your odds would be Y"
 */
export function simulateOddsAfterBet(
    pool: BettingPool,
    betOn: 'player1' | 'player2',
    amount: bigint
): OddsInfo {
    const netAmount = calculateNetAmount(amount);

    const simulatedPool: BettingPool = {
        ...pool,
        player1Total: pool.player1Total + (betOn === 'player1' ? netAmount : BigInt(0)),
        player2Total: pool.player2Total + (betOn === 'player2' ? netAmount : BigInt(0)),
        totalPool: pool.totalPool + netAmount,
    };

    return calculateOdds(simulatedPool);
}

/**
 * Calculate potential winnings for a hypothetical bet.
 */
export function calculatePotentialWinnings(
    pool: BettingPool,
    betOn: 'player1' | 'player2',
    amount: bigint
): { payout: bigint; profit: bigint; odds: number } {
    const netAmount = calculateNetAmount(amount);
    const oddsAfter = simulateOddsAfterBet(pool, betOn, amount);
    const odds = betOn === 'player1' ? oddsAfter.player1Odds : oddsAfter.player2Odds;

    // Approximate payout using the new odds
    const payout = BigInt(Math.floor(Number(netAmount) * odds));
    const profit = payout - amount;

    return { payout, profit, odds };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Convert sompi to KAS for display
 */
export function sompiToKas(sompi: bigint): number {
    return Number(sompi) / Number(SOMPI_PER_KAS);
}

/**
 * Convert KAS to sompi
 */
export function kasToSompi(kas: number): bigint {
    return BigInt(Math.floor(kas * Number(SOMPI_PER_KAS)));
}

/**
 * Format odds for display (e.g., "2.50x")
 */
export function formatOdds(odds: number): string {
    return `${odds.toFixed(2)}x`;
}

/**
 * Format KAS amount for display
 */
export function formatKas(sompi: bigint): string {
    const kas = sompiToKas(sompi);
    return kas.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// =============================================================================
// DATABASE HELPERS
// =============================================================================

/**
 * Transform database row to BettingPool type
 */
export function transformPoolFromDb(row: {
    id: string;
    match_id: string;
    player1_total: number;
    player2_total: number;
    total_pool: number;
    total_fees: number;
    status: string;
    winner?: string;
}): BettingPool {
    return {
        id: row.id,
        matchId: row.match_id,
        player1Total: BigInt(row.player1_total),
        player2Total: BigInt(row.player2_total),
        totalPool: BigInt(row.total_pool),
        totalFees: BigInt(row.total_fees),
        status: row.status as BettingPool['status'],
        winner: row.winner as BettingPool['winner'],
    };
}

/**
 * Transform database row to Bet type
 */
export function transformBetFromDb(row: {
    id: string;
    pool_id: string;
    bettor_address: string;
    bet_on: string;
    amount: number;
    fee_paid: number;
    net_amount: number;
    tx_id: string;
    payout_amount?: number;
    status: string;
}): Bet {
    return {
        id: row.id,
        poolId: row.pool_id,
        bettorAddress: row.bettor_address,
        betOn: row.bet_on as Bet['betOn'],
        amount: BigInt(row.amount),
        feePaid: BigInt(row.fee_paid),
        netAmount: BigInt(row.net_amount),
        txId: row.tx_id,
        payoutAmount: row.payout_amount ? BigInt(row.payout_amount) : undefined,
        status: row.status as Bet['status'],
    };
}
// =============================================================================
// BETTING LOCK LOGIC
// =============================================================================

/**
 * Check if betting should be locked for a match.
 * Lock when match is near completion or already completed.
 */
export function shouldLockBetting(
    matchStatus: string,
    player1RoundsWon: number,
    player2RoundsWon: number,
    format: 'best_of_3' | 'best_of_5'
): boolean {
    // Lock if match is completed
    if (matchStatus === 'completed') {
        return true;
    }

    // Lock if not in progress
    if (matchStatus !== 'in_progress') {
        return false; // Allow betting during character select
    }

    // Determine rounds needed to win
    const roundsToWin = format === 'best_of_3' ? 2 : 3;

    // Lock if either player is one round away from winning
    if (player1RoundsWon >= roundsToWin - 1 || player2RoundsWon >= roundsToWin - 1) {
        return true;
    }

    return false;
}

/**
 * Get the betting lock reason if applicable.
 */
export function getBettingLockReason(
    matchStatus: string,
    player1RoundsWon: number,
    player2RoundsWon: number,
    format: 'best_of_3' | 'best_of_5'
): string | null {
    if (matchStatus === 'completed') {
        return "Match has ended";
    }

    const roundsToWin = format === 'best_of_3' ? 2 : 3;

    if (player1RoundsWon >= roundsToWin - 1) {
        return "Player 1 is one round from winning";
    }

    if (player2RoundsWon >= roundsToWin - 1) {
        return "Player 2 is one round from winning";
    }

    return null;
}
