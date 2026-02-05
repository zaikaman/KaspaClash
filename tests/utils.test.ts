/**
 * Utility Functions Unit Tests
 * 
 * Tests for general utility functions:
 * - formatAddress
 * - formatBalance
 * - generateRoomCode
 * - isValidRoomCode
 * - parseErrorMessage
 * - delay
 * - cn (className merger)
 */

import { describe, it, expect } from 'vitest';
import {
  formatAddress,
  formatBalance,
  generateRoomCode,
  isValidRoomCode,
  parseErrorMessage,
  delay,
  cn,
} from '@/lib/utils';

// =============================================================================
// FORMAT ADDRESS
// =============================================================================

describe('Utility - formatAddress', () => {
  it('should format mainnet address correctly', () => {
    const address = 'kaspa:qz1234567890abcdefghijklmnopqrstuvwxyz';
    const formatted = formatAddress(address);
    
    expect(formatted).toMatch(/^kaspa:qz12.*\.\.\..*$/);
    expect(formatted.includes('...')).toBe(true);
    expect(formatted.length).toBeLessThan(address.length);
  });

  it('should format testnet address correctly', () => {
    const address = 'kaspatest:qp1234567890abcdefghijklmnopqrstuvwxyz';
    const formatted = formatAddress(address);
    
    expect(formatted.startsWith('kaspatest:')).toBe(true);
    expect(formatted.includes('...')).toBe(true);
  });

  it('should return short addresses unchanged', () => {
    const shortAddress = 'kaspa:short';
    const formatted = formatAddress(shortAddress);
    
    expect(formatted).toBe(shortAddress);
  });

  it('should handle empty string', () => {
    expect(formatAddress('')).toBe('');
  });

  it('should handle undefined-like values', () => {
    expect(formatAddress('' as string)).toBe('');
  });

  it('should show prefix and suffix', () => {
    const address = 'kaspa:qz9876543210abcdefghijklmnopqrstuvwxyz123456';
    const formatted = formatAddress(address);
    
    // Should start with beginning of address
    expect(formatted.startsWith('kaspa:')).toBe(true);
    // Should end with last few characters
    expect(formatted.endsWith(address.slice(-6))).toBe(true);
  });
});

// =============================================================================
// FORMAT BALANCE
// =============================================================================

describe('Utility - formatBalance', () => {
  it('should format small amounts correctly', () => {
    const sompi = 100000000; // 1 KAS
    const formatted = formatBalance(sompi);
    
    expect(formatted).toBe('1.00 KAS');
  });

  it('should format decimal amounts correctly', () => {
    const sompi = 150000000; // 1.5 KAS
    const formatted = formatBalance(sompi);
    
    expect(formatted).toBe('1.50 KAS');
  });

  it('should format thousands with K suffix', () => {
    const sompi = 500000000000; // 5000 KAS
    const formatted = formatBalance(sompi);
    
    expect(formatted).toBe('5.00K KAS');
  });

  it('should format millions with M suffix', () => {
    const sompi = BigInt('500000000000000'); // 5M KAS
    const formatted = formatBalance(sompi);
    
    expect(formatted).toBe('5.00M KAS');
  });

  it('should handle zero balance', () => {
    const formatted = formatBalance(0);
    expect(formatted).toBe('0.00 KAS');
  });

  it('should handle bigint input', () => {
    const sompi = BigInt(250000000); // 2.5 KAS
    const formatted = formatBalance(sompi);
    
    expect(formatted).toBe('2.50 KAS');
  });

  it('should format sub-KAS amounts correctly', () => {
    const sompi = 50000000; // 0.5 KAS
    const formatted = formatBalance(sompi);
    
    expect(formatted).toBe('0.50 KAS');
  });
});

// =============================================================================
// ROOM CODE GENERATION
// =============================================================================

describe('Utility - generateRoomCode', () => {
  it('should generate 6 character code', () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
  });

  it('should only use uppercase letters and numbers', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateRoomCode());
    }
    // Should have high uniqueness (allowing for some collisions)
    expect(codes.size).toBeGreaterThan(950);
  });

  it('should be deterministic in format', () => {
    const code = generateRoomCode();
    expect(isValidRoomCode(code)).toBe(true);
  });
});

