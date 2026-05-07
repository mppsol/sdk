# @mppsol/agent

[![CI](https://github.com/mppsol/agent/actions/workflows/ci.yml/badge.svg)](https://github.com/mppsol/agent/actions/workflows/ci.yml)

Client SDK for paying [MPP.sol](https://mppsol.org)-priced HTTP resources
on Solana. Drop-in `mppFetch()` wrapper that handles `402 Payment
Required` automatically.

- **Session mode:** end-to-end. No Solana SDK needed — pure JS, runs in
  any modern runtime (Node 20+, Bun, Deno, Cloudflare Workers, browser).
- **Direct mode:** primitives provided; you bring the Solana
  transaction-builder of your choice (`@solana/kit`, `@solana/web3.js`,
  Anchor, etc.).

## Install

```sh
npm install @mppsol/agent
```

## Quick start: session mode

The simplest case. Once your session is open on-chain, paying for any
MPP-protected endpoint is one line:

```ts
import { mppFetch, keypairSigner } from '@mppsol/agent';

const signer = keypairSigner(myAuthorizedSignerPrivateKey);
let nextSeq = 1n;

const res = await mppFetch(
  'https://api.example.com/v1/joke',
  undefined,
  {
    payer: {
      kind: 'session',
      session: 'JBdRTo1Sd5e9pTBFvCe5LWy6ZKMZkHYZcZJYdj5LuZbW',
      signer,
      nextSequence: () => nextSeq++,
    },
  },
);

console.log(await res.text());
console.log('Receipt:', res.headers.get('payment-receipt'));
```

The fetch wrapper:
1. Sends the request, sees `402`.
2. Parses the `WWW-Authenticate: Payment` challenge.
3. Signs an off-chain debit message with your `authorized_signer`.
4. Retries with `Authorization: Payment scheme="solana-session", ...`.
5. Returns the 2xx response with the `Payment-Receipt` header preserved.

## Quick start: direct mode

You build and submit the Solana transaction; this SDK constructs the
`Authorization` header from your tx signature.

```ts
import { mppFetch } from '@mppsol/agent';
import { buildAndSubmitDirectPayment } from './my-solana-helper.js';

const res = await mppFetch(
  'https://api.example.com/v1/joke',
  undefined,
  {
    payer: {
      kind: 'direct',
      submit: async (challenge) => {
        // YOUR CODE: build SPL transfer + Memo(nonce), sign, submit,
        // wait for confirmation. Return the 64-byte tx signature.
        const signature = await buildAndSubmitDirectPayment({
          recipient: challenge.recipient,
          mint: challenge.mint,
          amount: BigInt(challenge.amount),
          nonce: challenge.nonce,
          deadline: challenge.deadline,
        });
        return { signature };
      },
    },
  },
);
```

A reference `buildAndSubmitDirectPayment` using `@solana/kit` is in the
`examples/` directory of this repo (todo: add).

## Lower-level primitives

If you don't want the auto-fetch wrapper, use the building blocks
directly:

```ts
import {
  parseChallenge,
  signSessionDebit,
  buildSessionAuthorizationHeader,
  parseReceipt,
} from '@mppsol/agent';

// 1. Get a 402 response somehow
const res402 = await fetch(url);
const challenge = parseChallenge(res402.headers.get('www-authenticate')!);

// 2. Sign a debit
const signed = await signSessionDebit({
  challenge,
  session: mySessionPubkey,
  signer: myEd25519Signer,
  sequence: nextSequence,
});

// 3. Build the header
const authHeader = buildSessionAuthorizationHeader(mySessionPubkey, signed);

// 4. Retry
const final = await fetch(url, { headers: { authorization: authHeader } });

// 5. Inspect receipt
const receipt = parseReceipt(final.headers.get('payment-receipt')!);
```

## Signers

`keypairSigner(privateKey)` is a reference Ed25519 signer using
in-process keys. For HSM, hardware wallet, browser-wallet adapter, or
any other custody solution, implement the `Ed25519Signer` interface:

```ts
interface Ed25519Signer {
  publicKey: Base58Pubkey;             // base58 of the 32-byte pubkey
  sign(message: Uint8Array): Promise<Uint8Array> | Uint8Array;
}
```

## Sequence management

The session program enforces strictly monotonic sequence numbers. The
caller is responsible for persistence and uniqueness across processes —
the SDK takes a `nextSequence: () => bigint | Promise<bigint>` callback.

For a single in-process worker, an incrementing counter is fine. For
multi-process or restart-safe operation, persist the next sequence to a
durable store (e.g. Postgres `RETURNING`-incremented column, Redis
`INCR`).

## Errors

`MppPaymentError` is thrown when the server responds with a 402
containing an `error=` parameter (e.g. `nonce-reused`, `cap-exceeded`).
Inspect `.code` and `.response`.

## What's NOT in this package

- **Solana transaction builder for direct mode.** Bring your own
  Solana SDK in `DirectPayer.submit`.
- **Session opening / topup / revoke** on-chain. Those are once-per-session
  setup actions; use `@solana/kit` or your preferred SDK directly. The
  on-chain instruction layouts are in
  [`spec/session.md`](https://github.com/mppsol/spec/blob/main/spec/session.md).
- **Sequence persistence.** Caller responsibility.

## Examples

See [`examples/`](./examples/) for runnable clients in both direct mode
(`pay-direct.ts`) and session mode (`pay-session.ts`).

## Status

**v0.1 draft. Direct mode primitives shippable. Session mode signing
works in code but is pointless until the on-chain session program
deploys.**

| Capability | Status | End-to-end usable today |
| --- | --- | --- |
| `mppFetch()` wrapper (auto-handles 402) | ✅ full impl + tests | ✅ for direct mode |
| `buildDirectAuthorizationHeader` | ✅ — pair with your own Solana SDK | ✅ |
| `signSessionDebit` + Ed25519 keypair signer | ✅ produces valid signed debits | ❌ no on-chain Session PDA to debit against |
| Header parser (`parseChallenge`, `parseReceipt`) | ✅ via `@mppsol/core` | ✅ |
| `keypairSigner` / `generateSigner` | ✅ | ✅ |

Session-mode signing produces valid 104-byte debits + 64-byte Ed25519
signatures that `@mppsol/server` accepts in tests. End-to-end, however,
requires the [`@mppsol/cpi`](https://github.com/mppsol/cpi) on-chain
program to exist so a user has a Session PDA to sign debits against.
That program is blocked on a Solana toolchain issue; will deploy once
Solana platform-tools v1.49+ ships.

Breaking changes possible before v1.0.

## License

Apache-2.0. Maintained by [psyto](https://github.com/psyto).
