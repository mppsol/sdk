# mppsol/sdk (deprecated)

> **This repository is deprecated as of 2026-05-09.** The published npm packages remain on the registry for existing consumers, but no new development happens here.
>
> **For Solana-native HTTP-402 payments**, use [`@solana/mpp`](https://github.com/solana-foundation/mpp-sdk) — the official Solana Foundation implementation, with multi-language SDKs (TypeScript, Rust, Go, Python, Lua) and active development.
>
> **For cross-VM settlement (EVM ↔ Solana)** — the gap mppsol now focuses on — see [`mppsol/spec`](https://github.com/mppsol/spec) and [`mppsol/cpi`](https://github.com/mppsol/cpi).

## Why this happened

These packages were created during the Solana Frontier Hackathon (April–May 2026) as the first community Solana-native MPP implementation. On 2026-03-18, the Solana Foundation shipped `@solana/mpp` as the official implementation — broader language coverage, Foundation backing, active maintenance.

Rather than maintain a parallel TS-only implementation in the same space, mppsol repositioned to focus on **cross-VM settlement** — payments originating in EVM contracts (Tempo, Arc, Megaeth) and settling atomically on Solana with on-chain Receipt PDAs. That's the gap the Foundation SDK doesn't address. See [mppsol.org](https://mppsol.org) for the new positioning.

## Packages (frozen at 0.1.0-draft.4)

| Package | npm |
| --- | --- |
| [`@mppsol/core`](./packages/core) | [`0.1.0-draft.4`](https://www.npmjs.com/package/@mppsol/core) — deprecated |
| [`@mppsol/server`](./packages/server) | [`0.1.0-draft.4`](https://www.npmjs.com/package/@mppsol/server) — deprecated |
| [`@mppsol/agent`](./packages/agent) | [`0.1.0-draft.4`](https://www.npmjs.com/package/@mppsol/agent) — deprecated |

All three deprecated 2026-05-09 with redirect messages on the npm registry pointing to `@solana/mpp`.

## Migration

| If you were using | Use instead |
| --- | --- |
| `@mppsol/core` | [`@solana/mpp`](https://www.npmjs.com/package/@solana/mpp) — covers types and canonical encodings |
| `@mppsol/server` | [`@solana/mpp`](https://www.npmjs.com/package/@solana/mpp) — server-side charge methods |
| `@mppsol/agent` | [`@solana/mpp`](https://www.npmjs.com/package/@solana/mpp) — client-side auto-402 + payment links |

The Foundation SDK's API differs from the `@mppsol/*` API. Migration requires real refactoring, not a drop-in replacement. The Foundation README at [`solana-foundation/mpp-sdk`](https://github.com/solana-foundation/mpp-sdk) documents the current shape.

## Repository disposition

This repository **may be archived** in the near future once the npm metadata reflects the deprecation broadly. Git history will remain accessible read-only; commits, PRs, and issues stay queryable.

## License

Apache 2.0 — see [LICENSE](./LICENSE).
