import { base58 } from '@scure/base';
import {
  b64urlDecode,
  b64urlEncode,
  DEBIT_DOMAIN_SEP,
  encodeDebit,
  serializeAuthorization,
  type Base58Pubkey,
  type SolanaChallenge,
  type SolanaSessionAuthorization,
} from '@mppsol/core';
import type { Ed25519Signer, SequenceProvider } from './types.js';

export interface SignedDebit {
  debitBytes: Uint8Array;
  signature: Uint8Array;
}

export interface SignSessionDebitOptions {
  challenge: SolanaChallenge;
  session: Base58Pubkey;
  signer: Ed25519Signer;
  sequence: bigint;
  amount?: bigint;       // defaults to challenge.amount
  expiry?: bigint;       // defaults to challenge.deadline
}

// Build and sign an off-chain MPP session debit. The returned bytes can
// be posted in an `Authorization: Payment scheme="solana-session"` header.
export async function signSessionDebit(
  opts: SignSessionDebitOptions,
): Promise<SignedDebit> {
  const sessionBytes = base58.decode(opts.session);
  if (sessionBytes.length !== 32) {
    throw new Error(`session pubkey must decode to 32 bytes, got ${sessionBytes.length}`);
  }

  const debit = {
    session: sessionBytes,
    nonce: b64urlDecode(opts.challenge.nonce),
    amount: opts.amount ?? BigInt(opts.challenge.amount),
    expiry: opts.expiry ?? BigInt(opts.challenge.deadline),
    sequence: opts.sequence,
    domainSep: DEBIT_DOMAIN_SEP,
  };

  const debitBytes = encodeDebit(debit);
  const signature = await opts.signer.sign(debitBytes);
  if (signature.length !== 64) {
    throw new Error(`Ed25519 signature must be 64 bytes, got ${signature.length}`);
  }

  return { debitBytes, signature };
}

// Construct a complete session-mode Authorization header value.
export function buildSessionAuthorizationHeader(
  session: Base58Pubkey,
  signed: SignedDebit,
): string {
  const auth: SolanaSessionAuthorization = {
    scheme: 'solana-session',
    session,
    debit: b64urlEncode(signed.debitBytes),
    signature: b64urlEncode(signed.signature),
  };
  return serializeAuthorization(auth);
}

// Resolve a SequenceProvider that may be sync or async into a bigint.
export async function resolveSequence(
  provider: SequenceProvider,
): Promise<bigint> {
  const v = provider();
  return typeof (v as Promise<bigint>).then === 'function'
    ? await (v as Promise<bigint>)
    : (v as bigint);
}
