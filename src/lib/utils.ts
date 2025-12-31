import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Kaspa address for display.
 * Shortens to first 10 and last 6 characters.
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 20) return address;
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

/**
 * Format a balance in sompi to KAS with proper decimals.
 * 1 KAS = 100,000,000 sompi
 */
export function formatBalance(sompi: bigint | number): string {
  const value = typeof sompi === "bigint" ? sompi : BigInt(sompi);
  const kas = Number(value) / 100_000_000;

  if (kas >= 1_000_000) {
    return `${(kas / 1_000_000).toFixed(2)}M KAS`;
  }
  if (kas >= 1_000) {
    return `${(kas / 1_000).toFixed(2)}K KAS`;
  }
  return `${kas.toFixed(2)} KAS`;
}

/**
 * Delay execution for a specified time.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random room code (6 alphanumeric characters).
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate a room code format.
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Parse error message from various error types.
 */
export function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}
