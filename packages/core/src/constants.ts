import type { Confirmation } from './types.js';

export const SPEC_VERSION = '0.1.0-draft.1';

// Domain separators bound into Ed25519-signed messages.
// Distinct separators prevent cross-context signature reuse.
// Encoded as inline byte arrays to avoid pulling in DOM/Node lib types.

// ASCII "MPP.SOL/DEBIT001" — 16 bytes
export const DEBIT_DOMAIN_SEP: Uint8Array = Uint8Array.of(
  0x4d, 0x50, 0x50, 0x2e, 0x53, 0x4f, 0x4c, 0x2f,
  0x44, 0x45, 0x42, 0x49, 0x54, 0x30, 0x30, 0x31,
);

// ASCII "MPP.SOL/RESULT01" — 16 bytes
export const RESULT_DOMAIN_SEP: Uint8Array = Uint8Array.of(
  0x4d, 0x50, 0x50, 0x2e, 0x53, 0x4f, 0x4c, 0x2f,
  0x52, 0x45, 0x53, 0x55, 0x4c, 0x54, 0x30, 0x31,
);

// CPI return-data discriminators. See spec/cpi.md §4.
// ASCII "PAY1" / "SES1" — 4 bytes each
export const PAY_RETURN_DISCRIMINATOR: Uint8Array =
  Uint8Array.of(0x50, 0x41, 0x59, 0x31);
export const SESSION_RETURN_DISCRIMINATOR: Uint8Array =
  Uint8Array.of(0x53, 0x45, 0x53, 0x31);

// Canonical byte sizes.
export const DEBIT_BYTE_LENGTH = 104;
export const SESSION_PDA_BYTE_LENGTH = 234;
export const PAY_RETURN_BYTE_LENGTH = 140;

// Default operational parameters. See spec/settlement.md.
export const DEFAULT_CONFIRMATION: Confirmation = 'confirmed';
export const DEFAULT_BATCH_SIZE = 32;
export const DEFAULT_BATCH_INTERVAL_SECS = 60;
export const DEFAULT_PRE_EXPIRY_MARGIN_SECS = 30;

// Well-known addresses.
export const USDC_MAINNET_MINT =
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDC_DEVNET_MINT =
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
export const MEMO_PROGRAM_ID =
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
export const ED25519_PROGRAM_ID =
  'Ed25519SigVerify111111111111111111111111111';
