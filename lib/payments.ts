import { isAddress, parseUnits } from "viem";

export const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const DEFAULT_PRICE_USDC = "0.1";

export function getDeepReadingPriceLabel(): string {
  return process.env.NEXT_PUBLIC_DEEP_READING_PRICE_USDC?.trim() || DEFAULT_PRICE_USDC;
}

export function getDeepReadingPriceUnits(): bigint {
  return parseUnits(getDeepReadingPriceLabel(), 6);
}

export function getPaymentRecipient(): string {
  return process.env.NEXT_PUBLIC_USDC_RECEIVER?.trim() || "";
}

export function hasValidPaymentRecipient(): boolean {
  return isAddress(getPaymentRecipient());
}

export function toBaseScanTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}
