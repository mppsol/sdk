import { describe, it, expect } from 'vitest';
import {
  parseChallenge,
  serializeChallenge,
  parseAuthorization,
  serializeAuthorization,
  parseReceipt,
  serializeReceipt,
  serializeChallengeError,
  parseChallengeError,
  b64urlEncode,
  b64urlDecode,
  type SolanaChallenge,
  type SolanaDirectAuthorization,
  type SolanaSessionAuthorization,
  type SolanaDirectReceipt,
  type SolanaSessionReceipt,
} from '../src/index.js';

describe('challenge headers', () => {
  const base: SolanaChallenge = {
    realm: 'api.example.com',
    methods: ['solana-direct', 'solana-session'],
    cluster: 'mainnet-beta',
    recipient: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '1000',
    nonce: 'dGhpc2lzYXJhbmRvbW5vbmNlMzJieXRlcwAA',
    deadline: '1746489600',
    minConfirmations: 'confirmed',
  };

  it('round-trips a full challenge', () => {
    const serialized = serializeChallenge(base);
    const parsed = parseChallenge(serialized);
    expect(parsed).toEqual(base);
  });

  it('omits minConfirmations when not set', () => {
    const { minConfirmations: _, ...rest } = base;
    const serialized = serializeChallenge(rest);
    expect(serialized).not.toContain('solana-min-confirmations');
    const parsed = parseChallenge(serialized);
    expect(parsed.minConfirmations).toBeUndefined();
  });

  it('rejects non-Payment scheme', () => {
    expect(() => parseChallenge('Bearer token=abc')).toThrow(/unsupported HTTP auth scheme/);
  });

  it('rejects missing required parameter', () => {
    expect(() => parseChallenge('Payment realm="x"')).toThrow(/missing required parameter/);
  });

  it('parses challenge without optional minConfirmations', () => {
    const raw = 'Payment realm="x", methods="solana-direct", solana-cluster="devnet", solana-recipient="abc", solana-mint="def", solana-amount="100", solana-nonce="xyz", solana-deadline="123"';
    const parsed = parseChallenge(raw);
    expect(parsed.minConfirmations).toBeUndefined();
    expect(parsed.cluster).toBe('devnet');
  });
});

describe('authorization headers', () => {
  it('round-trips solana-direct authorization', () => {
    const auth: SolanaDirectAuthorization = {
      scheme: 'solana-direct',
      signature: 'AbCdEf123_-',
      nonce: 'XYZ987-_',
    };
    expect(parseAuthorization(serializeAuthorization(auth))).toEqual(auth);
  });

  it('round-trips solana-session authorization', () => {
    const auth: SolanaSessionAuthorization = {
      scheme: 'solana-session',
      session: '5JBp4XJk',
      debit: 'b64-debit-bytes',
      signature: 'b64-signature',
    };
    expect(parseAuthorization(serializeAuthorization(auth))).toEqual(auth);
  });

  it('rejects unknown scheme', () => {
    expect(() =>
      parseAuthorization('Payment scheme="ethereum", signature="x", nonce="y"'),
    ).toThrow(/unknown scheme/);
  });
});

describe('receipt headers', () => {
  it('round-trips solana-direct receipt', () => {
    const receipt: SolanaDirectReceipt = {
      scheme: 'solana-direct',
      tx: 'tx-sig-b64url',
      slot: '290000000',
      cluster: 'mainnet-beta',
      recipient: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: '1000',
      nonce: 'noncenoncenonce',
    };
    expect(parseReceipt(serializeReceipt(receipt))).toEqual(receipt);
  });

  it('round-trips solana-session receipt with optional settlement-tx', () => {
    const receipt: SolanaSessionReceipt = {
      scheme: 'solana-session',
      session: '5JBp4XJk',
      sequence: '42',
      amount: '1000',
      nonce: 'nonce',
      settlementTx: 'settlement-tx-sig',
    };
    expect(parseReceipt(serializeReceipt(receipt))).toEqual(receipt);
  });

  it('round-trips solana-session receipt without settlement-tx', () => {
    const receipt: SolanaSessionReceipt = {
      scheme: 'solana-session',
      session: '5JBp4XJk',
      sequence: '42',
      amount: '1000',
      nonce: 'nonce',
    };
    const parsed = parseReceipt(serializeReceipt(receipt));
    expect(parsed.scheme).toBe('solana-session');
    if (parsed.scheme === 'solana-session') {
      expect(parsed.settlementTx).toBeUndefined();
    }
  });
});

describe('error responses', () => {
  it('serializes and parses error param', () => {
    const raw = serializeChallengeError('nonce-reused');
    expect(raw).toBe('Payment error="nonce-reused"');
    expect(parseChallengeError(raw)).toBe('nonce-reused');
  });

  it('returns null when challenge has no error param', () => {
    const raw = 'Payment realm="x", methods="solana-direct"';
    expect(parseChallengeError(raw)).toBeNull();
  });

  it('returns null on malformed input', () => {
    expect(parseChallengeError('not even close')).toBeNull();
  });
});

describe('base64url helpers', () => {
  it('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 0xff, 0x80, 0x7f]);
    expect([...b64urlDecode(b64urlEncode(bytes))]).toEqual([...bytes]);
  });

  it('produces unpadded output', () => {
    const encoded = b64urlEncode(new Uint8Array([0]));
    expect(encoded).not.toContain('=');
  });
});
