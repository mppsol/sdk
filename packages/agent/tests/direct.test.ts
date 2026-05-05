import { describe, it, expect } from 'vitest';
import { b64urlEncode, type SolanaChallenge } from '@mppsol/core';
import { buildDirectAuthorizationHeader } from '../src/index.js';

const challenge: SolanaChallenge = {
  realm: 'x',
  methods: ['solana-direct'],
  cluster: 'mainnet-beta',
  recipient: 'r',
  mint: 'm',
  amount: '1000',
  nonce: 'q83NzwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  deadline: '1746489600',
};

describe('buildDirectAuthorizationHeader', () => {
  it('produces a valid Authorization: Payment header', () => {
    const txSig = new Uint8Array(64).fill(0xab);
    const header = buildDirectAuthorizationHeader(challenge, txSig);
    expect(header).toMatch(/^Payment scheme="solana-direct"/);
    expect(header).toContain(`signature="${b64urlEncode(txSig)}"`);
    expect(header).toContain(`nonce="${challenge.nonce}"`);
  });

  it('rejects signature of wrong length', () => {
    expect(() => buildDirectAuthorizationHeader(challenge, new Uint8Array(63))).toThrow(
      /must be 64 bytes/,
    );
    expect(() => buildDirectAuthorizationHeader(challenge, new Uint8Array(65))).toThrow(
      /must be 64 bytes/,
    );
  });
});
