import {
  b64urlEncode,
  serializeAuthorization,
  type SolanaChallenge,
  type SolanaDirectAuthorization,
} from '@mppsol/core';

// Construct a direct-mode Authorization header value from the tx
// signature returned by the caller's tx submission.
//
// The caller is responsible for:
//   1. Building the Solana transaction (SPL transfer + Memo or MPP CPI
//      nonce binding, per spec/wire.md §4.1).
//   2. Signing and submitting it.
//   3. Waiting for the configured commitment level.
//   4. Returning the 64-byte tx signature.
//
// This SDK does not include a transaction builder; use @solana/kit,
// @solana/web3.js, or any other Solana SDK in your DirectPayer.submit
// implementation.
export function buildDirectAuthorizationHeader(
  challenge: SolanaChallenge,
  txSignature: Uint8Array,
): string {
  if (txSignature.length !== 64) {
    throw new Error(`tx signature must be 64 bytes, got ${txSignature.length}`);
  }
  const auth: SolanaDirectAuthorization = {
    scheme: 'solana-direct',
    signature: b64urlEncode(txSignature),
    nonce: challenge.nonce,
  };
  return serializeAuthorization(auth);
}