// =============================================================================
// ROOM CODE VALIDATION
// =============================================================================

describe('Utility - isValidRoomCode', () => {
  it('should accept valid room codes', () => {
    expect(isValidRoomCode('ABC123')).toBe(true);
    expect(isValidRoomCode('ZZZZZZ')).toBe(true);
    expect(isValidRoomCode('000000')).toBe(true);
    expect(isValidRoomCode('A1B2C3')).toBe(true);
  });

  it('should reject lowercase letters', () => {
    expect(isValidRoomCode('abc123')).toBe(false);
    expect(isValidRoomCode('AbC123')).toBe(false);
  });

  it('should reject wrong length', () => {
    expect(isValidRoomCode('ABC12')).toBe(false);
    expect(isValidRoomCode('ABC1234')).toBe(false);
    expect(isValidRoomCode('')).toBe(false);
  });

  it('should reject special characters', () => {
    expect(isValidRoomCode('ABC-12')).toBe(false);
    expect(isValidRoomCode('ABC_12')).toBe(false);
    expect(isValidRoomCode('ABC 12')).toBe(false);
  });

  it('should validate generated codes', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(isValidRoomCode(code)).toBe(true);
    }
  });
});

// =============================================================================
// PARSE ERROR MESSAGE
// =============================================================================

describe('Utility - parseErrorMessage', () => {
  it('should extract message from Error object', () => {
    const error = new Error('Something went wrong');
    expect(parseErrorMessage(error)).toBe('Something went wrong');
  });

  it('should return string errors as-is', () => {
    expect(parseErrorMessage('Custom error')).toBe('Custom error');
  });

  it('should return default message for unknown types', () => {
    expect(parseErrorMessage(null)).toBe('An unknown error occurred');
    expect(parseErrorMessage(undefined)).toBe('An unknown error occurred');
    expect(parseErrorMessage(42)).toBe('An unknown error occurred');
    expect(parseErrorMessage({})).toBe('An unknown error occurred');
  });

  it('should handle error subclasses', () => {
    const typeError = new TypeError('Type mismatch');
    expect(parseErrorMessage(typeError)).toBe('Type mismatch');
    
    const rangeError = new RangeError('Out of range');
    expect(parseErrorMessage(rangeError)).toBe('Out of range');
  });
});

// =============================================================================
// DELAY
// =============================================================================

describe('Utility - delay', () => {
  it('should return a promise', () => {
    const result = delay(10);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve after specified time', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    
    // Allow some tolerance
    expect(elapsed).toBeGreaterThanOrEqual(40);
    expect(elapsed).toBeLessThan(100);
  });

  it('should resolve with undefined', async () => {
    const result = await delay(10);
    expect(result).toBeUndefined();
  });

  it('should handle zero delay', async () => {
    const start = Date.now();
    await delay(0);
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeLessThan(50);
  });
});

// =============================================================================
// CN (CLASS NAME MERGER)
// =============================================================================

describe('Utility - cn', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter falsy values', () => {
    const result = cn('base', false && 'conditional', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2'); // Later class should win
  });

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('should handle object syntax', () => {
    const result = cn({ active: true, disabled: false });
    expect(result).toBe('active');
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Utility - Integration', () => {
  it('should format balance and address for display', () => {
    const address = 'kaspa:qz1234567890abcdefghijklmnopqrstuvwxyz';
    const balance = 1500000000; // 15 KAS
    
    const displayAddress = formatAddress(address);
    const displayBalance = formatBalance(balance);
    
    expect(displayAddress.length).toBeLessThan(address.length);
    expect(displayBalance).toContain('KAS');
  });

  it('should generate and validate room codes', () => {
    const code = generateRoomCode();
    expect(isValidRoomCode(code)).toBe(true);
    
    // Modify it to be invalid
    const invalidCode = code.toLowerCase();
    expect(isValidRoomCode(invalidCode)).toBe(false);
  });
});
