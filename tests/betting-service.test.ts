/**
 * Betting Service Unit Tests
 * 
 * Tests for betting calculations:
 * - Odds calculation
 * - Fee calculation
 * - Payout calculation
 * - Pool simulation
 * - Utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOdds,
  calculateFee,
  calculateNetAmount,
  calculatePayout,
  calculateAllPayouts,
  simulateOddsAfterBet,
  calculatePotentialWinnings,
  sompiToKas,
  kasToSompi,
  formatOdds,
  HOUSE_FEE_RATE,
  MIN_BET_SOMPI,
  SOMPI_PER_KAS,
  type BettingPool,
  type Bet,
} from '@/lib/betting/betting-service';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createTestPool(overrides: Partial<BettingPool> = {}): BettingPool {
  return {
    id: 'test-pool',
    matchId: 'test-match',
    player1Total: BigInt(0),
    player2Total: BigInt(0),
    totalPool: BigInt(0),
    totalFees: BigInt(0),
    status: 'open',
    ...overrides,
  };
}

function createTestBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: 'test-bet',
    poolId: 'test-pool',
    bettorAddress: 'kaspa:testaddress',
    betOn: 'player1',
    amount: BigInt(100000000), // 1 KAS
    feePaid: BigInt(100000), // 0.001 KAS
    netAmount: BigInt(99900000), // 0.999 KAS
    txId: 'tx-123',
    status: 'confirmed',
    ...overrides,
  };
}

// =============================================================================
// CONSTANTS VERIFICATION
// =============================================================================

describe('Betting Service - Constants', () => {
  it('should have correct house fee rate (0.1%)', () => {
    expect(HOUSE_FEE_RATE).toBe(0.001);
  });

  it('should have correct minimum bet (1 KAS)', () => {
    expect(MIN_BET_SOMPI).toBe(BigInt(100000000));
  });

  it('should have correct sompi per KAS conversion', () => {
    expect(SOMPI_PER_KAS).toBe(BigInt(100000000));
  });
});

// =============================================================================
// ODDS CALCULATION
// =============================================================================

describe('Betting Service - calculateOdds', () => {
  it('should return 2.0x odds for empty pool', () => {
    const pool = createTestPool();
    const odds = calculateOdds(pool);

    expect(odds.player1Odds).toBe(2.0);
    expect(odds.player2Odds).toBe(2.0);
    expect(odds.player1Percentage).toBe(50);
    expect(odds.player2Percentage).toBe(50);
    expect(odds.totalPool).toBe(BigInt(0));
  });

  it('should calculate correct odds for equal bets', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000), // 1 KAS
      player2Total: BigInt(100000000), // 1 KAS
      totalPool: BigInt(200000000),   // 2 KAS
    });

    const odds = calculateOdds(pool);

    expect(odds.player1Odds).toBe(2.0);
    expect(odds.player2Odds).toBe(2.0);
    expect(odds.player1Percentage).toBe(50);
    expect(odds.player2Percentage).toBe(50);
  });

  it('should calculate correct odds for uneven bets', () => {
    const pool = createTestPool({
      player1Total: BigInt(300000000), // 3 KAS
      player2Total: BigInt(100000000), // 1 KAS
      totalPool: BigInt(400000000),   // 4 KAS
    });

    const odds = calculateOdds(pool);

    // P1 odds = 4/3 = 1.33x
    expect(odds.player1Odds).toBeCloseTo(1.33, 1);
    // P2 odds = 4/1 = 4.0x
    expect(odds.player2Odds).toBe(4.0);
    expect(odds.player1Percentage).toBe(75);
    expect(odds.player2Percentage).toBe(25);
  });

  it('should handle edge case when one side has no bets', () => {
    const pool = createTestPool({
      player1Total: BigInt(0),
      player2Total: BigInt(100000000),
      totalPool: BigInt(100000000),
    });

    const odds = calculateOdds(pool);

    // P1 has 0 bets, should show estimated odds
    expect(odds.player1Odds).toBeGreaterThan(1);
    expect(odds.player2Odds).toBeCloseTo(1.05, 1);
    expect(odds.player1Percentage).toBe(0);
    expect(odds.player2Percentage).toBe(100);
  });

  it('should return pools in result', () => {
    const pool = createTestPool({
      player1Total: BigInt(500),
      player2Total: BigInt(1000),
      totalPool: BigInt(1500),
    });

    const odds = calculateOdds(pool);

    expect(odds.player1Pool).toBe(BigInt(500));
    expect(odds.player2Pool).toBe(BigInt(1000));
    expect(odds.totalPool).toBe(BigInt(1500));
  });
});

// =============================================================================
// FEE CALCULATION
// =============================================================================

describe('Betting Service - calculateFee', () => {
  it('should calculate 0.1% fee correctly', () => {
    const amount = BigInt(100000000); // 1 KAS
    const fee = calculateFee(amount);
    
    // 0.1% of 1 KAS = 0.001 KAS = 100000 sompi
    expect(fee).toBe(BigInt(100000));
  });

  it('should calculate fee for large amounts', () => {
    const amount = BigInt(1000000000000); // 10000 KAS
    const fee = calculateFee(amount);
    
    // 0.1% of 10000 KAS = 10 KAS = 1000000000 sompi
    expect(fee).toBe(BigInt(1000000000));
  });

  it('should round down for small amounts', () => {
    const amount = BigInt(500); // 0.000005 KAS
    const fee = calculateFee(amount);
    
    // 500 / 1000 = 0, rounds down
    expect(fee).toBe(BigInt(0));
  });

  it('should handle minimum bet amount', () => {
    const fee = calculateFee(MIN_BET_SOMPI);
    expect(fee).toBe(BigInt(100000)); // 0.1% of 1 KAS
  });
});

describe('Betting Service - calculateNetAmount', () => {
  it('should subtract fee from amount', () => {
    const amount = BigInt(100000000); // 1 KAS
    const netAmount = calculateNetAmount(amount);
    const fee = calculateFee(amount);
    
    expect(netAmount).toBe(amount - fee);
    expect(netAmount).toBe(BigInt(99900000)); // 0.999 KAS
  });

  it('should handle edge cases', () => {
    const amount = BigInt(1000);
    const netAmount = calculateNetAmount(amount);
    const fee = calculateFee(amount);
    
    expect(netAmount).toBe(amount - fee);
    expect(netAmount).toBeLessThanOrEqual(amount);
  });
});

// =============================================================================
// PAYOUT CALCULATION
// =============================================================================

describe('Betting Service - calculatePayout', () => {
  it('should return 0 for losing bet', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
      winner: 'player2',
      status: 'resolved',
    });

    const bet = createTestBet({ betOn: 'player1' });
    const payout = calculatePayout(bet, pool);

    expect(payout).toBe(BigInt(0));
  });

  it('should calculate correct payout for winning bet', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
      winner: 'player1',
      status: 'resolved',
    });

    const bet = createTestBet({
      betOn: 'player1',
      netAmount: BigInt(100000000),
    });

    const payout = calculatePayout(bet, pool);

    // Payout = netAmount * (totalPool / winningPool)
    // = 100M * (200M / 100M) = 200M
    expect(payout).toBe(BigInt(200000000));
  });

  it('should calculate payout proportionally', () => {
    const pool = createTestPool({
      player1Total: BigInt(300000000), // 3 KAS
      player2Total: BigInt(100000000), // 1 KAS
      totalPool: BigInt(400000000),   // 4 KAS
      winner: 'player2',
      status: 'resolved',
    });

    const bet = createTestBet({
      betOn: 'player2',
      netAmount: BigInt(100000000), // 1 KAS bet
    });

    const payout = calculatePayout(bet, pool);

    // P2 is only winner, gets entire pool
    // Payout = 1 KAS * (4 KAS / 1 KAS) = 4 KAS
    expect(payout).toBe(BigInt(400000000));
  });

  it('should return refund if sole bettor', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(0),
      totalPool: BigInt(100000000),
      winner: 'player1',
      status: 'resolved',
    });

    const bet = createTestBet({
      betOn: 'player1',
      netAmount: BigInt(100000000),
    });

    // When winningPool = player1Total = bet.netAmount
    // Payout = netAmount * (totalPool / winningPool) = 100M * 1 = 100M
    const payout = calculatePayout(bet, pool);
    expect(payout).toBe(BigInt(100000000)); // Gets back what they put in
  });
});

describe('Betting Service - calculateAllPayouts', () => {
  it('should calculate payouts for all winners', () => {
    const pool = createTestPool({
      player1Total: BigInt(200000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(300000000),
      winner: 'player1',
      status: 'resolved',
    });

    const bets: Bet[] = [
      createTestBet({
        id: 'bet-1',
        bettorAddress: 'kaspa:addr1',
        betOn: 'player1',
        netAmount: BigInt(100000000),
      }),
      createTestBet({
        id: 'bet-2',
        bettorAddress: 'kaspa:addr2',
        betOn: 'player1',
        netAmount: BigInt(100000000),
      }),
      createTestBet({
        id: 'bet-3',
        bettorAddress: 'kaspa:addr3',
        betOn: 'player2',
        netAmount: BigInt(100000000),
      }),
    ];

    const payouts = calculateAllPayouts(bets, pool);

    // Only P1 bettors should get payouts
    expect(payouts.length).toBe(2);
    
    // Each P1 bettor should get proportional share
    // Total pool = 300M, P1 pool = 200M
    // Each bet = 100M, so payout = 100M * (300M / 200M) = 150M each
    expect(payouts[0].payoutAmount).toBe(BigInt(150000000));
    expect(payouts[1].payoutAmount).toBe(BigInt(150000000));
  });

  it('should throw if pool has no winner', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
      status: 'open',
    });

    const bets: Bet[] = [createTestBet()];

    expect(() => calculateAllPayouts(bets, pool)).toThrow('Pool has no winner set');
  });

  it('should only include confirmed bets', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
      winner: 'player1',
      status: 'resolved',
    });

    const bets: Bet[] = [
      createTestBet({ id: 'bet-1', status: 'confirmed', betOn: 'player1' }),
      createTestBet({ id: 'bet-2', status: 'pending', betOn: 'player1' }),
    ];

    const payouts = calculateAllPayouts(bets, pool);

    expect(payouts.length).toBe(1);
    expect(payouts[0].bettorAddress).toBe('kaspa:testaddress');
  });

  it('should calculate profit correctly', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
      winner: 'player1',
      status: 'resolved',
    });

    const bets: Bet[] = [
      createTestBet({
        betOn: 'player1',
        netAmount: BigInt(100000000),
      }),
    ];

    const payouts = calculateAllPayouts(bets, pool);

    // Payout = 200M, netAmount = 100M, profit = 100M
    expect(payouts[0].profit).toBe(BigInt(100000000));
  });
});

// =============================================================================
// POOL SIMULATION
// =============================================================================

describe('Betting Service - simulateOddsAfterBet', () => {
  it('should simulate odds correctly for new bet on P1', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
    });

    const simulated = simulateOddsAfterBet(pool, 'player1', BigInt(100000000));

    // After betting 1 KAS (minus fee) on P1:
    // P1 total ~= 200M, P2 total = 100M, total ~= 300M
    expect(simulated.player1Odds).toBeLessThan(2.0); // Odds decrease
    expect(simulated.player2Odds).toBeGreaterThan(2.0); // Odds increase
  });

  it('should simulate odds correctly for new bet on P2', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
    });

    const simulated = simulateOddsAfterBet(pool, 'player2', BigInt(100000000));

    expect(simulated.player1Odds).toBeGreaterThan(2.0); // Odds increase
    expect(simulated.player2Odds).toBeLessThan(2.0); // Odds decrease
  });

  it('should not modify original pool', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
    });

    const originalP1Total = pool.player1Total;
    simulateOddsAfterBet(pool, 'player1', BigInt(100000000));

    expect(pool.player1Total).toBe(originalP1Total);
  });
});

describe('Betting Service - calculatePotentialWinnings', () => {
  it('should calculate potential winnings for bet', () => {
    const pool = createTestPool({
      player1Total: BigInt(100000000),
      player2Total: BigInt(100000000),
      totalPool: BigInt(200000000),
    });

    const result = calculatePotentialWinnings(pool, 'player1', BigInt(100000000));

    expect(result.payout).toBeGreaterThan(BigInt(0));
    expect(result.odds).toBeGreaterThan(1);
  });

  it('should show higher potential winnings for underdog bet', () => {
    const pool = createTestPool({
      player1Total: BigInt(300000000), // 3 KAS - favorite
      player2Total: BigInt(100000000), // 1 KAS - underdog
      totalPool: BigInt(400000000),
    });

    const p1Result = calculatePotentialWinnings(pool, 'player1', BigInt(100000000));
    const p2Result = calculatePotentialWinnings(pool, 'player2', BigInt(100000000));

    // Betting on underdog (P2) should have higher odds
    expect(p2Result.odds).toBeGreaterThan(p1Result.odds);
  });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

describe('Betting Service - sompiToKas', () => {
  it('should convert sompi to KAS correctly', () => {
    expect(sompiToKas(BigInt(100000000))).toBe(1);
    expect(sompiToKas(BigInt(50000000))).toBe(0.5);
    expect(sompiToKas(BigInt(0))).toBe(0);
    expect(sompiToKas(BigInt(1000000000))).toBe(10);
  });

  it('should handle fractional amounts', () => {
    expect(sompiToKas(BigInt(12345678))).toBeCloseTo(0.12345678, 8);
  });
});

describe('Betting Service - kasToSompi', () => {
  it('should convert KAS to sompi correctly', () => {
    expect(kasToSompi(1)).toBe(BigInt(100000000));
    expect(kasToSompi(0.5)).toBe(BigInt(50000000));
    expect(kasToSompi(0)).toBe(BigInt(0));
    expect(kasToSompi(10)).toBe(BigInt(1000000000));
  });

  it('should floor fractional sompi', () => {
    // 0.123456789 KAS = 12345678.9 sompi, should floor to 12345678
    expect(kasToSompi(0.123456789)).toBe(BigInt(12345678));
  });
});

describe('Betting Service - formatOdds', () => {
  it('should format odds with 2 decimal places and x suffix', () => {
    expect(formatOdds(2)).toBe('2.00x');
    expect(formatOdds(1.5)).toBe('1.50x');
    expect(formatOdds(4.567)).toBe('4.57x');
    expect(formatOdds(1)).toBe('1.00x');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Betting Service - Edge Cases', () => {
  it('should handle very large bet amounts', () => {
    const largeAmount = BigInt('10000000000000000'); // 100M KAS
    const fee = calculateFee(largeAmount);
    const netAmount = calculateNetAmount(largeAmount);

    expect(fee).toBe(BigInt('10000000000000')); // 0.1%
    expect(netAmount).toBe(largeAmount - fee);
  });

  it('should handle minimum viable bets', () => {
    const minBet = MIN_BET_SOMPI;
    const fee = calculateFee(minBet);
    const netAmount = calculateNetAmount(minBet);

    expect(netAmount).toBeGreaterThan(BigInt(0));
    expect(netAmount).toBeLessThan(minBet);
  });

  it('should handle pools with extreme imbalance', () => {
    const pool = createTestPool({
      player1Total: BigInt(1000000000000), // 10000 KAS
      player2Total: BigInt(100000000),     // 1 KAS
      totalPool: BigInt(1000100000000),
    });

    const odds = calculateOdds(pool);

    expect(odds.player1Odds).toBeCloseTo(1.0, 1); // Very low odds
    expect(odds.player2Odds).toBeGreaterThan(1000); // Very high odds
  });
});
