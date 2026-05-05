import type { Base58Pubkey, SolanaChallenge } from '@mppsol/core';

// Abstract Ed25519 signer. Lets users plug in their own key custody —
// in-process keypair, OS keychain, HSM, hardware wallet, browser wallet
// adapter, etc.
export interface Ed25519Signer {
  publicKey: Base58Pubkey;
  sign(message: Uint8Array): Promise<Uint8Array> | Uint8Array;
}

// Provides the next monotonic sequence number for a session. Caller is
// responsible for persistence and uniqueness across processes.
export type SequenceProvider =
  | (() => bigint)
  | (() => Promise<bigint>);

// Direct-mode payer: caller provides a function that builds, signs, and
// submits a Solana transaction satisfying the challenge, returning the
// 64-byte transaction signature once confirmed at the requested commitment.
//
// This SDK does NOT include a Solana transaction builder. Use @solana/kit,
// @solana/web3.js, or any other library of your choice in `submit`.
export interface DirectPayer {
  kind: 'direct';
  submit: (challenge: SolanaChallenge) => Promise<{
    signature: Uint8Array;
  }>;
}

// Session-mode payer: caller provides session pubkey, the signer holding
// the session's authorized_signer key, and a sequence provider.
export interface SessionPayer {
  kind: 'session';
  session: Base58Pubkey;
  signer: Ed25519Signer;
  nextSequence: SequenceProvider;
  // Optional cap on per-debit amount (defaults to challenge.amount).
  debitAmount?: (challenge: SolanaChallenge) => bigint;
  // Optional debit expiry override (defaults to challenge.deadline).
  debitExpiry?: (challenge: SolanaChallenge) => bigint;
}

export type Payer = DirectPayer | SessionPayer;

export interface MppFetchOptions {
  payer: Payer;
  // How many 402 retries to attempt (default 1).
  maxRetries?: number;
  // Optional underlying fetch implementation (default globalThis.fetch).
  fetch?: typeof fetch;
}
