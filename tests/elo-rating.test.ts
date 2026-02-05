/**
 * ELO Rating System Unit Tests
 * 
 * Tests for the ELO rating calculation functions:
 * - calculateExpectedScore
 * - getKFactor
 * - calculateRatingChange
 * - clampRating
 */

import { describe, it, expect } from 'vitest';
import {
  calculateExpectedScore,
  getKFactor,
  calculateRatingChange,
  clampRating,
} from '@/lib/rating/elo';
import { ELO_CONSTANTS } from '@/types/constants';

// =============================================================================
// EXPECTED SCORE CALCULATION
// =============================================================================

describe('ELO - calculateExpectedScore', () => {
  it('should return 0.5 for equal ratings', () => {
    const expected = calculateExpectedScore(1000, 1000);
    expect(expected).toBeCloseTo(0.5, 4);
  });

  it('should return higher value for higher-rated player', () => {
    const expected = calculateExpectedScore(1200, 1000);
    expect(expected).toBeGreaterThan(0.5);
  });

  it('should return lower value for lower-rated player', () => {
    const expected = calculateExpectedScore(1000, 1200);
    expect(expected).toBeLessThan(0.5);
  });

  it('should return approximately 0.64 for 100 rating difference', () => {
    const expected = calculateExpectedScore(1100, 1000);
    expect(expected).toBeCloseTo(0.64, 1);
  });

  it('should return approximately 0.76 for 200 rating difference', () => {
    const expected = calculateExpectedScore(1200, 1000);
    expect(expected).toBeCloseTo(0.76, 1);
  });

  it('should return approximately 0.91 for 400 rating difference', () => {
    const expected = calculateExpectedScore(1400, 1000);
    expect(expected).toBeCloseTo(0.91, 1);
  });

  it('should be symmetric (A vs B inverse of B vs A)', () => {
    const expectedA = calculateExpectedScore(1200, 1000);
    const expectedB = calculateExpectedScore(1000, 1200);
    expect(expectedA + expectedB).toBeCloseTo(1.0, 4);
  });

  it('should handle extreme rating differences', () => {
    const expected = calculateExpectedScore(2500, 500);
    expect(expected).toBeGreaterThan(0.99);
    expect(expected).toBeLessThanOrEqual(1.0);
  });

  it('should always return value between 0 and 1', () => {
    for (let i = 0; i < 100; i++) {
      const ratingA = Math.floor(Math.random() * 2000) + 500;
      const ratingB = Math.floor(Math.random() * 2000) + 500;
      const expected = calculateExpectedScore(ratingA, ratingB);
      expect(expected).toBeGreaterThan(0);
      expect(expected).toBeLessThan(1);
    }
  });
});

// =============================================================================
// K-FACTOR
// =============================================================================

describe('ELO - getKFactor', () => {
  it('should return new player K-factor for < 10 games', () => {
    expect(getKFactor(0)).toBe(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR);
    expect(getKFactor(5)).toBe(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR);
    expect(getKFactor(9)).toBe(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR);
  });

  it('should return standard K-factor for >= 10 games', () => {
    expect(getKFactor(10)).toBe(ELO_CONSTANTS.K_FACTOR);
    expect(getKFactor(50)).toBe(ELO_CONSTANTS.K_FACTOR);
    expect(getKFactor(100)).toBe(ELO_CONSTANTS.K_FACTOR);
  });

  it('new player K-factor should be higher than standard', () => {
    expect(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR).toBeGreaterThan(ELO_CONSTANTS.K_FACTOR);
  });

  it('K-factors should be positive', () => {
    expect(ELO_CONSTANTS.K_FACTOR).toBeGreaterThan(0);
    expect(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR).toBeGreaterThan(0);
  });
});

// =============================================================================
// RATING CHANGE CALCULATION
// =============================================================================

