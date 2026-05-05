# @mppsol/core

[![CI](https://github.com/mppsol/core/actions/workflows/ci.yml/badge.svg)](https://github.com/mppsol/core/actions/workflows/ci.yml)

Shared TypeScript types and canonical encodings for [MPP.sol](https://mppsol.org) —
the Machine Payments Protocol on Solana.

This package is the dependency-free foundation that
[`@mppsol/server`](https://github.com/mppsol/server),
[`@mppsol/agent`](https://github.com/mppsol/agent), and
[`@mppsol/cpi`](https://github.com/mppsol/cpi) all consume.

## Install

```sh
npm install @mppsol/core
```

## What's in here

- **Wire types** — `SolanaChallenge`, `SolanaAuthorization`, `SolanaReceipt`
  matching the HTTP header structures defined in
  [`spec/wire.md`](https://github.com/mppsol/spec/blob/main/spec/wire.md).
- **On-chain types** — `Session`, `SessionState`, `PayReturn`,
  `SessionSettleReturn` matching the structures in
  [`spec/session.md`](https://github.com/mppsol/spec/blob/main/spec/session.md)
  and [`spec/cpi.md`](https://github.com/mppsol/spec/blob/main/spec/cpi.md).
- **Canonical debit encoding** — `encodeDebit` / `decodeDebit` for the
  122-byte off-chain debit message that gets Ed25519-signed.
- **Constants** — domain separators (`DEBIT_DOMAIN_SEP`,
  `RESULT_DOMAIN_SEP`), CPI return-data discriminators, default batching
  parameters, and well-known mint/program IDs.
- **Errors** — `MppErrorCode` enum and `MppSolError` class matching the
  error vocabulary in [`spec/wire.md` §9](https://github.com/mppsol/spec/blob/main/spec/wire.md#9-errors).

## Example

```ts
import {
  encodeDebit,
  DEBIT_DOMAIN_SEP,
  type Debit,
} from '@mppsol/core';

const debit: Debit = {
  session: new Uint8Array(32),  // session PDA pubkey bytes
  nonce: new Uint8Array(32),    // server-issued challenge nonce
  amount: 1000n,                // atomic units
  expiry: BigInt(Math.floor(Date.now() / 1000) + 60),
  sequence: 1n,
  domainSep: DEBIT_DOMAIN_SEP,
};

const bytes = encodeDebit(debit);   // 122 bytes
// sign `bytes` with the session's authorized_signer Ed25519 key,
// send {session, debit: base64url(bytes), signature: base64url(sig)}
// in the Authorization: Payment header.
```

## Design choices

- **No Solana SDK dependency.** Pubkeys are exposed as base58 `string`
  values; consumers convert to `PublicKey` from `@solana/web3.js`,
  Kit, or any other SDK as they prefer. This package builds without
  pulling in a Solana runtime.
- **`bigint` for u64/i64.** All on-chain integer fields are `bigint` to
  preserve full precision. Wire-level (HTTP) amounts remain `string`
  per the spec.
- **Canonical encoding only.** This package does not Ed25519-sign,
  hash, or talk to RPCs. Higher-level packages do that on top of these
  primitives.

## Status

**v0.1 draft, fully implemented and tested.** All wire-format types,
encoders/decoders, and parsers ship as production code. 37 vitest tests
passing. Breaking changes possible before v1.0.

| Capability | Status |
| --- | --- |
| Wire types (`SolanaChallenge`, `SolanaAuthorization`, `SolanaReceipt`) | ✅ |
| Header parser/serializer | ✅ |
| Canonical 104-byte debit encoding (`encodeDebit` / `decodeDebit`) | ✅ |
| On-chain account types (read-side) — `Session`, `PayReturn`, `SessionSettleReturn` | ✅ |
| Constants (domain separators, well-known mints, defaults) | ✅ |
| Errors (`MppErrorCode`, `MppSolError`) | ✅ |

This is the foundation package — all other `@mppsol/*` packages depend
on it. No runtime dep on `@solana/web3.js` or `@solana/kit`; pubkeys
are exposed as base58 strings.

## License

Apache-2.0. Maintained by [psyto](https://github.com/psyto).
