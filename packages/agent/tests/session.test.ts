import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { base58 } from '@scure/base';
import {
  b64urlDecode,
  decodeDebit,
  DEBIT_DOMAIN_SEP,
  type SolanaChallenge,
} from '@mppsol/core';
import {
  signSessionDebit,
  buildSessionAuthorizationHeader,
  resolveSequence,
  generateSigner,
  keypairSigner,
} from '../src/index.js';

function makeSessionPubkey() {
  return base58.encode(ed25519.getPublicKey(ed25519.utils.randomPrivateKey()));
}

function makeChallenge(): SolanaChallenge {
  return {
    realm: 'x',
    methods: ['solana-session'],
    cluster: 'mainnet-beta',
    recipient: 'r',
    mint: 'm',
    amount: '1000',
    nonce: 'q83NzwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    deadline: String(Math.floor(Date.now() / 1000) + 300),
  };
}

describe('signSessionDebit', () => {
  it('produces 104-byte debit + 64-byte signature', async () => {
    const { signer } = generateSigner();
    const session = makeSessionPubkey();
    const signed = await signSessionDebit({
      challenge: makeChallenge(),
      session,
      signer,
      sequence: 1n,
    });
    expect(signed.debitBytes.length).toBe(104);
    expect(signed.signature.length).toBe(64);
  });

  it('signature verifies with the signer pubkey', async () => {
    const { signer } = generateSigner();
    const session = makeSessionPubkey();
    const signed = await signSessionDebit({
      challenge: makeChallenge(),
      session,
      signer,
      sequence: 1n,
    });
    const ok = ed25519.verify(
      signed.signature,
      signed.debitBytes,
      base58.decode(signer.publicKey),
    );
    expect(ok).toBe(true);
  });

  it('debit decodes with correct domain separator', async () => {
    const { signer } = generateSigner();
    const session = makeSessionPubkey();
    const signed = await signSessionDebit({
      challenge: makeChallenge(),
      session,
      signer,
      sequence: 7n,
    });
    const decoded = decodeDebit(signed.debitBytes);
    expect([...decoded.domainSep]).toEqual([...DEBIT_DOMAIN_SEP]);
    expect(decoded.sequence).toBe(7n);
    expect(decoded.amount).toBe(1000n);
  });

  it('honors amount override', async () => {
    const { signer } = generateSigner();
    const session = makeSessionPubkey();
    const signed = await signSessionDebit({
      challenge: makeChallenge(),
      session,
      signer,
      sequence: 1n,
      amount: 500n,
    });
    expect(decodeDebit(signed.debitBytes).amount).toBe(500n);
  });

  it('honors expiry override', async () => {
    const { signer } = generateSigner();
    const session = makeSessionPubkey();
    const customExpiry = BigInt(Math.floor(Date.now() / 1000) + 10);
    const signed = await signSessionDebit({
      challenge: makeChallenge(),
      session,
      signer,
      sequence: 1n,
      expiry: customExpiry,
    });
    expect(decodeDebit(signed.debitBytes).expiry).toBe(customExpiry);
  });

  it('rejects malformed session pubkey', async () => {
    const { signer } = generateSigner();
    await expect(
      signSessionDebit({
        challenge: makeChallenge(),
        session: '1', // 1 byte after base58 decode
        signer,
        sequence: 1n,
      }),
    ).rejects.toThrow();
  });
});

describe('buildSessionAuthorizationHeader', () => {
  it('produces a valid Authorization: Payment header', async () => {
    const { signer } = generateSigner();
    const session = makeSessionPubkey();
    const signed = await signSessionDebit({
      challenge: makeChallenge(),
      session,
      signer,
      sequence: 1n,
    });
    const header = buildSessionAuthorizationHeader(session, signed);
    expect(header).toMatch(/^Payment scheme="solana-session"/);
    expect(header).toContain(`session="${session}"`);
    expect(header).toContain('debit="');
    expect(header).toContain('signature="');
  });
});

describe('keypairSigner', () => {
  it('rejects 31-byte keys', () => {
    expect(() => keypairSigner(new Uint8Array(31))).toThrow(/32 bytes/);
  });

  it('produces a stable pubkey from the same private key', () => {
    const priv = new Uint8Array(32).fill(0x42);
    const a = keypairSigner(priv);
    const b = keypairSigner(priv);
    expect(a.publicKey).toBe(b.publicKey);
  });
});

describe('resolveSequence', () => {
  it('handles sync providers', async () => {
    expect(await resolveSequence(() => 5n)).toBe(5n);
  });

  it('handles async providers', async () => {
    expect(await resolveSequence(async () => 7n)).toBe(7n);
  });
});