describe('ELO - calculateRatingChange', () => {
  it('should return positive change for a win', () => {
    const change = calculateRatingChange(1000, 1000, true, 50);
    expect(change).toBeGreaterThan(0);
  });

  it('should return negative change for a loss', () => {
    const change = calculateRatingChange(1000, 1000, false, 50);
    expect(change).toBeLessThan(0);
  });

  it('should return larger gain for upset win (lower rated beats higher)', () => {
    const upsetChange = calculateRatingChange(1000, 1200, true, 50);
    const normalChange = calculateRatingChange(1000, 1000, true, 50);
    expect(upsetChange).toBeGreaterThan(normalChange);
  });

  it('should return smaller loss for expected loss (lower rated loses to higher)', () => {
    const expectedLoss = calculateRatingChange(1000, 1200, false, 50);
    const equalLoss = calculateRatingChange(1000, 1000, false, 50);
    expect(Math.abs(expectedLoss)).toBeLessThan(Math.abs(equalLoss));
  });

  it('should return larger change for new players', () => {
    const newPlayerChange = calculateRatingChange(1000, 1000, true, 5);
    const veteranChange = calculateRatingChange(1000, 1000, true, 50);
    expect(newPlayerChange).toBeGreaterThan(veteranChange);
  });

  it('should return integer values', () => {
    const change = calculateRatingChange(1000, 1000, true, 50);
    expect(Number.isInteger(change)).toBe(true);
  });

  it('winner and loser changes should be opposite signs', () => {
    const winnerChange = calculateRatingChange(1000, 1000, true, 50);
    const loserChange = calculateRatingChange(1000, 1000, false, 50);
    expect(winnerChange).toBeGreaterThan(0);
    expect(loserChange).toBeLessThan(0);
  });

  it('should handle equal ratings correctly', () => {
    const winChange = calculateRatingChange(1000, 1000, true, 50);
    const lossChange = calculateRatingChange(1000, 1000, false, 50);
    
    // For equal ratings, expected = 0.5, so K * (1 - 0.5) = K * 0.5 for win
    // and K * (0 - 0.5) = -K * 0.5 for loss
    expect(winChange).toBe(-lossChange);
  });

  it('should return approximately half K-factor for equal rating match', () => {
    const kFactor = getKFactor(50);
    const change = calculateRatingChange(1000, 1000, true, 50);
    expect(change).toBeCloseTo(kFactor / 2, 0);
  });
});

// =============================================================================
// RATING CLAMPING
// =============================================================================

describe('ELO - clampRating', () => {
  it('should clamp below minimum to minimum', () => {
    const clamped = clampRating(ELO_CONSTANTS.MIN_RATING - 100);
    expect(clamped).toBe(ELO_CONSTANTS.MIN_RATING);
  });

  it('should clamp above maximum to maximum', () => {
    const clamped = clampRating(ELO_CONSTANTS.MAX_RATING + 100);
    expect(clamped).toBe(ELO_CONSTANTS.MAX_RATING);
  });

  it('should not modify valid ratings', () => {
    const midRating = Math.floor((ELO_CONSTANTS.MIN_RATING + ELO_CONSTANTS.MAX_RATING) / 2);
    expect(clampRating(midRating)).toBe(midRating);
  });

  it('should clamp edge case at minimum', () => {
    expect(clampRating(ELO_CONSTANTS.MIN_RATING)).toBe(ELO_CONSTANTS.MIN_RATING);
  });

  it('should clamp edge case at maximum', () => {
    expect(clampRating(ELO_CONSTANTS.MAX_RATING)).toBe(ELO_CONSTANTS.MAX_RATING);
  });

  it('should handle negative ratings', () => {
    const clamped = clampRating(-500);
    expect(clamped).toBe(ELO_CONSTANTS.MIN_RATING);
  });

  it('should handle very large ratings', () => {
    const clamped = clampRating(100000);
    expect(clamped).toBe(ELO_CONSTANTS.MAX_RATING);
  });
});

