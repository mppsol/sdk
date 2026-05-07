# mppsol/sdk

TypeScript SDK monorepo for [MPP.sol](https://mppsol.org) — Machine Payments Protocol on Solana.

This repo consolidates three previously-separate npm packages into a single workspace so that protocol changes can land atomically across the type definitions, server middleware, and client agent.

## Packages

| Package | Purpose | npm |
| --- | --- | --- |
| [`@mppsol/core`](./packages/core) | Shared types, canonical encodings, receipt format. | `npm i @mppsol/core` |
| [`@mppsol/server`](./packages/server) | HTTP middleware emitting MPP `402` challenges and verifying Solana payments. Hono adapter included. | `npm i @mppsol/server` |
| [`@mppsol/agent`](./packages/agent) | Client SDK for paying MPP-priced HTTP resources via Solana. | `npm i @mppsol/agent` |

`@mppsol/server` and `@mppsol/agent` both depend on `@mppsol/core` and are versioned independently via [Changesets](https://github.com/changesets/changesets).

## Related repos

- [`mppsol/spec`](https://github.com/mppsol/spec) — protocol specification (canonical document).
- [`mppsol/cpi`](https://github.com/mppsol/cpi) — Solana on-chain program exposing MPP semantics as a CPI target.

## Development

Required toolchain: Node 20+ and `pnpm` 9+.

```sh
pnpm install
pnpm -r build
pnpm -r test
```

## Releasing

```sh
pnpm changeset             # describe the change
git commit -am "feat: ..."  # commit code + changeset together
git push
```

CI opens a release PR; merging it bumps versions, updates changelogs, and publishes to npm.

## History

This repo was created on 2026-05-07 by merging the histories of `mppsol/core`, `mppsol/server`, and `mppsol/agent` (now archived) using `git filter-repo` to preserve `git log` and `git blame` for every file.

## License

Apache 2.0 — see [LICENSE](./LICENSE).
