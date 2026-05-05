// Session-mode client: pay for an MPP-protected endpoint by signing
// an off-chain debit message. Requires an active session PDA on-chain
// owned by your wallet and authorizing this signer (see
// /Users/hiroyusai/src/mppsol-cpi/examples/open-session.ts to create one).
//
// Run: bun run examples/pay-session.ts
//
// Prerequisites:
//   - A session opened on devnet (see mppsol-cpi/examples/open-session.ts)
//   - The session's authorized_signer private key
//   - The MPP server running at MPP_URL (default: http://localhost:3000/joke)

import { mppFetch, keypairSigner } from '@mppsol/agent';
import { readFileSync } from 'node:fs';

const URL = process.env.MPP_URL ?? 'http://localhost:3000/joke';

// Session PDA pubkey (output of open-session.ts).
const SESSION = process.env.MPPSOL_SESSION ?? 'YOUR_SESSION_PDA';

// Authorized-signer private key (32 bytes raw OR JSON array of 64 bytes).
// open-session.ts saves it to ./authorized-signer.json by default.
const SIGNER_PATH = process.env.SIGNER ?? './authorized-signer.json';
const raw = JSON.parse(readFileSync(SIGNER_PATH, 'utf8'));
const privateKey = Uint8Array.from(raw).slice(0, 32);
const signer = keypairSigner(privateKey);

// Persist sequence to disk so restarts don't reuse old sequences.
// In production: a Postgres `RETURNING`-incremented column or Redis INCR.
let nextSeq = 1n;
try { nextSeq = BigInt(readFileSync('.session-seq', 'utf8').trim()); } catch {}

const res = await mppFetch(URL, undefined, {
  payer: {
    kind: 'session',
    session: SESSION,
    signer,
    nextSequence: () => {
      const s = nextSeq++;
      // Persist for next run.
      require('node:fs').writeFileSync('.session-seq', String(nextSeq));
      return s;
    },
  },
});

console.log('Status:', res.status);
console.log('Body:', await res.text());
console.log('Receipt:', res.headers.get('payment-receipt'));