// =============================================================================
// INTEGRATION SCENARIOS
// =============================================================================

describe('ELO - Integration Scenarios', () => {
  it('should simulate a typical match between equal players', () => {
    const rating1 = 1000;
    const rating2 = 1000;

    const winnerChange = calculateRatingChange(rating1, rating2, true, 20);
    const loserChange = calculateRatingChange(rating2, rating1, false, 20);

    const newWinnerRating = clampRating(rating1 + winnerChange);
    const newLoserRating = clampRating(rating2 + loserChange);

    expect(newWinnerRating).toBeGreaterThan(rating1);
    expect(newLoserRating).toBeLessThan(rating2);
    expect(newWinnerRating + newLoserRating).toBe(rating1 + rating2); // Zero-sum
  });

  it('should simulate an upset victory', () => {
    const underdog = 800;
    const favorite = 1200;

    const underdogWinChange = calculateRatingChange(underdog, favorite, true, 50);
    const favoriteChange = calculateRatingChange(favorite, underdog, false, 50);

    // Underdog should gain significantly
    expect(underdogWinChange).toBeGreaterThan(20);
    // Favorite should lose significantly
    expect(favoriteChange).toBeLessThan(-20);
  });

  it('should simulate expected outcome', () => {
    const underdog = 800;
    const favorite = 1200;

    const favoriteWinChange = calculateRatingChange(favorite, underdog, true, 50);
    const underdogChange = calculateRatingChange(underdog, favorite, false, 50);

    // Favorite gains little for expected win
    expect(favoriteWinChange).toBeLessThan(15);
    // Underdog loses little for expected loss
    expect(Math.abs(underdogChange)).toBeLessThan(15);
  });

  it('should handle new player rating volatility', () => {
    const newPlayer = 1000;
    const veteran = 1000;

    const newPlayerWin = calculateRatingChange(newPlayer, veteran, true, 3);
    const veteranWin = calculateRatingChange(veteran, newPlayer, true, 50);

    // New player should have more volatile rating
    expect(Math.abs(newPlayerWin)).toBeGreaterThan(Math.abs(veteranWin));
  });

  it('should prevent rating from going below minimum after many losses', () => {
    let rating = ELO_CONSTANTS.MIN_RATING + 50;
    
    for (let i = 0; i < 20; i++) {
      const change = calculateRatingChange(rating, 2000, false, 50);
      rating = clampRating(rating + change);
    }

    expect(rating).toBeGreaterThanOrEqual(ELO_CONSTANTS.MIN_RATING);
  });

  it('should prevent rating from exceeding maximum after many wins', () => {
    let rating = ELO_CONSTANTS.MAX_RATING - 50;
    
    for (let i = 0; i < 20; i++) {
      const change = calculateRatingChange(rating, 500, true, 50);
      rating = clampRating(rating + change);
    }

    expect(rating).toBeLessThanOrEqual(ELO_CONSTANTS.MAX_RATING);
  });
});

// =============================================================================
// ELO CONSTANTS VERIFICATION
// =============================================================================

describe('ELO Constants', () => {
  it('should have valid K-factor', () => {
    expect(ELO_CONSTANTS.K_FACTOR).toBeGreaterThan(0);
    expect(ELO_CONSTANTS.K_FACTOR).toBeLessThanOrEqual(64);
  });

  it('should have valid new player K-factor', () => {
    expect(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR).toBeGreaterThan(0);
    expect(ELO_CONSTANTS.NEW_PLAYER_K_FACTOR).toBeLessThanOrEqual(100);
  });

  it('should have valid rating bounds', () => {
    expect(ELO_CONSTANTS.MIN_RATING).toBeLessThan(ELO_CONSTANTS.MAX_RATING);
    expect(ELO_CONSTANTS.MIN_RATING).toBeGreaterThanOrEqual(0);
    expect(ELO_CONSTANTS.MAX_RATING).toBeLessThanOrEqual(5000);
  });
});
