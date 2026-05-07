// Direct-mode client: pay for an MPP-protected endpoint by building a
// Solana transaction (USDC transfer + Memo nonce binding) ourselves.
// Uses @solana/web3.js because @mppsol/agent does NOT include a tx
// builder for direct mode (you bring your own SDK).
//
// Run: bun run examples/pay-direct.ts
//
// Prerequisites:
//   - A devnet USDC token account funded with at least 0.001 USDC.
//   - The MPP server running at MPP_URL (default: http://localhost:3000/joke).

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { mppFetch } from '@mppsol/agent';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const URL = process.env.MPP_URL ?? 'http://localhost:3000/joke';
const RPC = process.env.SOLANA_RPC ?? 'https://api.devnet.solana.com';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Load your devnet keypair from ~/.config/solana/id.json (or override).
const keypairPath = process.env.WALLET ?? `${homedir()}/.config/solana/id.json`;
const me = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(readFileSync(keypairPath, 'utf8'))),
);
const connection = new Connection(RPC, 'confirmed');

// Your USDC token account on devnet (the source of funds).
// Get one: spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU --url devnet
const MY_USDC_ATA = new PublicKey(
  process.env.MY_USDC_ATA ?? 'YOUR_DEVNET_USDC_TOKEN_ACCOUNT_HERE',
);

const res = await mppFetch(URL, undefined, {
  payer: {
    kind: 'direct',
    submit: async (challenge) => {
      const recipient = new PublicKey(challenge.recipient);
      const mint = new PublicKey(challenge.mint as string);
      const amount = BigInt(challenge.amount);

      // Decode the server's nonce (base64url, 32 bytes) for the Memo binding.
      const nonceB64 = challenge.nonce.replace(/-/g, '+').replace(/_/g, '/');
      const padded = nonceB64.padEnd(Math.ceil(nonceB64.length / 4) * 4, '=');

      const tx = new Transaction()
        .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 30_000 }))
        .add(createTransferCheckedInstruction(
          MY_USDC_ATA, mint, recipient, me.publicKey, amount, 6,
          [], TOKEN_PROGRAM_ID,
        ))
        .add(new TransactionInstruction({
          programId: MEMO_PROGRAM_ID,
          keys: [],
          // The Memo program reads its instruction data as UTF-8.
          // We pass the b64url-encoded nonce string so the server can
          // match it byte-for-byte against its issued nonce.
          data: Buffer.from(challenge.nonce, 'utf8'),
        }));

      const sig = await sendAndConfirmTransaction(connection, tx, [me], {
        commitment: 'confirmed',
      });

      // Convert the base58 signature returned by web3.js into the
      // 64 raw bytes the agent SDK expects.
      const { default: bs58 } = await import('bs58');
      return { signature: bs58.decode(sig) };
    },
  },
});

console.log('Status:', res.status);
console.log('Body:', await res.text());
console.log('Receipt:', res.headers.get('payment-receipt'));
