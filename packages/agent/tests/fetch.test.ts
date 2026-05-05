import { describe, it, expect, vi } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { base58 } from '@scure/base';
import { serializeChallenge, type SolanaChallenge } from '@mppsol/core';
import { generateSigner, mppFetch, MppPaymentError } from '../src/index.js';

function makeChallenge(): SolanaChallenge {
  return {
    realm: 'api.example.com',
    methods: ['solana-direct', 'solana-session'],
    cluster: 'mainnet-beta',
    recipient: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: '1000',
    nonce: 'q83NzwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    deadline: String(Math.floor(Date.now() / 1000) + 300),
  };
}

function challenge402(challenge: SolanaChallenge): Response {
  return new Response('Payment required', {
    status: 402,
    headers: { 'www-authenticate': serializeChallenge(challenge) },
  });
}

function ok200(body = 'ok', receipt?: string): Response {
  const headers: Record<string, string> = {};
  if (receipt) headers['payment-receipt'] = receipt;
  return new Response(body, { status: 200, headers });
}

describe('mppFetch — direct payer', () => {
  it('handles 402 → pay → retry → 200', async () => {
    const challenge = makeChallenge();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(challenge402(challenge))
      .mockResolvedValueOnce(ok200('content'));

    const submitMock = vi.fn().mockResolvedValue({ signature: new Uint8Array(64).fill(1) });

    const res = await mppFetch(
      'https://api.example.com/x',
      undefined,
      {
        payer: { kind: 'direct', submit: submitMock },
        fetch: fetchMock as unknown as typeof fetch,
      },
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('content');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({ realm: challenge.realm }));

    // Second call should have Authorization header
    const secondCall = fetchMock.mock.calls[1];
    const init = secondCall[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toMatch(/^Payment scheme="solana-direct"/);
  });

  it('passes through non-402 responses unchanged', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(ok200('already-paid'));
    const submitMock = vi.fn();

    const res = await mppFetch(
      'https://api.example.com/x',
      undefined,
      {
        payer: { kind: 'direct', submit: submitMock },
        fetch: fetchMock as unknown as typeof fetch,
      },
    );
    expect(res.status).toBe(200);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('throws MppPaymentError on 402 with error param', async () => {
    const errorRes = new Response('', {
      status: 402,
      headers: { 'www-authenticate': 'Payment error="nonce-reused"' },
    });
    const fetchMock = vi.fn().mockResolvedValueOnce(errorRes);
    const submitMock = vi.fn();

    await expect(
      mppFetch(
        'https://api.example.com/x',
        undefined,
        {
          payer: { kind: 'direct', submit: submitMock },
          fetch: fetchMock as unknown as typeof fetch,
        },
      ),
    ).rejects.toThrow(MppPaymentError);
  });

  it('rejects when server does not advertise solana-direct', async () => {
    const challenge = { ...makeChallenge(), methods: ['solana-session' as const] };
    const fetchMock = vi.fn().mockResolvedValueOnce(challenge402(challenge));
    const submitMock = vi.fn();

    await expect(
      mppFetch(
        'https://api.example.com/x',
        undefined,
        {
          payer: { kind: 'direct', submit: submitMock },
          fetch: fetchMock as unknown as typeof fetch,
        },
      ),
    ).rejects.toThrow(/does not advertise/);
  });
});

describe('mppFetch — session payer', () => {
  it('signs a debit and retries with proper Authorization', async () => {
    const { signer } = generateSigner();
    const sessionPub = base58.encode(
      ed25519.getPublicKey(ed25519.utils.randomPrivateKey()),
    );

    const challenge = makeChallenge();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(challenge402(challenge))
      .mockResolvedValueOnce(ok200('content'));

    let seq = 1n;
    const res = await mppFetch(
      'https://api.example.com/x',
      undefined,
      {
        payer: {
          kind: 'session',
          session: sessionPub,
          signer,
          nextSequence: () => seq++,
        },
        fetch: fetchMock as unknown as typeof fetch,
      },
    );

    expect(res.status).toBe(200);
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toMatch(/^Payment scheme="solana-session"/);
    expect(headers.get('authorization')).toContain(`session="${sessionPub}"`);
  });

  it('rejects when server does not advertise solana-session', async () => {
    const { signer } = generateSigner();
    const sessionPub = base58.encode(
      ed25519.getPublicKey(ed25519.utils.randomPrivateKey()),
    );
    const challenge = { ...makeChallenge(), methods: ['solana-direct' as const] };
    const fetchMock = vi.fn().mockResolvedValueOnce(challenge402(challenge));

    await expect(
      mppFetch(
        'https://api.example.com/x',
        undefined,
        {
          payer: {
            kind: 'session',
            session: sessionPub,
            signer,
            nextSequence: () => 1n,
          },
          fetch: fetchMock as unknown as typeof fetch,
        },
      ),
    ).rejects.toThrow(/does not advertise/);
  });
});
