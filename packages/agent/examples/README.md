# @mppsol/agent examples

Two clients for an MPP-protected endpoint, one per settlement scheme.

| File | Mode | When to use |
| --- | --- | --- |
| `pay-direct.ts` | `solana-direct` (one-shot) | First payment to a server, or low-frequency calls. No on-chain setup needed. |
| `pay-session.ts` | `solana-session` (streamed debits) | High-frequency calls. Requires a session opened on-chain first. |

Both expect a server running at `MPP_URL` (default
`http://localhost:3000/joke`). Spin one up with
`/Users/hiroyusai/src/mppsol-server/examples/hono.ts`.

## pay-direct.ts

Pays by building a Solana tx (USDC transfer + Memo nonce binding) using
`@solana/web3.js`. The agent SDK does not include a transaction builder
for direct mode — you bring your own Solana SDK.

### Setup

```sh
npm install @solana/web3.js @solana/spl-token bs58
spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --url devnet
spl-token transfer ... # fund yourself from a devnet faucet first
```

### Run

```sh
export MY_USDC_ATA=<your-devnet-usdc-token-account>
bun run examples/pay-direct.ts
```

### What you'll see

```
Status: 200
Body: Why don't scientists trust atoms? Because they make up everything.
Receipt: Payment scheme="solana-direct", tx="...", slot="...", ...
```

## pay-session.ts

Signs an off-chain debit message — no Solana SDK needed (Ed25519 via
`@noble/curves`, already a dep of `@mppsol/agent`).

### Setup

You need a session opened on devnet first. Run the cpi example:

```sh
cd /Users/hiroyusai/src/mppsol-cpi
bun run examples/open-session.ts
# ...prints the session PDA pubkey and writes ./authorized-signer.json
```

Note the printed session pubkey, then in the agent example:

```sh
export MPPSOL_SESSION=<session-pda>
export SIGNER=/Users/hiroyusai/src/mppsol-cpi/authorized-signer.json
bun run examples/pay-session.ts
```

### What you'll see

Same `200 + body + receipt` as direct mode, but with `scheme="solana-session"`
and a `sequence` field in the receipt. Server-side, no on-chain tx
happens per request — settlement is batched by the server.

## Production notes

- For `pay-direct`, persist nothing — each request issues a fresh nonce.
- For `pay-session`, the **sequence number must be strictly monotonic**
  per session. The example writes `.session-seq` to disk; production
  should use a database with row-level locking (e.g. Postgres
  `UPDATE ... RETURNING`) so concurrent agents don't reuse sequences.
