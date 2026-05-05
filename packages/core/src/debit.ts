import type { Debit } from './types.js';
import { DEBIT_BYTE_LENGTH, DEBIT_DOMAIN_SEP } from './constants.js';

// Canonical little-endian serialization of an off-chain debit message.
// Layout (122 bytes):
//   session    [u8; 32]
//   nonce      [u8; 32]
//   amount      u64       (little-endian)
//   expiry      i64       (little-endian)
//   sequence    u64       (little-endian)
//   domain_sep [u8; 16]   (== DEBIT_DOMAIN_SEP)
//
// This is the exact byte sequence that gets Ed25519-signed by the
// session's authorized_signer and verified on-chain. Any divergence
// will cause signature verification to fail.
export function encodeDebit(debit: Debit): Uint8Array {
  if (debit.session.length !== 32) {
    throw new Error(`debit.session must be 32 bytes, got ${debit.session.length}`);
  }
  if (debit.nonce.length !== 32) {
    throw new Error(`debit.nonce must be 32 bytes, got ${debit.nonce.length}`);
  }
  if (debit.domainSep.length !== 16) {
    throw new Error(`debit.domainSep must be 16 bytes, got ${debit.domainSep.length}`);
  }
  if (!bytesEqual(debit.domainSep, DEBIT_DOMAIN_SEP)) {
    throw new Error('debit.domainSep does not match DEBIT_DOMAIN_SEP');
  }

  const out = new Uint8Array(DEBIT_BYTE_LENGTH);
  const view = new DataView(out.buffer);
  let off = 0;

  out.set(debit.session, off);
  off += 32;
  out.set(debit.nonce, off);
  off += 32;
  view.setBigUint64(off, debit.amount, true);
  off += 8;
  view.setBigInt64(off, debit.expiry, true);
  off += 8;
  view.setBigUint64(off, debit.sequence, true);
  off += 8;
  out.set(debit.domainSep, off);

  return out;
}

export function decodeDebit(bytes: Uint8Array): Debit {
  if (bytes.length !== DEBIT_BYTE_LENGTH) {
    throw new Error(
      `expected ${DEBIT_BYTE_LENGTH} bytes for a debit, got ${bytes.length}`,
    );
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 0;

  const session = bytes.slice(off, off + 32);
  off += 32;
  const nonce = bytes.slice(off, off + 32);
  off += 32;
  const amount = view.getBigUint64(off, true);
  off += 8;
  const expiry = view.getBigInt64(off, true);
  off += 8;
  const sequence = view.getBigUint64(off, true);
  off += 8;
  const domainSep = bytes.slice(off, off + 16);

  if (!bytesEqual(domainSep, DEBIT_DOMAIN_SEP)) {
    throw new Error('decoded debit has invalid domain separator');
  }

  return { session, nonce, amount, expiry, sequence, domainSep };
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
