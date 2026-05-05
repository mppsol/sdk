import { describe, it, expect } from 'vitest';
import {
  encodeDebit,
  decodeDebit,
  DEBIT_DOMAIN_SEP,
  DEBIT_BYTE_LENGTH,
  type Debit,
} from '../src/index.js';

function makeDebit(overrides: Partial<Debit> = {}): Debit {
  return {
    session: new Uint8Array(32).fill(0xab),
    nonce: new Uint8Array(32).fill(0xcd),
    amount: 1000n,
    expiry: 1746489600n,
    sequence: 1n,
    domainSep: DEBIT_DOMAIN_SEP,
    ...overrides,
  };
}

describe('encodeDebit', () => {
  it('produces exactly DEBIT_BYTE_LENGTH bytes', () => {
    const bytes = encodeDebit(makeDebit());
    expect(bytes.length).toBe(DEBIT_BYTE_LENGTH);
    expect(DEBIT_BYTE_LENGTH).toBe(104);
  });

  it('uses little-endian for u64/i64 fields', () => {
    const bytes = encodeDebit(makeDebit({ amount: 1n, expiry: 0n, sequence: 0n }));
    // amount is at offset 64 (after 32-byte session + 32-byte nonce)
    expect(bytes[64]).toBe(1);
    expect(bytes[65]).toBe(0);
  });

  it('rejects 31-byte session', () => {
    expect(() => encodeDebit(makeDebit({ session: new Uint8Array(31) }))).toThrow(
      /session must be 32 bytes/,
    );
  });

  it('rejects 33-byte nonce', () => {
    expect(() => encodeDebit(makeDebit({ nonce: new Uint8Array(33) }))).toThrow(
      /nonce must be 32 bytes/,
    );
  });

  it('rejects wrong domain separator length', () => {
    expect(() => encodeDebit(makeDebit({ domainSep: new Uint8Array(15) }))).toThrow(
      /domainSep must be 16 bytes/,
    );
  });

  it('rejects wrong domain separator content', () => {
    const bad = new Uint8Array(16);
    bad.set(new TextEncoder().encode('NOT.MPP.SOL/DEB1'));
    expect(() => encodeDebit(makeDebit({ domainSep: bad }))).toThrow(
      /does not match DEBIT_DOMAIN_SEP/,
    );
  });
});

describe('decodeDebit', () => {
  it('round-trips encoded debits', () => {
    const original = makeDebit({
      amount: 9999n,
      expiry: 1800000000n,
      sequence: 42n,
    });
    const decoded = decodeDebit(encodeDebit(original));
    expect(decoded.amount).toBe(9999n);
    expect(decoded.expiry).toBe(1800000000n);
    expect(decoded.sequence).toBe(42n);
    expect([...decoded.session]).toEqual([...original.session]);
    expect([...decoded.nonce]).toEqual([...original.nonce]);
  });

  it('rejects byte arrays of the wrong length', () => {
    expect(() => decodeDebit(new Uint8Array(103))).toThrow(/expected 104/);
    expect(() => decodeDebit(new Uint8Array(105))).toThrow(/expected 104/);
  });

  it('rejects bytes with wrong domain separator', () => {
    const bytes = encodeDebit(makeDebit());
    bytes[bytes.length - 1] = 0xff; // corrupt the domain separator
    expect(() => decodeDebit(bytes)).toThrow(/invalid domain separator/);
  });

  it('preserves max u64 amount', () => {
    const max = 2n ** 64n - 1n;
    const decoded = decodeDebit(encodeDebit(makeDebit({ amount: max })));
    expect(decoded.amount).toBe(max);
  });

  it('preserves negative i64 expiry', () => {
    const decoded = decodeDebit(encodeDebit(makeDebit({ expiry: -1n })));
    expect(decoded.expiry).toBe(-1n);
  });
});
